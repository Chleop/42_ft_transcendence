import { Module } from "@nestjs/common";
import { ChatGateway } from "src/chat/chat.gateway";
import { ChatService } from "src/chat/chat.service";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
	imports: [PrismaModule],
	providers: [ChatGateway, ChatService],
	exports: [ChatGateway, ChatService],
})
export class ChatModule {}
