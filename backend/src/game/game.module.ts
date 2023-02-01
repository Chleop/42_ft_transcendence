import { Module } from "@nestjs/common";
import { GameService, SpectateService } from "./services";
import { GameGateway, SpectatorGateway } from "./gateways";

//TODO: Middleware
/* Will handle information exchanges between back and front */
@Module({
	providers: [GameGateway, SpectatorGateway, GameService, SpectateService],
})
export class GameModule {}
