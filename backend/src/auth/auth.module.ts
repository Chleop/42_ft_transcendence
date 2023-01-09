import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategy';
import { JwtGuard } from './guards';

@Module({
  imports: [PrismaModule, UserModule, ConfigModule, JwtModule.register({}),],
  controllers: [AuthController],
  providers: [AuthService, UserService, ConfigService, JwtStrategy, JwtGuard],
  exports: [AuthService],
})

export class AuthModule {}
