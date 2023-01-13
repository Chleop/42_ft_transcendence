/* Timespan before kicked out of queue */
export const matchmaking_timeout: number = 10000;

/* Speed */
export const initial_speed: number = 5;

/* Acceleration */
export const acceleration: number = 1.005;

/* Value in seconds */
export const ping: number = 16;

/* Height and width, divided by 2 */
export const w_2: number = 8;
export const h_2: number = 4.5;

/* Half of paddle size */
export const paddle_radius: number = 1;

/* Shift paddle from wall */
export const paddle_x: number = 1;
export const max_paddle: number = w_2 - paddle_x; // = 8 - 1 = 7

/* Ball radius */
export const radius: number = 0.2;

/* Limit score for victory */
export const max_score: number = 3;

/* Actual limit on x hit by ball */
export const limit_x: number = max_paddle - radius; // 7 - 0.2 = 6.8

/* Limit angle for ball launch: pi/6 (theta) */
export const cos: number = 8.66;
export const sin: number = 5;

/* Margin of error for paddle: 2% */
export const margin: number = 0.02;

// export type Constant = {
// 	matchmaking_timeout: number;
// 	initial_speed: number;
// 	acceleration: number;
// 	ping: number;
// 	w_2: number;
// 	h_2: number;
// 	paddle_radius: number;
// 	paddle_x: number;
// 	max_paddle: number;
// 	radius: number;
// 	max_score: number;
// 	limit_x: number;
// 	cos: number;
// 	sin: number;
// 	margin: number;
// };

// module.exports = {
// 	matchmaking_timeout: matchmaking_timeout,
// 	initial_speed: initial_speed,
// 	acceleration: acceleration,
// 	ping: ping,
// 	w_2: w_2,
// 	h_2: h_2,
// 	paddle_radius: paddle_radius,
// 	paddle_x: paddle_x,
// 	max_paddle: max_paddle,
// 	radius: radius,
// 	max_score: max_score,
// 	limit_x: limit_x,
// 	cos: cos,
// 	sin: sin,
// 	margin: margin,
// };
