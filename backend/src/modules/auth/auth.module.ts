import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '1h') as any,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, DatabaseService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}