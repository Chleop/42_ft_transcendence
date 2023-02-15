import { Module } from "@nestjs/common";
import { ChatGateway } from "src/chat/chat.gateway";
import { ChatService } from "src/chat/chat.service";
import { WebSocketInterceptor } from "src/websocket.interceptor";

@Module({
	providers: [WebSocketInterceptor, ChatGateway, ChatService],
})
export class ChatModule {}
