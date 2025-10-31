import { Injectable } from '@nestjs/common';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';

@Injectable()
export class EnterpriseService {
  create(createEnterpriseDto: CreateEnterpriseDto) {
    return 'This action adds a new enterprise';
  }

  findAll() {
    return `This action returns all enterprise`;
  }

  findOne(id: number) {
    return `This action returns a #${id} enterprise`;
  }

  update(id: number, updateEnterpriseDto: UpdateEnterpriseDto) {
    return `This action updates a #${id} enterprise`;
  }

  remove(id: number) {
    return `This action removes a #${id} enterprise`;
  }
}
