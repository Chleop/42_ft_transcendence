import { Gameplay } from '../gameplay/gameplay.class';
import { Score, Match, Client } from '../aliases';
import { Socket } from 'socket.io';


/* Holds info on the gameroom
	 Once someone leaves the game, the room is completely removed.
	 Link between gameplay & service
*/
export class GameRoom {
	public readonly match: Match;
	private game: Gameplay = null;

	constructor(match: Match) {
		this.match = match;
		console.info('Room created:', this.match.name);
	}

	/* == PUBLIC ================================================================================== */

	/* Call this function once the game actually starts */
	public create(): void {
		this.game = new Gameplay();
	}

	public isClientInRoom(client: Socket): boolean {
		if (this.match.player1.socket.id === client.id
				|| this.match.player2.socket.id === client.id)
		 return true;
	 return false;
	}

	public whoIs(client: Socket): string | null {
		if (this.match.player1.socket.id === client.id)
			return 'player1';
		else if (this.match.player1.socket.id === client.id)
			return 'player2';
		return null;
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
