import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { FriendRequestController } from "src/friend_request/friend_request.controller";
import { FriendRequestService } from "src/friend_request/friend_request.service";
import { ChatModule } from "src/chat/chat.module";
import { UserModule } from "src/user/user.module";

@Module({
	controllers: [FriendRequestController],
	imports: [PrismaModule, ChatModule, UserModule],
	providers: [FriendRequestService],
})
export class FriendRequestModule {}
