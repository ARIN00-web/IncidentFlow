import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TeamsModule } from './modules/teams/teams.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RealtimeModule } from './realtime/realtime.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    InfrastructureModule,
    AuthModule,
    UsersModule,
    TeamsModule,
    IncidentsModule,
    NotificationsModule,
    RealtimeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}