import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';

//TODO: Middleware
/* Will handle information exchanges between back and front */
@Module({
	providers: [GameGateway]
})
export class GameModule {}
