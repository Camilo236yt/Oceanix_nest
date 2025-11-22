import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, Paginated, FilterOperator } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';

import { User, UserType } from '../users/entities/user.entity';
import { UpdateClientDto } from './dto/update-client.dto';
import { createPaginationConfig } from '../common/helpers/pagination.config';

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
   * Lista clientes con paginación, filtros y búsqueda
   */
  async findAllPaginated(
    query: PaginateQuery,
    enterpriseId: string,
  ): Promise<Paginated<User>> {
    const config = createPaginationConfig<User>({
      sortableColumns: ['createdAt', 'name', 'lastName', 'email'],
      searchableColumns: ['name', 'lastName', 'email'],
      filterableColumns: {
        isActive: [FilterOperator.EQ],
        isEmailVerified: [FilterOperator.EQ],
        createdAt: [FilterOperator.GTE, FilterOperator.LTE, FilterOperator.BTW],
      },
      defaultSortBy: [['createdAt', 'DESC']],
      where: {
        enterpriseId,
        userType: UserType.CLIENT,
        isActive: true,
      },
      select: ['id', 'email', 'name', 'lastName', 'phoneNumber', 'isEmailVerified', 'createdAt', 'updatedAt'],
    });

    return paginate(query, this.userRepository, config);
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
