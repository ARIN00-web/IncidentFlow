import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from './infrastructure/database/database.service';
import { RedisService } from './infrastructure/redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async health() {
    const result = await this.db.query<{ now: Date }>('SELECT NOW() AS now');
    const redis = await this.redis.ping();

    return {
      status: 'ok',
      database: 'ok',
      redis,
      time: result.rows[0].now,
    };
  }
}

