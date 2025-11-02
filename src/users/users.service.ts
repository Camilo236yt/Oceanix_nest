import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    if (createUserDto.password !== createUserDto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email }
    });
    if (existingUser) {
      throw new BadRequestException('El email ya está registrado');
    }

    if (!createUserDto.roleIds || createUserDto.roleIds.length === 0) {
      throw new BadRequestException('Los usuarios del sistema deben tener al menos un rol asignado');
    }

    const roles = await this.roleRepository.find({
      where: createUserDto.roleIds.map(id => ({ id, isActive: true }))
    });

    if (roles.length !== createUserDto.roleIds.length) {
      const foundRoleIds = roles.map(r => r.id);
      const missingRoles = createUserDto.roleIds.filter(id => !foundRoleIds.includes(id));
      throw new BadRequestException(`Los siguientes roles no existen o están inactivos: ${missingRoles.join(', ')}`);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      name: createUserDto.name,
      lastName: createUserDto.lastName,
      email: createUserDto.email,
      phoneNumber: createUserDto.phoneNumber,
      password: hashedPassword,
      isActive: createUserDto.isActive ?? true,
      isEmailVerified: true,
    });

    const savedUser = await this.userRepository.save(user);

    const userRoles = createUserDto.roleIds.map(roleId =>
      this.userRoleRepository.create({
        user: savedUser,
        role: { id: roleId } as Role
      })
    );
    await this.userRoleRepository.save(userRoles);

    const userWithRoles = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['roles', 'roles.role']
    });

    if (!userWithRoles) {
      throw new NotFoundException('Usuario creado pero no encontrado');
    }

    return userWithRoles;
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;

    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.role']
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const { password, confirmPassword, roleIds, ...restOfFields } = updateUserDto;

    const existingUser = await this.userRepository.findOne({
      where: { id },
      relations: ['roles']
    });
    if (!existingUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    if ((password && !confirmPassword) || (!password && confirmPassword)) {
      throw new BadRequestException(
        'Debe enviar ambas contraseñas para actualizar la contraseña',
      );
    }

    if (password && confirmPassword && password !== confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    if (roleIds !== undefined) {
      if (roleIds.length === 0) {
        throw new BadRequestException('Los usuarios del sistema deben tener al menos un rol asignado');
      }

      const roles = await this.roleRepository.find({
        where: roleIds.map(roleId => ({ id: roleId, isActive: true }))
      });

      if (roles.length !== roleIds.length) {
        const foundRoleIds = roles.map(r => r.id);
        const missingRoles = roleIds.filter(id => !foundRoleIds.includes(id));
        throw new BadRequestException(`Los siguientes roles no existen o están inactivos: ${missingRoles.join(', ')}`);
      }
    }

    const updateData: Partial<User> = { ...restOfFields };

    if (password && confirmPassword) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await this.userRepository.update(id, updateData);

    if (roleIds !== undefined) {
      await this.userRoleRepository.delete({ user: { id } });

      const newUserRoles = roleIds.map(roleId =>
        this.userRoleRepository.create({
          user: { id } as User,
          role: { id: roleId } as Role
        })
      );
      await this.userRoleRepository.save(newUserRoles);
    }

    const updatedUser = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.role']
    });

    if (!updatedUser) {
      throw new NotFoundException('Usuario actualizado pero no encontrado');
    }

    return updatedUser;
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    user.isActive = false;
    await this.userRepository.save(user);

    return { message: 'Usuario desactivado correctamente' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword, confirmNewPassword } = changePasswordDto;

    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('Las nuevas contraseñas no coinciden');
    }

    const user = await this.findOne(userId);

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, { password: hashedNewPassword });
  }
}
