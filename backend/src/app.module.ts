import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { JwtModule } from "@nestjs/jwt";
import { UserModule } from "src/user/user.module";
import { ChannelModule } from "src/channel/channel.module";
import { PassportModule } from "@nestjs/passport";
import { GameModule } from "src/game/game.module";

@Module({
	imports: [
		ChannelModule,
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		UserModule,
		AuthModule,
		JwtModule,
		PassportModule.register({ session: true }),
		GameModule,
	],
})
export class AppModule {}
