import { Module } from "@nestjs/common";
import { GameService } from "./game.service";
import { GameGateway } from "./game.gateway";
import { WebSocketInterceptor } from "src/websocket.interceptor";

@Module({
	providers: [GameGateway, GameService, WebSocketInterceptor],
	exports: [GameService],
})
export class GameModule {}
