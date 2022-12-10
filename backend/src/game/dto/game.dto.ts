class Coord {
	x: number;
	y: number;
};

/* TODO: Add nb hit per paddle ? */
export class GameDto {
	room: string;
	pos_p1: Coord;
	pos_p2: Coord;
	pos_ball: Coord;
	speed_ball: Coord;
	hit_paddle: number;
}
