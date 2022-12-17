export namespace Constants {
	/* Speed */
	const initial_speed: number = 5;

	/* Acceleration */
	const acceleration: number = 1.005;

	/* Value in seconds */
	const ping: number = .0016;

	/* Height and width, divided by 2 */
	const w_2: number = 8;
	const h_2: number = 4.5;

	/* Half of paddle size */
	const paddle_radius: number = 1;

	/* Shift paddle from wall */
	const paddle_x: number = 1;
	const max_paddle: number = w_2 - paddle_x; // = 8 - 1 = 7

	/* Ball radius */
	const radius: number = .2;

	/* Limit score for victory */
	const max_score: number = 3;

	/* Actual limit on x hit by ball */
	const limit_x: number = max_paddle - radius; // 7 - 0.2 = 6.8

	/* Limit angle for ball launch: pi/6 (theta) */
	const cos: number = 8.66;
	const sin: number = 5;

	/* Margin of error for paddle: 2% */
	const margin: number = .02;
}
