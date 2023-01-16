/* Timespan before kicked out of queue */
// export const matchmaking_timeout: number = 10000;

/* Speed */
export const initial_speed: number = 5;

/* Acceleration factor */
export const acceleration: number = 1.05;

/* Ball radius */
export const ball_radius: number = 0.2;

/* Value in seconds */
export const ping: number = 16;

/* Height and width, divided by 2 */
export const w_2: number = 8;
export const h_2: number = 4.5;

/* Limit score for victory */
export const max_score: number = 10;

/* Half of paddle size */
export const paddle_radius: number = 1;

// export const paddle_thickness: number = 0.2;x

/* Shift paddle from wall */
export const paddle_x: number = 1;

/* Maximum x value for ball x on wall */
export const max_x: number = w_2 - paddle_x; // = 8 - 1 = 7

/* Actual limit on x hit by ball */
export const limit_x: number = max_x - ball_radius; // = 6.8

/* Actual limit on y hit by ball */
export const limit_y: number = h_2 - ball_radius; // = 4.5 - 0.2 = 4.3

export enum BallRefreshResult {
	oneCollide,
	twoCollide,
	oneOutside,
	twoOutside,
	nothing,
}

// /* Margin of error for paddle: 2% */
// export const margin: number = 0.02;
