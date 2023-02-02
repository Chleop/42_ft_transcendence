import { Socket } from "socket.io";
import { PaddleDto } from "../dto";

export type OpponentUpdate = {
	/**
	 * Opponent socket instance.
	 */
	player: Socket;

	/**
	 * Updated paddle coordinates.
	 */
	updated_paddle: PaddleDto;
};
