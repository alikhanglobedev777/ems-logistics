import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { UsersService } from './users.service';
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
} from '@ems/api-contract';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('user.manage')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.usersService.getUsers(page, limit);
  }

  @Get(':userId')
  getUserById(@Param('userId') userId: string) {
    return this.usersService.getUserById(userId);
  }

  @Post()
  createUser(@Body() body: CreateUserRequest) {
    return this.usersService.createUser(body);
  }

  @Patch(':userId')
  updateUser(@Param('userId') userId: string, @Body() body: UpdateUserRequest) {
    return this.usersService.updateUser(userId, body);
  }

  @Patch(':userId/status')
  updateUserStatus(
    @Param('userId') userId: string,
    @Body() body: UpdateUserStatusRequest,
  ) {
    return this.usersService.updateUserStatus(userId, body);
  }
}
