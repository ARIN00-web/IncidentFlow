import {
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';

import Redis from 'ioredis';

@Injectable()
export class RedisService
  implements OnModuleDestroy {

  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(
      process.env.REDIS_URL ??
        'redis://localhost:6379',
    );
  }

  async get(key: string) {
    return this.redis.get(key);
  }

  async set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ) {
    if (ttlSeconds) {
      return this.redis.set(
        key,
        value,
        'EX',
        ttlSeconds,
      );
    }

    return this.redis.set(key, value);
  }

  async del(key: string) {
    return this.redis.del(key);
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
