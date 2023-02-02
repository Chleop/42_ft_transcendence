import { Socket } from "socket.io";
import { PaddleDto } from "../dto";

export class OpponentUpdate {
	player: Socket;
	updated_paddle: PaddleDto;

	/* CONSTRUCTOR ============================================================= */

	constructor(opponent: Socket, paddle: PaddleDto) {
		this.player = opponent;
		this.updated_paddle = paddle;
	}
}
