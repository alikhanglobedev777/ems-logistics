import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesService } from './roles.service';
import type { CreateRoleRequest, UpdateRoleRequest } from '@ems/api-contract';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('role.manage')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  getRoles(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.rolesService.getRoles(page, limit);
  }

  @Get(':roleId')
  getRoleById(@Param('roleId') roleId: string) {
    return this.rolesService.getRoleById(roleId);
  }

  @Post()
  createRole(@Body() body: CreateRoleRequest) {
    return this.rolesService.createRole(body);
  }

  @Patch(':roleId')
  updateRole(@Param('roleId') roleId: string, @Body() body: UpdateRoleRequest) {
    return this.rolesService.updateRole(roleId, body);
  }
}
