import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationQueueService implements OnModuleDestroy {
  private readonly queue = new Queue('notifications', {
    connection: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    },
  });

  async addIncidentCreated(
    incidentId: number,
    severity: string,
  ) {
    return this.queue.add(
      'incident-created',
      { incidentId, severity },
      {
        jobId: `incident-created-${incidentId}`,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    );
  }

  async onModuleDestroy() {
    await this.queue.close();
  }
}