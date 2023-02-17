import { Module } from "@nestjs/common";
import { SpectatorGateway } from "./spectator.gateway";
import { SpectatorService } from "./spectator.service";
import { UserModule } from "../user/user.module";
import { GameModule } from "src/game/game.module";
import { ChatModule } from "src/chat/chat.module";

@Module({
	providers: [SpectatorGateway, SpectatorService],
	imports: [UserModule, GameModule, ChatModule],
})
export class SpectatorModule {}
