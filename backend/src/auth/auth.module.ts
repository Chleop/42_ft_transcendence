import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [PrismaModule, UserModule],
  controllers: [AuthController],
  providers: [AuthService, UserService],
})
export class AuthModule {}
