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
@Get('load')
  async findAll() {
    return await this.serversService.findAll();
  }
  @Delete(':id')
remove(@Param('id') id: string) {
  return this.serversService.remove(id); 
}





}
