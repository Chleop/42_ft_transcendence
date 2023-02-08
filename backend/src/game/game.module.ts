import { Module } from "@nestjs/common";
import { GameService, SpectatorService } from "./services";
import { GameGateway, SpectatorGateway } from "./gateways";
import { UserService } from "src/user/user.service";

@Module({
	providers: [GameGateway, SpectatorGateway, GameService, SpectatorService, UserService],
})
export class GameModule {}
