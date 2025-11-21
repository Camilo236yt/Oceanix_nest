import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserType } from '../users/entities/user.entity';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Obtiene todos los clientes de una empresa
   */
  async findAll(enterpriseId: string) {
    return await this.userRepository.find({
      where: {
        enterpriseId,
        userType: UserType.CLIENT,
        isActive: true,
      },
      select: ['id', 'email', 'name', 'lastName', 'phoneNumber', 'isEmailVerified', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtiene un cliente específico por ID
   */
  async findOne(id: string, enterpriseId: string) {
    const client = await this.userRepository.findOne({
      where: {
        id,
        enterpriseId,
        userType: UserType.CLIENT,
      },
      select: ['id', 'email', 'name', 'lastName', 'phoneNumber', 'isEmailVerified', 'isActive', 'createdAt', 'updatedAt'],
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return client;
  }

  /**
   * Actualiza información de un cliente
   */
  async update(id: string, enterpriseId: string, updateClientDto: UpdateClientDto) {
    const client = await this.findOne(id, enterpriseId);

    Object.assign(client, updateClientDto);
    await this.userRepository.save(client);

    return {
      message: 'Cliente actualizado exitosamente',
      client,
    };
  }

  /**
   * Desactiva un cliente (soft delete)
   */
  async remove(id: string, enterpriseId: string) {
    const client = await this.findOne(id, enterpriseId);

    client.isActive = false;
    await this.userRepository.save(client);

    return {
      message: 'Cliente desactivado exitosamente',
    };
  }

  /**
   * Obtiene estadísticas de clientes
   */
  async getStats(enterpriseId: string) {
    const [total, active, verified] = await Promise.all([
      this.userRepository.count({
        where: {
          enterpriseId,
          userType: UserType.CLIENT,
        },
      }),
      this.userRepository.count({
        where: {
          enterpriseId,
          userType: UserType.CLIENT,
          isActive: true,
        },
      }),
      this.userRepository.count({
        where: {
          enterpriseId,
          userType: UserType.CLIENT,
          isEmailVerified: true,
        },
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      verified,
      unverified: total - verified,
    };
  }
}
