import { Module } from "@nestjs/common";
import { GameService } from "./game.service";
import { GameGateway, SpectatorGateway } from "./gateways";

//TODO: Middleware
/* Will handle information exchanges between back and front */
@Module({
	providers: [GameGateway, SpectatorGateway, GameService],
})
export class GameModule {}
