import { Injectable } from '@nestjs/common';
import { CreateTopologyDto } from './dto/create-topology.dto';
import { UpdateTopologyDto } from './dto/update-topology.dto';

@Injectable()
export class TopologyService {
  create(createTopologyDto: CreateTopologyDto) {
    return 'This action adds a new topology';
  }

  findAll() {
    return `This action returns all topology`;
  }

  findOne(id: number) {
    return `This action returns a #${id} topology`;
  }

  update(id: number, updateTopologyDto: UpdateTopologyDto) {
    return `This action updates a #${id} topology`;
  }

  remove(id: number) {
    return `This action removes a #${id} topology`;
  }
}
