export interface IGame {
	id: string;
	players_ids: [string, string];
	scores: [number, number];
	date_time: Date;
	winner_id: string;
}

export interface IGameTmp {
	id: string;
	players: IPlayer[];
	scores: number[];
	dateTime: Date;
	winnerId: string;
}

interface IPlayer {
	id: string;
}
