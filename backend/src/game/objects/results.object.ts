import { Score } from "../aliases";
import { Constants } from "../constants";

function getCurrentTime(date: Date): string {
	const day: string = ("0" + date.getDate()).slice(-2);
	const month: string = ("0" + (date.getMonth() + 1)).slice(-2);
	return (
		date.getFullYear() +
		"-" +
		month +
		"-" +
		day +
		" " +
		date.getHours() +
		":" +
		date.getMinutes() +
		":" +
		date.getSeconds()
	);
}

class PlayerData {
	public readonly id: string;
	public readonly score: number;
	public readonly winner: boolean;

	/* CONSTRUCTOR ============================================================= */

	constructor(score: number, winner?: boolean) {
		this.score = score;

		if (winner !== undefined) this.winner = winner;
		else {
			if (score === Constants.max_score) this.winner = true;
			else this.winner = false;
		}
	}
}

export class Results {
	public readonly player1: PlayerData;
	public readonly player2: PlayerData;
	public readonly date: string;

	/* CONSTRUCTOR ============================================================= */

	constructor(score: Score, guilty?: number) {
		const date: Date = new Date();

		if (guilty === undefined) {
			this.player1 = new PlayerData(score.player1_score);
			this.player2 = new PlayerData(score.player2_score);
		} else {
			if (guilty === 1) {
				this.player1 = new PlayerData(score.player1_score, false);
				this.player2 = new PlayerData(score.player2_score, true);
			} else {
				this.player1 = new PlayerData(score.player1_score, true);
				this.player2 = new PlayerData(score.player2_score, false);
			}
		}
		this.date = getCurrentTime(date);
	}
}
