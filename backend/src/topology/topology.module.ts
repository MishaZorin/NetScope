import { Module } from '@nestjs/common';
import { TopologyService } from './topology.service';
import { TopologyController } from './topology.controller';

@Module({
  controllers: [TopologyController],
  providers: [TopologyService],
})
export class TopologyModule {}
