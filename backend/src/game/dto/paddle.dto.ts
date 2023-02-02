// TODO: Validators?

/**
 * DTO received from client in 'update' event.
 */
export class PaddleDto {
	public position: number;
	public velocity: number;

	/* CONSTRUCTOR ============================================================= */

	constructor(position: number, velocity: number) {
		this.position = position;
		this.velocity = velocity;
	}
}
