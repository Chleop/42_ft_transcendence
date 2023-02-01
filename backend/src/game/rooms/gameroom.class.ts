import { Gameplay } from "../gameplay";
import { Socket } from "socket.io";
import { Score, Match, OpponentUpdate } from "../aliases";
import { Results, Ball, ScoreUpdate, SpectatorUpdate } from "../objects";

/**
 * Ongoing game room handle
 *
 * Once someone leaves the game, the room is completely removed.
 */
export class GameRoom {
	public readonly match: Match;
	private players_ping_id: NodeJS.Timer | null;
	private game: Gameplay;
	public is_ongoing: boolean;
	public has_updated_score: boolean;

	/* CONSTRUCTOR ============================================================= */

	constructor(match: Match) {
		this.match = match;
		this.players_ping_id = null;
		this.game = new Gameplay();
		this.is_ongoing = true;
		this.has_updated_score = false;
		console.log("Room created:", this.match.name);
	}

	/* == PUBLIC ================================================================================ */

	/* -- GAME MANAGEMENT ----------------------------------------------------- */
	/* Call this function once the game actually starts */
	public startGame(): Ball {
		return this.game.initializeGame();
	}

	/* Called every 16ms to send ball updates */
	public updateGame(): Ball | ScoreUpdate | Results {
		return this.game.refresh();
	}

	/* Called everytime the sender sent an update */
	public updatePaddle(client: Socket): OpponentUpdate {
		if (this.game === null) throw "Game hasn't started yet";
		return {
			player: this.whoIsOpponent(client),
			updated_paddle: this.game.checkUpdate(
				this.playerNumber(client),
				client.data.paddle_dto,
			),
		};
	}

	/* Saves the current state of the game */
	public cutGameShort(guilty: number | null): Results {
		if (!this.game) throw null;
		else if (guilty === null) throw null;
		this.is_ongoing = false;
		this.has_updated_score = false;
		return this.game.getResults(guilty);
	}

	/* -- GAME MANAGEMENT ----------------------------------------------------- */

	public getFinalScore(): ScoreUpdate {
		return this.game.getFinalScore();
	}

	public getSpectatorUpdate(): SpectatorUpdate | Score {
		if (!this.is_ongoing) throw null;
		if (!this.has_updated_score) {
			this.has_updated_score = true;
			return this.game.getScores();
		}
		return this.game.getSpectatorUpdate();
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

	/* -- IDENTIFIERS --------------------------------------------------------- */
	public isSocketInRoom(client: Socket): boolean {
		return (
			this.match.player1.handshake.auth.token === client.handshake.auth.token ||
			this.match.player2.handshake.auth.token === client.handshake.auth.token
		);
	}

	/* Returns player's number */
	public playerNumber(client: Socket): number {
		if (this.match.player1.handshake.auth.token === client.handshake.auth.token) return 1;
		else return 2;
	}

	/* == PRIVATE =============================================================================== */

	/* -- IDENTIFIERS --------------------------------------------------------- */
	/* Returns client's opponent socket */
	private whoIsOpponent(client: Socket): Socket {
		if (this.match.player1.handshake.auth.token === client.handshake.auth.token)
			return this.match.player2;
		else return this.match.player1;
	}
}
