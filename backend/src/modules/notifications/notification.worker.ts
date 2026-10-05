import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class NotificationWorkerService
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationWorkerService.name);
  private worker?: Worker;

  constructor(
    @Inject(RedisService)
    private readonly redis: RedisService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      'notifications',
      async (job: Job) => this.process(job),
      {
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
        },
        concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Job ${job?.id} failed: ${error.message}`,
      );
    });
  }

  private async process(job: Job) {
    if (job.name !== 'incident-created') return;

    const { incidentId, severity } = job.data as {
      incidentId: number;
      severity: string;
    };

    const key = `notification:incident-created:${incidentId}`;
    const claimed = await this.redis.setIfAbsent(key, 'done', 86400);

    if (!claimed) {
      this.logger.debug(`Skipping duplicate notification for incident ${incidentId}`);
      return;
    }

    // Replace this with Slack/email provider integration later.
    this.logger.log(
      `Notification: incident ${incidentId} created with severity ${severity}`,
    );
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}