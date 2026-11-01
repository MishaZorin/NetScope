import { Injectable } from '@nestjs/common';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from './entities/server.entity';

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(Server)
    private readonly repo: Repository<Server>,
  ) {}
    async create(dto: CreateServerDto) {
    const server = this.repo.create({
      host: dto.host,
      port: dto.port ?? 22,
      username: dto.username,
      password: dto.password,
      
    });

    const savedServer = await this.repo.save(server);

    return savedServer;
  }
}
