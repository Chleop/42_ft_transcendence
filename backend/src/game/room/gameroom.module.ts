import { Module } from '@nestjs/common';
import { GameroomController } from './gameroom.controller';
import { GameroomService } from './gameroom.service';

/* Handles joining in a gameroom */
@Module({
	controllers: [GameroomController],
	providers: [GameroomService]
})
export class GameroomModule {}
