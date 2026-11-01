import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ServersService } from './servers.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';

@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

    @Post()
create(@Body() dto: CreateServerDto) {

  return this.serversService.create(dto);
}




}
