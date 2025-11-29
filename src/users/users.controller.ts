import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Paginate, ApiPaginationQuery } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';

import { Auth, GetUser } from 'src/auth/decorator';
import { ValidPermission } from 'src/auth/interfaces/valid-permission';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { sanitizeUserForCache, sanitizeUsersArrayForCache } from './dto/safe-user-response.dto';
import { User, UserType } from './entities/user.entity';
import { UsersService } from './users.service';
import { USER_MESSAGES } from './constants';
import {
  UsersApiTags,
  CreateUserDoc,
  FindAllUsersDoc,
  FindOneUserDoc,
  UpdateUserDoc,
  DeleteUserDoc,
  ReactivateUserDoc,
  ChangePasswordDoc,
  AssignRolesDoc,
  RemoveRoleDoc,
  GetUserRolesDoc,
} from './docs';

@UsersApiTags()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) { }

  @Post()
  @Auth(ValidPermission.createUsers)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @CreateUserDoc()
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
          USER_MESSAGES.ENTERPRISE_ADMIN_USER_TYPE_RESTRICTION
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
  @Auth(ValidPermission.viewUsers)
  @ApiPaginationQuery({
    sortableColumns: ['createdAt', 'name', 'lastName', 'email', 'userType'],
    searchableColumns: ['name', 'lastName', 'email'],
    defaultSortBy: [['name', 'ASC']],
  })
  @FindAllUsersDoc()
  async findAll(
    @Paginate() query: PaginateQuery,
    @GetUser() currentUser: User,
  ) {
    // SUPER_ADMIN can see all users, others only their enterprise
    return this.usersService.findAllPaginated(query, currentUser.enterpriseId);
  }

  @Get('legacy')
  @Auth(ValidPermission.viewUsers)
  async findAllLegacy(@GetUser() currentUser: User) {
    // Pass enterpriseId for tenant isolation (SUPER_ADMIN will have undefined, can see all)
    const result = await this.usersService.findAll(
      { page: 1, limit: 100 },
      currentUser.enterpriseId
    );

    return {
      ...result,
      data: sanitizeUsersArrayForCache(result.data)
    };
  }

  @Get(':id')
  @Auth(ValidPermission.viewUsers)
  @FindOneUserDoc()
  async findOne(@Param('id') id: string, @GetUser() currentUser: User) {
    // Pass enterpriseId for tenant isolation
    const user = await this.usersService.findOne(id, true, currentUser.enterpriseId);

    return sanitizeUserForCache(user);
  }


  @Patch(':id')
  @Auth(ValidPermission.editUsers)
  @UpdateUserDoc()
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() currentUser: User
  ) {
    // Pass enterpriseId for tenant isolation
    const user = await this.usersService.update(id, updateUserDto, currentUser.enterpriseId);

    return sanitizeUserForCache(user);
  }

  @Delete(':id')
  @Auth(ValidPermission.deleteUsers)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @DeleteUserDoc()
  async remove(@Param('id') id: string, @GetUser() currentUser: User) {
    // Pass enterpriseId for tenant isolation
    const result = await this.usersService.remove(id, currentUser.enterpriseId);

    return result;
  }

  @Patch(':id/reactivate')
  @Auth(ValidPermission.editUsers)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ReactivateUserDoc()
  async reactivate(@Param('id') id: string, @GetUser() currentUser: User) {
    // Pass enterpriseId for tenant isolation
    const result = await this.usersService.reactivate(id, currentUser.enterpriseId);

    return result;
  }

  @Patch('me/password')
  @Auth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ChangePasswordDoc()
  async changePassword(@GetUser() user: User, @Body() changePasswordDto: ChangePasswordDto) {
    await this.usersService.changePassword(user.id, changePasswordDto);
    return { message: USER_MESSAGES.PASSWORD_CHANGED };
  }

  // Role management endpoints
  @Post(':userId/roles')
  @Auth(ValidPermission.manageUsers)
  @AssignRolesDoc()
  async assignRoles(
    @Param('userId') userId: string,
    @Body() assignRolesDto: AssignRolesDto,
    @GetUser() currentUser: User,
  ) {
    if (!currentUser.enterpriseId) {
      throw new BadRequestException(USER_MESSAGES.ONLY_ENTERPRISE_USERS_CAN_ASSIGN_ROLES);
    }

    await this.usersService.assignRolesToUser(
      userId,
      assignRolesDto.roleIds,
      currentUser.enterpriseId,
    );

    return {
      message: USER_MESSAGES.ROLES_ASSIGNED_SUCCESSFULLY,
    };
  }

  @Delete(':userId/roles/:roleId')
  @Auth(ValidPermission.manageUsers)
  @RemoveRoleDoc()
  async removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @GetUser() currentUser: User,
  ) {
    if (!currentUser.enterpriseId) {
      throw new BadRequestException(USER_MESSAGES.ONLY_ENTERPRISE_USERS_CAN_REMOVE_ROLES);
    }

    await this.usersService.removeRoleFromUser(
      userId,
      roleId,
      currentUser.enterpriseId,
    );

    return {
      message: USER_MESSAGES.ROLE_REMOVED_SUCCESSFULLY,
    };
  }

  @Get(':userId/roles')
  @Auth(ValidPermission.viewUsers)
  @GetUserRolesDoc()
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
