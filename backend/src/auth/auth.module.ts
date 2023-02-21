import { Logger, Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { UserModule } from "src/user/user.module";
import { UserService } from "src/user/user.service";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { JwtStrategy, FtOauthStrategy } from "./strategy";
import { FtOauthGuard, Jwt2FAGuard, JwtPendingStateGuard } from "./guards";
import { SessionSerializer } from "./utils/Serializer";
import { HttpModule } from "@nestjs/axios";
import { ChannelService } from "src/channel/channel.service";
import { ChatService } from "src/chat/chat.service";

@Module({
	imports: [PrismaModule, UserModule, JwtModule.register({}), HttpModule.register({})],
	controllers: [AuthController],
	providers: [
		ChatService,
		AuthService,
		UserService,
		ConfigService,
		JwtStrategy,
		ChannelService,
		FtOauthGuard,
		Jwt2FAGuard,
		JwtPendingStateGuard,
		FtOauthStrategy,
		SessionSerializer,
		Logger,
	],
	exports: [AuthService],
})
export class AuthModule {}
