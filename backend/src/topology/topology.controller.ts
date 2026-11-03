import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TopologyService } from './topology.service';
import { CreateTopologyDto } from './dto/create-topology.dto';
import { UpdateTopologyDto } from './dto/update-topology.dto';

@Controller('topology')
export class TopologyController {
  constructor(private readonly topologyService: TopologyService) {}

  @Post()
  create(@Body() createTopologyDto: CreateTopologyDto) {
    return this.topologyService.create(createTopologyDto);
  }

  @Get()
  findAll() {
    return this.topologyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.topologyService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTopologyDto: UpdateTopologyDto) {
    return this.topologyService.update(+id, updateTopologyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.topologyService.remove(+id);
  }
}
