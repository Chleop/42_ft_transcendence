import { Module } from "@nestjs/common";
import { GameService } from "./services";
import { GameGateway, SpectatorGateway } from "./gateways";
import { UserService } from "src/user/user.service";

@Module({
	providers: [GameGateway, SpectatorGateway, GameService, UserService],
})
export class GameModule {}
