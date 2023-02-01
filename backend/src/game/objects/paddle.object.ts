import { PaddleDto } from "../dto";

export class Paddle {
	public position: number;
	public last_update: number;

	constructor() {
		this.position = 0;
		this.last_update = -1;
	}

	public update(dto: PaddleDto, time: number): void {
		this.position = dto.position;
		this.last_update = time;
		return;
	}
}
