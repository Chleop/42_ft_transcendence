import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { FriendRequestController } from "src/friend_request/friend_request.controller";
import { FriendRequestService } from "src/friend_request/friend_request.service";
import { ChatModule } from "src/chat/chat.module";

@Module({
	controllers: [FriendRequestController],
	imports: [PrismaModule, ChatModule],
	providers: [FriendRequestService],
})
export class FriendRequestModule {}
