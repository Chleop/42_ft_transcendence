import { Score } from "../aliases";

/**
 * Returns formatted date string.
 */
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

/**
 * Scores summary.
 *
 * Object used to be saved in the database.
 */
export class Results {
	public readonly date: string;
	public readonly score: Score;
	public winner: string;

	/* CONSTRUCTOR ============================================================= */

	constructor(score: Score, winner?: string) {
		const date: Date = new Date();
		this.date = getCurrentTime(date);
		this.score = score;
		if (winner !== undefined) {
			this.winner = winner;
		}
	}

	/* ------------------------------------------------------------------------- */

	public setWinner(id: string): void {
		this.winner = id;
	}
}
