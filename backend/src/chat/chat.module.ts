import { Module } from "@nestjs/common";
import { ChatGateway } from "src/chat/chat.gateway";
import { ChatService } from "src/chat/chat.service";

@Module({
	providers: [ChatGateway, ChatService],
})
export class ChatModule {}
