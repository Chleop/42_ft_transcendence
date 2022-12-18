import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';

//TODO: Middleware
/* Will handle information exchanges between back and front */
@Module({
	providers: [GameGateway, GameService]
})
export class GameModule {}
