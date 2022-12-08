import { Controller, Get, Param } from '@nestjs/common';
import { GameroomService } from './gameroom.service';

@Controller('room/:id')
export class GameroomController {
	constructor(private readonly gameroomService: GameroomService) {}

	@Get()
	public connectPlayerToRoom(
		@Param('id') roomId: string
	): string {
		return this.gameroomService.getRoomById(roomId);
	}
}
