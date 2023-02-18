import { Constants } from "../constants";

/**
 * Generated when a party marks a point.
 *
 * Contains updated scores and game status.
 */
export class ScoreUpdate {
	public readonly opponent: number;
	public readonly you: number;
	public readonly just_scored: string;
	public readonly is_ongoing: boolean;

	/* CONSTRUCTOR ============================================================= */

	constructor(score_1: number, score_2: number, is_left: boolean) {
		if (is_left === true) {
			this.just_scored = "you";
			this.you = score_2;
			this.opponent = score_1;
		} else {
			this.just_scored = "opponent";
			this.you = score_1;
			this.opponent = score_2;
		}
		if (score_1 === Constants.max_score) this.is_ongoing = false;
		else this.is_ongoing = true;
	}

	/* ------------------------------------------------------------------------- */

	public invert(): ScoreUpdate {
		const who: boolean = this.just_scored === "you" ? false : true;
		return new ScoreUpdate(this.you, this.opponent, who);
	}
}
