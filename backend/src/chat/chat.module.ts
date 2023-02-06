import { Module } from "@nestjs/common";
import { ChatGateway } from "src/chat/chat.gateway";

@Module({
	providers: [ChatGateway],
})
export class ChatModule {}
