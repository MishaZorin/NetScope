import { PartialType } from '@nestjs/swagger';
import { CreateTopologyDto } from './create-topology.dto';

export class UpdateTopologyDto extends PartialType(CreateTopologyDto) {}
