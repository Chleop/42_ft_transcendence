import { IsDefined, IsIn, IsNumber, Max, Min } from "class-validator";

/**
 * DTO received from client in 'update' event.
 */
export class PaddleDto {
	@IsDefined()
	@IsNumber()
	@Min(-4.5)
	@Max(4.5)
	public readonly position: number;

	@IsDefined()
	@IsNumber()
	@IsIn([-1, 0, 1])
	public readonly velocity: number;

	/* CONSTRUCTOR ============================================================= */

	constructor(position: number, velocity: number) {
		this.position = position;
		this.velocity = velocity;
	}
}
