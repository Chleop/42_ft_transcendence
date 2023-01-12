import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";
import { UserModule } from "src/user/user.module";
import { ChannelModule } from "src/channel/channel.module";

@Module({
	imports: [
		ChannelModule,
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		UserModule,
	],
})
export class AppModule {}
