import { Controller, Post, Body } from '@nestjs/common';
import { MetricsService } from './metrics.service';

class CheckConnectionDto {
  host!: string;
  username!: string;
  password!: string;
}

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Post()
  getNetwork(@Body() dto: CheckConnectionDto) {
    return this.metricsService.getNetwork(dto.host, dto.username, dto.password);
  }

  
}