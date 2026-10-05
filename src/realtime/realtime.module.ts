import { Module } from '@nestjs/common';
import { IncidentGateway } from './incident.gateway';

@Module({
  providers: [IncidentGateway],
  exports: [IncidentGateway],
})
export class RealtimeModule {}