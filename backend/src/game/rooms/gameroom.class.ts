import { Socket } from "socket.io";
import { Gameplay, Ball } from "../gameplay";
import { Score, Match, OpponentUpdate } from "../aliases";
import { Results, ScoreUpdate, SpectatorUpdate } from "../objects";

/**
 * Ongoing game room handler.
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

	/* PUBLIC ================================================================== */

	/**
	 * Initiates game.
	 *
	 * Returns the initial ball coordinates.
	 */
	public startGame(): Ball {
		return this.game.initializeGame();
	}

	/**
	 * Sends game update.
	 *
	 * Returns a ball if nothing noticeable happened,
	 * a score update if a point was marked,
	 * and the final results if someone hit the maximum score.
	 */
	public updateGame(): Ball | ScoreUpdate | Results {
		return this.game.refresh();
	}

	/**
	 * Updates received paddle.
	 */
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

	/**
	 * Stops the game early (when someone leaves the game).
	 */
	public cutGameShort(guilty: number): Results {
		if (!this.game) throw null;
		this.is_ongoing = false;
		this.has_updated_score = false;
		return this.game.getResults(guilty);
	}

	/* ------------------------------------------------------------------------- */

	/**
	 * Sends current game state to spectator.
	 *
	 * Can be a score object if someone marked a point.
	 */
	public getSpectatorUpdate(): SpectatorUpdate | Score {
		if (!this.is_ongoing) throw null;
		if (!this.has_updated_score) {
			this.has_updated_score = true;
			return this.game.getScores();
		}
		return this.game.getSpectatorUpdate();
	}

	public getFinalScore(): ScoreUpdate {
		return this.game.getFinalScore();
	}

	/* Ping -------------------------------------------------------------------- */

	/**
	 * Stores the ID of the setInterval function.
	 */
	public setPlayerPingId(timer_id: NodeJS.Timer): void {
		this.players_ping_id = timer_id;
	}

	/**
	 *  Destroys associated setInteval instance.
	 */
	public destroyPlayerPing(): void {
		if (this.players_ping_id === null) return;
		clearInterval(this.players_ping_id);
	}

	/* Other Utils ------------------------------------------------------------- */

	/**
	 * Returns true if the client is in the room.
	 */
	public isSocketInRoom(client: Socket): boolean {
		return (
			this.match.player1.handshake.auth.token === client.handshake.auth.token ||
			this.match.player2.handshake.auth.token === client.handshake.auth.token
		);
	}

	/**
	 * Returns player's number.
	 */
	public playerNumber(client: Socket): number {
		if (this.match.player1.handshake.auth.token === client.handshake.auth.token) return 1;
		else return 2;
	}

	/* == PRIVATE =============================================================================== */

	/**
	 * Returns client's opponent.
	 */
	private whoIsOpponent(client: Socket): Socket {
		if (this.match.player1.handshake.auth.token === client.handshake.auth.token)
			return this.match.player2;
		else return this.match.player1;
	}
}
