import { Module } from "@nestjs/common";
import { ChannelService } from "src/channel/channel.service";
import { ChatModule } from "src/chat/chat.module";
import { PrismaModule } from "src/prisma/prisma.module";
import { UserController } from "src/user/user.controller";
import { UserService } from "src/user/user.service";

@Module({
	controllers: [UserController],
	imports: [PrismaModule, ChatModule],
	providers: [UserService, ChannelService],
	exports: [UserService],
})
export class UserModule {}
