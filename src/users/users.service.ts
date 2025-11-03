import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from './entities/user.entity';
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
    private readonly cryptoService: CryptoService,
  ) {}

  async create(createUserDto: CreateUserDto, enterpriseId?: string): Promise<User> {
    if (createUserDto.password !== createUserDto.confirmPassword) {
      throw new BadRequestException(USER_MESSAGES.PASSWORD_MISMATCH);
    }

    // Validate userType consistency
    if (createUserDto.userType === 'SUPER_ADMIN' && enterpriseId) {
      throw new BadRequestException(USER_MESSAGES.SUPER_ADMIN_CANNOT_HAVE_ENTERPRISE);
    }

    if (createUserDto.userType && createUserDto.userType !== 'SUPER_ADMIN' && !enterpriseId) {
      throw new BadRequestException(USER_MESSAGES.NON_SUPER_ADMIN_MUST_HAVE_ENTERPRISE);
    }

    const existingUser = await this.userRepository.findOne({
      where: {
        email: createUserDto.email,
        enterpriseId: enterpriseId ? enterpriseId : IsNull(),
      }
    });
    if (existingUser) {
      throw new BadRequestException(USER_MESSAGES.EMAIL_ALREADY_REGISTERED);
    }

    const hashedPassword = await this.cryptoService.hashPassword(createUserDto.password);

    // Remove address from DTO since it's now a relationship
    const { address, ...userDataWithoutAddress } = createUserDto;

    const user = this.userRepository.create({
      ...userDataWithoutAddress,
      password: hashedPassword,
      isActive: createUserDto.isActive ?? true,
      isEmailVerified: true,
      enterpriseId
      // addressId is optional, will be handled separately
    });

    return await this.userRepository.save(user);
  }

  async findAll(paginationDto: PaginationDto, enterpriseId?: string) {
    const { page = 1, limit = 10 } = paginationDto;

    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      where: {
        isActive: true,
        ...(enterpriseId && { enterpriseId }),
      },
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
      where: { id }
    });

    if (!user) {
      throw new NotFoundException(USER_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const { password, confirmPassword, ...restOfFields } = updateUserDto;

    const existingUser = await this.userRepository.findOne({
      where: { id }
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

    // Remove address from restOfFields since it's now a relationship
    const { address: _, ...fieldsWithoutAddress } = restOfFields;
    const updateData: Partial<User> = { ...fieldsWithoutAddress };

    if (password && confirmPassword) {
      updateData.password = await this.cryptoService.hashPassword(password);
    }

    await this.userRepository.update(id, updateData);

    const updatedUser = await this.userRepository.findOne({
      where: { id }
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
