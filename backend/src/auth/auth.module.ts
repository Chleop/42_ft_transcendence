import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [PrismaModule, UserModule, JwtModule.registerAsync({ }),],
  controllers: [AuthController],
  providers: [AuthService, UserService],
  exports: [AuthService, JwtModule],
})

export class AuthModule {}
