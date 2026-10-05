import { Module } from '@nestjs/common';
import { NotificationQueueService } from './notification.queue';
import { NotificationWorkerService } from './notification.worker';

@Module({
  providers: [NotificationQueueService, NotificationWorkerService],
  exports: [NotificationQueueService],
})
export class NotificationsModule {}