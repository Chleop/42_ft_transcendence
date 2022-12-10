import { Module } from '@nestjs/common';
import { GameServer } from './game';
import { GameService } from './game.service';

/* Will handle information exchanges between back and front */
@Module({
	providers: [GameServer, GameService]
})
export class GameModule {}
