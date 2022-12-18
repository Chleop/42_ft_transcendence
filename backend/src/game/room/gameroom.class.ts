import { Socket } from 'socket.io';
import { Gameplay } from '../gameplay';
import { PaddleDto } from '../dto';
import {
	OpponentUpdate,
	GameUpdate,
	Score,
	Match,
	Client
} from '../aliases';
import { Ball, ResultsObject } from '../objects';


/* Holds info on the gameroom
	 Once someone leaves the game, the room is completely removed.
	 Link between gameplay & service
*/
export class GameRoom {
	public readonly match: Match;
	private ping_id : NodeJS.Timer;
	private game: Gameplay = null;

	private nb_update: number;

	constructor(match: Match) {
		this.match = match;
		this.nb_update = 0;
		console.info('Room created:', this.match.name);
	}

	/* == PUBLIC ================================================================================== */

	/* -- GAME MANAGEMENT ----------------------------------------------------- */
	/* Call this function once the game actually starts */
	public startGame(): GameUpdate {
		this.game = new Gameplay();
		return this.game.initializeGame();
	}

	/* Called every 20ms to send ball updates */
	public updateGame(): GameUpdate {
		if (this.nb_update++ > 5)
			throw null;
		return this.game.refresh();
	}

	/* Called everytime the sender sent an update */
	public updatePaddle(client: Socket, dto: PaddleDto): OpponentUpdate {
		const updated_paddle: PaddleDto = this.game.checkUpdate(this.playerNumber(client), dto);
		return {
			player: this.whoIsOpponent(client),
			updated_paddle: updated_paddle
		};
	}

	public cutGameShort(guilty: number): ResultsObject {
		return this.game.getResults(guilty);
	}

	/* -- INTERVAL UTILS ------------------------------------------------------ */
	/* Stores the ID of the setInterval function */
	public setPingId(timer_id: NodeJS.Timer): void {
		this.ping_id = timer_id;
	}

	/* Destroys associated setInteval instance */
	public destroyPing(): void {
		clearInterval(this.ping_id);
	}

	/* -- IDENTIFIERS --------------------------------------------------------- */
	public isClientInRoom(client: Socket): boolean {
		if (this.match.player1.socket.id === client.id
				|| this.match.player2.socket.id === client.id) {
		 return true;
		}
	 return false;
	}

	public playerNumber(client: Socket): number | null {
		if (this.match.player1.socket.id === client.id)
			return 1;
		else if (this.match.player2.socket.id === client.id)
			return 2;
		return null;
	}

	/* -- UTILS --------------------------------------------------------------- */
	public getScores(): Score {
		if (!this.game)
			throw 'Game didn\'t start yet';
		return this.game.getScores();
	}

	/* == PRIVATE ================================================================================= */

	/* -- IDENTIFIERS --------------------------------------------------------- */
	private whoIsOpponent(client: Socket): Socket | null {
		if (this.match.player1.socket.id === client.id)
			return this.match.player2.socket;
		else if (this.match.player2.socket.id === client.id)
			return this.match.player1.socket;
		return null;
	}

}
