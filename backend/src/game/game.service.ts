import { Injectable } from '@nestjs/common';
import { GameDto } from './dto';

@Injectable()
export class GameService {
	//TODO

	constructor() {
		// Define tick value: setInterval(callback, delay, [args])
	}

	public refreshGame(data: GameDto): string {
		// Check game data accuracy
		// Add to DB
		// Send back as refreshed version
		return 'Hello from serviceRefresh :)';
	}
}
