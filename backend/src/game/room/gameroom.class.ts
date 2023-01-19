import { Socket } from "socket.io";
import { Gameplay } from "../gameplay";
import { PaddleDto } from "../dto";
import { AntiCheat, Score, Match } from "../aliases";
import { ResultsObject, Ball, ScoreUpdate } from "../objects";

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
	private players_ping_id: NodeJS.Timer | null;
	// private spectators_ping_id: NodeJS.Timer | null;
	private game: Gameplay;
	// public spectators: Socket[];

	constructor(match: Match) {
		this.match = match;
		this.players_ping_id = null;
		// this.spectators_ping_id = null;
		this.game = new Gameplay();
		// this.spectators = [];
		console.log("Room created:", this.match.name);
	}

	/* == PUBLIC ================================================================================ */

	/* -- GAME MANAGEMENT ----------------------------------------------------- */
	/* Call this function once the game actually starts */
	public startGame(): Ball /* GameUpdate */ {
		// this.game = new Gameplay();
		return this.game.initializeGame();
	}

	/* Called every 16ms to send ball updates */
	public updateGame(): Ball | ScoreUpdate /* GameUpdate */ {
		// if (this.game === null) throw "Game is null";
		return this.game.refresh();
	}

	/* Called everytime the sender sent an update */
	public updatePaddle(client: Socket, dto: PaddleDto): AntiCheat {
		if (this.game === null) throw "Game hasn't started yet";
		const cheat_check: CheatCheck = this.game.checkUpdate(this.playerNumber(client), dto);
		return {
			p1: cheat_check.has_cheated ? cheat_check.updated_paddle : null,
			p2: {
				player: this.whoIsOpponent(client),
				updated_paddle: cheat_check.updated_paddle,
			},
		};
	}

	/* Saves the current state of the game */
	public cutGameShort(guilty: number | null): ResultsObject {
		if (!this.game) throw null;
		else if (guilty === null) throw null;
		return this.game.getResults(guilty);
	}

	public getFinalScore(): ScoreUpdate {
		return this.game.getFinalScore();
	}

	/* -- GAME MANAGEMENT ----------------------------------------------------- */
	// public addSpectator(client: Socket): void {
	// 	this.spectators.push(client);
	// }

	// public removeSpectator(client: Socket): void {
	// 	const index: number = this.spectators.findIndex((obj) => {
	// 		return obj.id === client.id;
	// 	});
	// 	if (index < 0) return;
	// 	this.spectators.splice(index, 1);
	// }

	public getBall(): Ball {
		return this.game.getBall();
	}
	/* -- INTERVAL UTILS ------------------------------------------------------ */
	/* Stores the ID of the setInterval function */
	public setPlayerPingId(timer_id: NodeJS.Timer): void {
		this.players_ping_id = timer_id;
	}

	/* Destroys associated setInteval instance */
	public destroyPlayerPing(): void {
		if (this.players_ping_id === null) return;
		clearInterval(this.players_ping_id);
	}

	// public setSpectatorPingId(timer_id: NodeJS.Timer): void {
	// 	this.spectators_ping_id = timer_id;
	// }

	// public destroySpectatorPing(): void {
	// 	if (this.spectators_ping_id === null) return;
	// 	clearInterval(this.spectators_ping_id);
	// }

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
