import { Module } from "@nestjs/common";
import { GameService, SpectatorService } from "./services";
import { GameGateway, SpectatorGateway } from "./gateways";
import { UserModule } from "src/user/user.module";

@Module({
	providers: [GameGateway, SpectatorGateway, GameService, SpectatorService],
	imports: [UserModule]
})
export class GameModule {}
