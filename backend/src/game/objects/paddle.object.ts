import { PaddleDto } from "../dto";

import * as Constants from "../constants/constants";

export class Paddle {
	public position: number;
	public last_update: number;

	constructor() {
		this.position = 0;
		this.last_update = -1;
	}

	public update(dto: PaddleDto, time: number): PaddleDto {
		if (this.last_update === -1) {
			this.position = dto.position;
			this.last_update = time;
			return dto;
		}
		const delta_time: number = time - this.last_update;
		const positon_est: number =
			delta_time * dto.velocity * Constants.paddle_speed - this.position;
		if (
			dto.position < positon_est - Constants.margin &&
			dto.position > positon_est + Constants.margin
		)
			throw new PaddleDto(positon_est, dto.velocity);
		this.position = dto.position;
		this.last_update = time;
		return dto;
	}
}
