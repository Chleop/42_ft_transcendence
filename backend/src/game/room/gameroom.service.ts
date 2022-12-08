import { Injectable } from '@nestjs/common';

@Injectable()
export class GameroomService {
	 /* Join a room with ${id} */
	public getRoomById(roomId: string): string {
		return `Welcome to the room ${roomId} :)`;
	}
}
