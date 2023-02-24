import { Module } from "@nestjs/common";
import { SpectatorGateway } from "./spectator.gateway";
import { SpectatorService } from "./spectator.service";
import { GameModule } from "src/game/game.module";
import { ChatModule } from "src/chat/chat.module";

@Module({
	providers: [SpectatorGateway, SpectatorService],
	imports: [GameModule, ChatModule],
})
export class SpectatorModule {}
