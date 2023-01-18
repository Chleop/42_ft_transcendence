import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { UserModule } from "src/user/user.module";
import { UserService } from "src/user/user.service";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtStrategy, FtOauthStrategy } from "./strategy";
import { JwtGuard, FtOauthGuard } from "./guards";
import { SessionSerializer } from "./utils/Serializer";
import { HttpModule } from "@nestjs/axios";

@Module({
	imports: [
		PrismaModule,
		UserModule,
		ConfigModule,
		JwtModule.register({}),
		HttpModule.register({}),
	],
	controllers: [AuthController],
	providers: [
		AuthService,
		UserService,
		ConfigService,
		JwtStrategy,
		JwtGuard,
		FtOauthGuard,
		FtOauthStrategy,
		SessionSerializer,
	],
	exports: [AuthService],
})
export class AuthModule {}
