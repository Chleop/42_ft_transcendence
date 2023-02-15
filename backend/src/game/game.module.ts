import { Module } from "@nestjs/common";
import { GameService /* SpectatorService */ } from "./game.service";
import { GameGateway /* SpectatorGateway */ } from "./game.gateway";

@Module({
	providers: [GameGateway /* SpectatorGateway */, GameService /* SpectatorService */],
	exports: [GameService],
})
export class GameModule {}
