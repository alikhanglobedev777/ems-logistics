import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { AuthUser } from '../types/auth-user';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();

    if (request.user?.role === 'super_admin') {
      return true;
    }

    const userPermissions = new Set(request.user?.permissions ?? []);
    const isAllowed = requiredPermissions.every((permission) =>
      userPermissions.has(permission),
    );

    if (!isAllowed) {
      throw new ForbiddenException({
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to perform this action',
        },
      });
    }

    return true;
  }
}
