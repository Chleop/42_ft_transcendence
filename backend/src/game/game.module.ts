import { Module } from '@nestjs/common';
import { Game } from './game';
import { GameService } from './game.service';

/* Will handle information exchanges between back and front */
@Module({
	providers: [Game, GameService]
})
export class GameModule {}
