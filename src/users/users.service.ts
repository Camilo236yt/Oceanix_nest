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
import { CryptoService } from '../auth/services/crypto.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { USER_MESSAGES } from './constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly cryptoService: CryptoService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    if (createUserDto.password !== createUserDto.confirmPassword) {
      throw new BadRequestException(USER_MESSAGES.PASSWORD_MISMATCH);
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email }
    });
    if (existingUser) {
      throw new BadRequestException(USER_MESSAGES.EMAIL_ALREADY_REGISTERED);
    }

    const hashedPassword = await this.cryptoService.hashPassword(createUserDto.password);

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

    // Asignar roles si se proporcionan
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      const userRoles = createUserDto.roleIds.map(roleId =>
        this.userRoleRepository.create({
          user: savedUser,
          role: { id: roleId } as Role
        })
      );
      await this.userRoleRepository.save(userRoles);

      // Recargar el usuario con sus roles si se asignaron
      const userWithRoles = await this.userRepository.findOne({
        where: { id: savedUser.id },
        relations: ['roles', 'roles.role']
      });

      return userWithRoles || savedUser;
    }

    return savedUser;
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
      throw new NotFoundException(USER_MESSAGES.USER_NOT_FOUND);
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
      throw new NotFoundException(USER_MESSAGES.USER_NOT_FOUND);
    }

    if ((password && !confirmPassword) || (!password && confirmPassword)) {
      throw new BadRequestException(
        'Debe enviar ambas contraseñas para actualizar la contraseña',
      );
    }

    if (password && confirmPassword && password !== confirmPassword) {
      throw new BadRequestException(USER_MESSAGES.PASSWORD_MISMATCH);
    }

    const updateData: Partial<User> = { ...restOfFields };

    if (password && confirmPassword) {
      updateData.password = await this.cryptoService.hashPassword(password);
    }

    await this.userRepository.update(id, updateData);

    // Actualizar roles si se proporcionan
    if (roleIds !== undefined && roleIds.length > 0) {
      await this.userRoleRepository.delete({ user: { id } });

      const newUserRoles = roleIds.map(roleId =>
        this.userRoleRepository.create({
          user: { id } as User,
          role: { id: roleId } as Role
        })
      );
      await this.userRoleRepository.save(newUserRoles);

      // Recargar el usuario con sus roles si se asignaron
      const updatedUser = await this.userRepository.findOne({
        where: { id },
        relations: ['roles', 'roles.role']
      });

      return updatedUser || existingUser;
    }

    // Si no se actualizaron roles, simplemente devolver el usuario actualizado
    const updatedUser = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.role']
    });

    return updatedUser || existingUser;
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    user.isActive = false;
    await this.userRepository.save(user);

    return { message: USER_MESSAGES.USER_DEACTIVATED };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword, confirmNewPassword } = changePasswordDto;

    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException(USER_MESSAGES.PASSWORD_MISMATCH);
    }

    const user = await this.findOne(userId);

    const isCurrentPasswordValid = await this.cryptoService.comparePasswords(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException(USER_MESSAGES.INVALID_CURRENT_PASSWORD);
    }

    const hashedNewPassword = await this.cryptoService.hashPassword(newPassword);
    await this.userRepository.update(userId, { password: hashedNewPassword });
  }
}
