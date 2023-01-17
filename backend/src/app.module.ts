import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";
import { UserModule } from "src/user/user.module";
import { ChannelModule } from "src/channel/channel.module";
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
		GameModule,

		// TODO: Remove this.
		FileModule,
	],
})
export class AppModule {}
