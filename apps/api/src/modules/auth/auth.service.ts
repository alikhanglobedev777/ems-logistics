import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type {
  AuthLoginRequest,
  AuthRegisterRequest,
  RefreshTokenRequest,
} from '@ems/api-contract';
import { createHash, randomBytes } from 'node:crypto';
import { toAuthResponse, toLogoutResponse, toMeResponse } from './auth.mapper';
import { AuthRepository, type AuthUserRecord } from './auth.repository';
import { hashPassword, verifyPassword } from './password.utils';

const PUBLIC_REGISTRATION_ROLE = 'customer';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function requiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException({
      error: {
        code: 'REQUIRED_FIELD',
        message: `${fieldName} is required`,
      },
    });
  }

  return value.trim();
}

function optionalString(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new BadRequestException({
      error: { code: 'INVALID_FIELD', message: 'Expected a string value' },
    });
  }

  return value.trim() || null;
}

function parseDurationMilliseconds(value: string) {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value.trim());

  if (!match) {
    throw new Error('JWT_REFRESH_EXPIRES_IN must be a duration such as 30d or 12h');
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return amount * multipliers[unit];
}


function jwtExpiresIn(value: string | undefined, fallback: string): JwtSignOptions['expiresIn'] {
  // Nest/JWT accepts string durations like "15m" at runtime, but the type is
  // narrowed by jsonwebtoken/ms. Keep the unavoidable cast isolated here.
  return (value ?? fallback) as JwtSignOptions['expiresIn'];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(body: AuthRegisterRequest) {
    const name = requiredString(body.name, 'name');
    const email = normalizeEmail(requiredString(body.email, 'email'));
    const password = requiredString(body.password, 'password');
    const existingUserCount = await this.authRepository.countUsers();
    const requestedRole =
      body.roleName ?? (existingUserCount === 0 ? 'super_admin' : PUBLIC_REGISTRATION_ROLE);

    if (!EMAIL_PATTERN.test(email)) {
      throw new BadRequestException({
        error: { code: 'INVALID_EMAIL', message: 'Email is invalid' },
      });
    }

    if (password.length < 8) {
      throw new BadRequestException({
        error: {
          code: 'PASSWORD_TOO_SHORT',
          message: 'Password must be at least 8 characters',
        },
      });
    }

    if (requestedRole !== PUBLIC_REGISTRATION_ROLE && existingUserCount > 0) {
      throw new BadRequestException({
        error: {
          code: 'PUBLIC_ROLE_NOT_ALLOWED',
          message: 'Only the first setup user can create an elevated account publicly',
        },
      });
    }

    if (existingUserCount === 0 && !['super_admin', 'admin'].includes(requestedRole)) {
      throw new BadRequestException({
        error: {
          code: 'BOOTSTRAP_ROLE_NOT_ALLOWED',
          message: 'The first setup user must be super_admin or admin',
        },
      });
    }

    if (await this.authRepository.findUserByEmail(email)) {
      throw new ConflictException({
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'A user with this email already exists',
        },
      });
    }

    const role = await this.authRepository.findRoleByName(requestedRole);

    if (!role) {
      throw new BadRequestException({
        error: { code: 'ROLE_NOT_FOUND', message: `${requestedRole} role does not exist` },
      });
    }

    const refreshSession = this.createRefreshSessionInput();
    const user = await this.authRepository.createUserWithSession(
      {
        name,
        email,
        phone: optionalString(body.phone),
        passwordHash: await hashPassword(password),
        roleId: role.id,
      },
      refreshSession.session,
    );

    return this.buildAuthResponse(user, refreshSession.token);
  }

  async login(body: AuthLoginRequest) {
    const email = normalizeEmail(requiredString(body.email, 'email'));
    const password = requiredString(body.password, 'password');
    const user = await this.authRepository.findUserByEmail(email);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    this.assertActive(user);

    const refreshSession = this.createRefreshSessionInput();
    await this.authRepository.createRefreshSession(user.id, refreshSession.session);

    return this.buildAuthResponse(user, refreshSession.token);
  }

  async refresh(body: RefreshTokenRequest) {
    const refreshToken = requiredString(body.refreshToken, 'refreshToken');
    const session = await this.authRepository.findRefreshSession(
      this.hashRefreshToken(refreshToken),
    );

    if (
      !session ||
      session.revokedAt !== null ||
      new Date(session.expiresAt).getTime() <= Date.now()
    ) {
      throw new UnauthorizedException({
        error: {
          code: 'REFRESH_TOKEN_INVALID',
          message: 'Refresh token is invalid or expired',
        },
      });
    }

    this.assertActive(session);
    const replacement = this.createRefreshSessionInput();
    const rotated = await this.authRepository.rotateRefreshSession(
      session.sessionId,
      session.id,
      replacement.session,
    );

    if (!rotated) {
      throw new UnauthorizedException({
        error: { code: 'REFRESH_TOKEN_REUSED', message: 'Refresh token was already used' },
      });
    }

    return this.buildAuthResponse(session, replacement.token);
  }

  async logout(body: RefreshTokenRequest) {
    const refreshToken = requiredString(body.refreshToken, 'refreshToken');
    await this.authRepository.revokeRefreshSession(this.hashRefreshToken(refreshToken));

    return toLogoutResponse();
  }

  async getMe(userId: number) {
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException({
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }

    this.assertActive(user);
    const permissions = await this.authRepository.getUserPermissions(user.id);

    return toMeResponse(user, permissions);
  }

  private async buildAuthResponse(user: AuthUserRecord, refreshToken: string) {
    const permissions = await this.authRepository.getUserPermissions(user.id);
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.roleName,
      permissions,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET') ?? 'dev_access_secret',
      expiresIn: jwtExpiresIn(
        this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
        '15m',
      ),
    });

    return toAuthResponse(user, permissions, accessToken, refreshToken);
  }

  private createRefreshSessionInput() {
    const token = randomBytes(48).toString('base64url');
    const ttl = parseDurationMilliseconds(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d',
    );

    return {
      token,
      session: {
        refreshTokenHash: this.hashRefreshToken(token),
        expiresAt: new Date(Date.now() + ttl),
      },
    };
  }

  private hashRefreshToken(refreshToken: string) {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private assertActive(user: Pick<AuthUserRecord, 'isActive'>) {
    if (!user.isActive) {
      throw new UnauthorizedException({
        error: { code: 'USER_INACTIVE', message: 'User account is inactive' },
      });
    }
  }
}
