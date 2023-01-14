import { Socket } from "socket.io";
import { Gameplay } from "../gameplay";
import { PaddleDto } from "../dto";
import { AntiCheat, Score, Match } from "../aliases";
import { ResultsObject, GameUpdate } from "../objects";

// TODO: make it cleaner
type CheatCheck = {
	has_cheated: boolean;
	updated_paddle: PaddleDto;
};

/* Holds info on the gameroom
	 Once someone leaves the game, the room is completely removed.
*/
export class GameRoom {
	public readonly match: Match;
	private ping_id: NodeJS.Timer | null;
	private game: Gameplay | null;

	constructor(match: Match) {
		this.match = match;
		this.ping_id = null;
		this.game = null;
		console.info("Room created:", this.match.name);
	}

	/* == PUBLIC ================================================================================ */

	/* -- GAME MANAGEMENT ----------------------------------------------------- */
	/* Call this function once the game actually starts */
	public startGame(): GameUpdate {
		this.game = new Gameplay();
		return this.game.initializeGame();
	}

	/* Called every 16ms to send ball updates */
	public updateGame(): GameUpdate {
		if (this.game === null) throw "Game is null";
		return this.game.refresh();
	}

	/* Called everytime the sender sent an update */
	public updatePaddle(client: Socket, dto: PaddleDto): AntiCheat | null {
		if (this.game === null) return null;
		const cheat_check: CheatCheck | null = this.game.checkUpdate(
			this.playerNumber(client),
			dto,
		);
		if (cheat_check === null) return null;
		return {
			p1: cheat_check.has_cheated ? cheat_check.updated_paddle : null,
			p2: {
				player: this.whoIsOpponent(client),
				updated_paddle: cheat_check.updated_paddle,
			},
		};
	}

	/* Saves the current state of the game */
	public cutGameShort(guilty: number | null): ResultsObject | null {
		if (!this.game) return null;
		else if (guilty === null) return null;
		return this.game.getResults(guilty);
	}

	/* -- INTERVAL UTILS ------------------------------------------------------ */
	/* Stores the ID of the setInterval function */
	public setPingId(timer_id: NodeJS.Timer): void {
		this.ping_id = timer_id;
	}

	/* Destroys associated setInteval instance */
	public destroyPing(): void {
		if (this.ping_id === null) return;
		clearInterval(this.ping_id);
	}

	/* -- IDENTIFIERS --------------------------------------------------------- */
	public isClientInRoom(client: Socket): boolean {
		return (
			this.match.player1.socket.id === client.id || this.match.player2.socket.id === client.id
		);
	}

	/* Returns player's number */
	public playerNumber(client: Socket): number | null {
		if (this.match.player1.socket.id === client.id) return 1;
		else if (this.match.player2.socket.id === client.id) return 2;
		return null;
	}

	/* -- UTILS --------------------------------------------------------------- */
	// TODO: Useless??
	public getScores(): Score {
		if (!this.game) throw "Game didn't start yet";
		return this.game.getScores();
	}

	/* == PRIVATE =============================================================================== */

	/* -- IDENTIFIERS --------------------------------------------------------- */
	/* Returns client's opponent socket */
	private whoIsOpponent(client: Socket): Socket {
		if (this.match.player1.socket.id === client.id) return this.match.player2.socket;
		else return this.match.player1.socket;
	}
}
