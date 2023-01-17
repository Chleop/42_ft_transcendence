import { Module } from "@nestjs/common";

import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { JwtModule } from "@nestjs/jwt";
import { UserModule } from "src/user/user.module";
import { ChannelModule } from "src/channel/channel.module";
import { PassportModule } from "@nestjs/passport";
import { GameModule } from "src/game/game.module";

// TODO: Delete this when file server is set up.
import { FileModule } from "./file.module";

@Module({
	imports: [
		ChannelModule,
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		UserModule,
		PrismaModule,
		AuthModule,
		JwtModule,
		PassportModule.register({ session: true }),
		GameModule,

		// TODO: Remove this.
		FileModule,
	],
})
export class AppModule {}
