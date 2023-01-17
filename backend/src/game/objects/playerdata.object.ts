import * as Constants from "../constants/constants";

export class PlayerData {
	public readonly id: string;
	public readonly score: number;
	public readonly winner: boolean;

	constructor(score: number, winner?: boolean) {
		this.score = score;

		if (winner !== undefined) this.winner = winner;
		else {
			if (score === Constants.max_score) this.winner = true;
			else this.winner = false;
		}
	}
}
