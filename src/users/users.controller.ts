import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException } from '@nestjs/common';

import { Cached } from 'src/common/decorators';

import { Auth, GetUser } from 'src/auth/decorator';
import { ValidPermission } from 'src/auth/interfaces/valid-permission';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { sanitizeUserForCache, sanitizeUsersArrayForCache } from './dto/safe-user-response.dto';
import { User, UserType } from './entities/user.entity';
import { UsersService } from './users.service';
import { USER_MESSAGES, USER_CACHE } from './constants';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @Auth(ValidPermission.createUsers)
  async create(
    @Body() createUserDto: CreateUserDto,
    @GetUser() currentUser: User,
  ) {
    // Extract enterpriseId from authenticated user
    const enterpriseId = currentUser.enterpriseId;

    // Validate that ENTERPRISE_ADMIN can only create EMPLOYEE or CLIENT
    if (currentUser.userType === UserType.ENTERPRISE_ADMIN) {
      if (createUserDto.userType &&
          createUserDto.userType !== UserType.EMPLOYEE &&
          createUserDto.userType !== UserType.CLIENT) {
        throw new BadRequestException(
          'Enterprise admins can only create EMPLOYEE or CLIENT users'
        );
      }

      // Default to EMPLOYEE if not specified
      if (!createUserDto.userType) {
        createUserDto.userType = UserType.EMPLOYEE;
      }
    }

    const user = await this.usersService.create(createUserDto, enterpriseId);

    return sanitizeUserForCache(user);
  }

  @Get()
  @Auth(ValidPermission.manageUsers)
  @Cached({ keyPrefix: 'users', ttl: USER_CACHE.USERS_LIST_TTL })
  async findAll() {
    const result = await this.usersService.findAll({ page: 1, limit: 100 });

    return {
      ...result,
      data: sanitizeUsersArrayForCache(result.data)
    };
  }

  @Get(':id')
  @Auth(ValidPermission.manageUsers)
  @Cached({ keyPrefix: 'users', ttl: USER_CACHE.USER_DETAIL_TTL })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);

    return sanitizeUserForCache(user);
  }


  @Patch(':id')
  @Auth(ValidPermission.editUsers)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);

    return sanitizeUserForCache(user);
  }

  @Delete(':id')
  @Auth(ValidPermission.deleteUsers)
  async remove(@Param('id') id: string) {
    const result = await this.usersService.remove(id);

    return result;
  }

  @Patch('me/password')
  @Auth()
  async changePassword(@GetUser() user: User, @Body() changePasswordDto: ChangePasswordDto) {
    await this.usersService.changePassword(user.id, changePasswordDto);
    return { message: USER_MESSAGES.PASSWORD_CHANGED };
  }

  // Role management endpoints
  @Post(':userId/roles')
  @Auth(ValidPermission.manageUsers)
  async assignRoles(
    @Param('userId') userId: string,
    @Body() assignRolesDto: AssignRolesDto,
    @GetUser() currentUser: User,
  ) {
    if (!currentUser.enterpriseId) {
      throw new BadRequestException('Only enterprise users can assign roles');
    }

    await this.usersService.assignRolesToUser(
      userId,
      assignRolesDto.roleIds,
      currentUser.enterpriseId,
    );

    return {
      message: 'Roles assigned successfully',
    };
  }

  @Delete(':userId/roles/:roleId')
  @Auth(ValidPermission.manageUsers)
  async removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @GetUser() currentUser: User,
  ) {
    if (!currentUser.enterpriseId) {
      throw new BadRequestException('Only enterprise users can remove roles');
    }

    await this.usersService.removeRoleFromUser(
      userId,
      roleId,
      currentUser.enterpriseId,
    );

    return {
      message: 'Role removed successfully',
    };
  }

  @Get(':userId/roles')
  @Auth(ValidPermission.manageUsers)
  async getUserRoles(
    @Param('userId') userId: string,
    @GetUser() currentUser: User,
  ) {
    const roles = await this.usersService.getUserRoles(
      userId,
      currentUser.enterpriseId,
    );

    return {
      userId,
      roles: roles.map(ur => ({
        id: ur.id,
        roleId: ur.roleId,
        roleName: ur.role?.name,
        roleDescription: ur.role?.description,
        enterpriseId: ur.enterpriseId,
      })),
    };
  }
}
