import { Test, TestingModule } from '@nestjs/testing';
import { TopologyController } from './topology.controller';
import { TopologyService } from './topology.service';

describe('TopologyController', () => {
  let controller: TopologyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TopologyController],
      providers: [TopologyService],
    }).compile();

    controller = module.get<TopologyController>(TopologyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
