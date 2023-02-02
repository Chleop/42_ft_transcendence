import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { UserController } from "src/user/user.controller";
import { UserService } from "src/user/user.service";

@Module({
	controllers: [UserController],
	imports: [PrismaModule],
	providers: [UserService],
	exports: [UserService],
})
export class UserModule {}
