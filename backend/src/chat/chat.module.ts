import { Module } from "@nestjs/common";
import { ChannelService } from "src/channel/channel.service";
import { ChatController } from "src/chat/chat.controller";
import { ChatGateway } from "src/chat/chat.gateway";
import { ChatService } from "src/chat/chat.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { UserService } from "src/user/user.service";

@Module({
	controllers: [ChatController],
	imports: [PrismaModule],
	providers: [ChatGateway, ChatService, ChannelService, UserService],
	exports: [ChatGateway, ChatService],
})
export class ChatModule {}
