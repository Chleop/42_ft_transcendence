// TODO: Validators?

/**
 * DTO received from client in 'update' event.
 */
export class PaddleDto {
	public readonly position: number;
	public readonly velocity: number;

	/* CONSTRUCTOR ============================================================= */

	constructor(position: number, velocity: number) {
		this.position = position;
		this.velocity = velocity;
	}
}
