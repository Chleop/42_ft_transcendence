import { Module } from "@nestjs/common";
import { ChannelService } from "src/channel/channel.service";
// import { ChatGateway } from "src/chat/chat.gateway";
import { PrismaModule } from "src/prisma/prisma.module";
import { UserController } from "src/user/user.controller";
import { UserService } from "src/user/user.service";

@Module({
	controllers: [UserController],
	imports: [PrismaModule],
	providers: [UserService, ChannelService],
	exports: [UserService],
})
export class UserModule {}
