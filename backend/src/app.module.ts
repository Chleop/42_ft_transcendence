import { AuthModule } from "src/auth/auth.module";
import { ChannelModule } from "src/channel/channel.module";
import { FriendRequestModule } from "src/friend_request/friend_request.module";
import { GameModule } from "src/game/game.module";
import { UserModule } from "src/user/user.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { Gateway } from "src/gateway";

@Module({
	imports: [
		AuthModule,
		ChannelModule,
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		FriendRequestModule,
		GameModule,
		JwtModule,
		// JwtModule.registerAsync({
		// 	imports: [ConfigModule],
		// 	useFactory: async (configService: ConfigService) => ({
		// 	  secret: configService.get<string>('JWT_SECRET'),
		// 	  signOptions: {
		// 		expiresIn: parseInt(configService.get<string>('POLL_DURATION')),
		// 	  },
		// 	}),
		// 	inject: [ConfigService],
		//   }),
		PassportModule.register({ session: true }),
		UserModule,
	],
	providers: [Gateway],
})
export class AppModule {}
