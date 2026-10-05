import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { TeamsModule } from './modules/teams/teams.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [AuthModule, UsersModule, TeamsModule, IncidentsModule],
})
export class AppModule {}
