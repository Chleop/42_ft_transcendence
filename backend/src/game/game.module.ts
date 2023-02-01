import { Module } from "@nestjs/common";
import { GameService } from "./services";
import { GameGateway, SpectatorGateway } from "./gateways";

@Module({
	providers: [GameGateway, SpectatorGateway, GameService],
})
export class GameModule {}
