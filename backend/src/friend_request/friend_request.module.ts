import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { FriendRequestController } from "src/friend_request/friend_request.controller";
import { FriendRequestService } from "src/friend_request/friend_request.service";

@Module({
	controllers: [FriendRequestController],
	imports: [PrismaModule],
	providers: [FriendRequestService],
})
export class FriendRequestModule {}
