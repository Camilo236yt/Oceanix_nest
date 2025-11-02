import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { Cached } from 'src/common/decorators';

import { Auth, GetUser } from 'src/auth/decorator';
import { ValidPermission } from 'src/auth/interfaces/valid-permission';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { sanitizeUserForCache, sanitizeUsersArrayForCache } from './dto/safe-user-response.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @Auth(ValidPermission.createUsers)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);

    return sanitizeUserForCache(user);
  }

  @Get()
  @Auth(ValidPermission.manageUsers)
  @Cached({ keyPrefix: 'users', ttl: 600 })
  async findAll() {
    const result = await this.usersService.findAll({ page: 1, limit: 100 });

    return {
      ...result,
      data: sanitizeUsersArrayForCache(result.data)
    };
  }

  @Get(':id')
  @Auth(ValidPermission.manageUsers)
  @Cached({ keyPrefix: 'users', ttl: 600 })
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
    return { message: 'Contraseña actualizada correctamente' };
  }
}
