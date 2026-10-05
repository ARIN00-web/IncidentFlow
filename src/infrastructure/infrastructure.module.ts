import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import { RedisService } from './redis/redis.service';
import { EventBusService } from './kafka/event-bus.service';

@Global()
@Module({
  providers: [DatabaseService, RedisService, EventBusService],
  exports: [DatabaseService, RedisService, EventBusService],
})
export class InfrastructureModule {}