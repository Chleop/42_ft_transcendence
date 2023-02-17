import { Module } from "@nestjs/common";
import { GameService } from "./game.service";
import { GameGateway } from "./game.gateway";
import { ChatModule } from "src/chat/chat.module";

@Module({
	imports: [ChatModule],
	providers: [GameGateway, GameService],
	exports: [GameService],
})
export class GameModule {}
