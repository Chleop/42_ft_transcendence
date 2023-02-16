import { Logger, Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { ChannelController } from "src/channel/channel.controller";
import { ChannelService } from "src/channel/channel.service";
import { ChatModule } from "src/chat/chat.module";

@Module({
	controllers: [ChannelController],
	imports: [PrismaModule, ChatModule],
	providers: [ChannelService, Logger],
})
export class ChannelModule {}
