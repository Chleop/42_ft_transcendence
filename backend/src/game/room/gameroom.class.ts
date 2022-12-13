import { Gameplay } from '../gameplay/gameplay.class';

import { Score } from '../aliases';
import { Match, Player } from '../alias';
import { Socket } from 'socket.io';


/* Holds info on the gameroom
	 For now, the room id is the host id.
	 Once someone leaves the game, the room is completely removed.
*/
export class GameRoom {
	public readonly match: Match;
	private game: Gameplay = null;

	constructor(match: Match) {
		this.match = match;
		console.info('Room created:', this.match.name);
	}

	/* == PUBLIC ================================================================================== */
	public isClientInRoom(client: Socket): boolean {
		if (this.match.player1.socket === client
				|| this.match.player2.socket === client)
		 return true;
	 return false;	 
	}

	public create(): void {
		this.game = new Gameplay();
	}

	public getScores(): Score {
		if (!this.game)
			throw 'Game didn\'t start yet';
		return this.game.getScores();
	}
//	/* == PUBLIC ================================================================================== */
//
//	constructor(host: Client) {
//		this.name = host;
//		this.user1 = host;
//		console.log(`Room '${this.name}' created`);
//	}
//
//	/* -- USERS MANAGEMENT ---------------------- */
//	public addGuest(player: Client): void {
//		if (this.user2 !== undefined) // Ignore spec for now
//			throw 'Room full';
//		this.user2 = player;
//		//console.info("Adding guest ", player.id);
//	}
//
//	public removeUser(id: string): boolean {
//		if (this.user1 === id)
//			this.user1 = undefined;
//		else if (this.user2 === id)
//			this.user2 = undefined;
//		return this.isEmpty();
//	}
//
//	/* -- GAMEPLAY ------------------------------ */
//	public startGame(): Ball {
//		console.info("Starting game");
//		return ;
//		return this.game.startGame();
//		//setInterval(refreshBall, 20, ball);
//	}
//
//	/* -- UTILS --------------------------------- */
//	public isClientInRoom(socket_id: string): boolean {
//		if (this.user1 !== undefined && this.user1 === socket_id
//				|| this.user2 !== undefined && this.user2 === socket_id)
//		 return true;
//	 return false;	 
//	}
//
//	public isEmpty(): boolean {
//		if (this.user1 === undefined && this.user2 === undefined)
//			return true;
//		return false;
//	}
//	
//	public isFull(): boolean {
//		if (this.user1 !== undefined && this.user2 !== undefined)
//			return true;
//		return false;
//	}
//
//
//	/* == PRIVATE ================================================================================= */

}
