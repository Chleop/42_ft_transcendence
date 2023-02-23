export interface IGame {
	id: string;
	players_ids: [string, string];
	scores: [number, number];
	date_time: Date;
	winner_id: string;
}

export interface IGameTmp {
	id: string;
	player0_id: string;
	player1_id: string;
	score0: number;
	score1: number;
	dateTime: Date;
	winnerId: string;
}
