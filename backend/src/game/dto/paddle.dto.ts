/* Data received from front-end */
//TODO: validators?
export class PaddleDto {
	// Paddle position
	public position: number;

	// Paddle velocity vector value
	public velocity: number;

	constructor(position: number, velocity: number) {
		this.position = position;
		this.velocity = velocity;
	}
}
