import { AuthModule } from "src/auth/auth.module";
import { ChannelModule } from "src/channel/channel.module";
import { FriendRequestModule } from "src/friend_request/friend_request.module";
import { GameModule } from "src/game/game.module";
import { UserModule } from "src/user/user.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

// TODO: Delete this when file server is set up.
import { FileModule } from "./file.module";

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
		PassportModule.register({ session: true }),
		UserModule,

		// TODO: Remove this.
		FileModule,
	],
})
export class AppModule {}
