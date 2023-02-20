import { Module } from "@nestjs/common";
import { SpectatorGateway } from "./spectator.gateway";
import { SpectatorService } from "./spectator.service";
import { GameModule } from "src/game/game.module";
import { ChatModule } from "src/chat/chat.module";
// import { UserModule } from "src/user/user.module";

@Module({
	providers: [SpectatorGateway, SpectatorService],
	imports: [/* UserModule, */ GameModule, ChatModule],
})
export class SpectatorModule {}
