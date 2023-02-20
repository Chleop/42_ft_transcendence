import { PrismaModule } from "src/prisma/prisma.module";
import { SkinController } from "src/skin/skin.controller";
import { SkinService } from "src/skin/skin.service";
import { Module } from "@nestjs/common";

@Module({
	controllers: [SkinController],
	imports: [PrismaModule],
	providers: [SkinService],
})
export class SkinModule {}
