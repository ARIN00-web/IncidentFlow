import {
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor() {
    this.client = new Redis(
      process.env.REDIS_URL ?? 'redis://localhost:6379',
      { maxRetriesPerRequest: 3 },
    );
  }

  get(key: string) {
    return this.client.get(key);
  }

  async set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ) {
    if (ttlSeconds) {
      return this.client.set(key, value, 'EX', ttlSeconds);
    }
    return this.client.set(key, value);
  }

  del(key: string) {
    return this.client.del(key);
  }

  ping() {
    return this.client.ping();
  }

  async setIfAbsent(
    key: string,
    value: string,
    ttlSeconds: number,
  ) {
    return this.client.set(
      key,
      value,
      'EX',
      ttlSeconds,
      'NX',
    );
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}