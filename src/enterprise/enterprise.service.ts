import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enterprise } from './entities/enterprise.entity';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';
import { ENTERPRISE_MESSAGES } from './constants';

@Injectable()
export class EnterpriseService {
  constructor(
    @InjectRepository(Enterprise)
    private readonly enterpriseRepository: Repository<Enterprise>,
  ) { }

  async create(createEnterpriseDto: CreateEnterpriseDto) {
    const { name, subdomain } = createEnterpriseDto;

    const existingByName = await this.enterpriseRepository.findOne({
      where: { name },
    });
    if (existingByName) {
      throw new BadRequestException(ENTERPRISE_MESSAGES.NAME_ALREADY_EXISTS);
    }

    const existingBySubdomain = await this.enterpriseRepository.findOne({
      where: { subdomain },
    });
    if (existingBySubdomain) {
      throw new BadRequestException(ENTERPRISE_MESSAGES.SUBDOMAIN_ALREADY_EXISTS);
    }

    const enterprise = this.enterpriseRepository.create(createEnterpriseDto);

    return this.enterpriseRepository.save(enterprise);
  }

  async findAll(includeRelations = false) {
    const options: any = {
      order: { createdAt: 'DESC' },
    };

    if (includeRelations) {
      options.relations = ['users', 'roles'];
    }

    return this.enterpriseRepository.find(options);
  }

  async findOne(id: string) {
    const enterprise = await this.enterpriseRepository.findOne({
      where: { id },
      relations: ['users', 'roles', 'config'],
    });

    if (!enterprise) {
      throw new NotFoundException(ENTERPRISE_MESSAGES.NOT_FOUND);
    }

    return enterprise;
  }

  async update(id: string, updateEnterpriseDto: UpdateEnterpriseDto) {
    const enterprise = await this.findOne(id);

    if (updateEnterpriseDto.name && updateEnterpriseDto.name !== enterprise.name) {
      const existing = await this.enterpriseRepository.findOne({
        where: { name: updateEnterpriseDto.name },
      });
      if (existing) {
        throw new BadRequestException(ENTERPRISE_MESSAGES.NAME_ALREADY_EXISTS);
      }
    }

    if (updateEnterpriseDto.subdomain && updateEnterpriseDto.subdomain !== enterprise.subdomain) {
      const existing = await this.enterpriseRepository.findOne({
        where: { subdomain: updateEnterpriseDto.subdomain },
      });
      if (existing) {
        throw new BadRequestException(ENTERPRISE_MESSAGES.SUBDOMAIN_ALREADY_EXISTS);
      }
    }

    Object.assign(enterprise, updateEnterpriseDto);
    return this.enterpriseRepository.save(enterprise);
  }

  async remove(id: string) {
    const enterprise = await this.findOne(id);
    enterprise.isActive = false;
    await this.enterpriseRepository.save(enterprise);
    return { message: ENTERPRISE_MESSAGES.DEACTIVATED_SUCCESSFULLY };
  }

}
