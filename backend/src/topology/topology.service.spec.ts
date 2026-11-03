import { Test, TestingModule } from '@nestjs/testing';
import { TopologyService } from './topology.service';

describe('TopologyService', () => {
  let service: TopologyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TopologyService],
    }).compile();

    service = module.get<TopologyService>(TopologyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
