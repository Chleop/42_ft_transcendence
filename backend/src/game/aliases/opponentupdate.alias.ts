import { Client } from ".";
import { PaddleDto } from "../dto";

export type OpponentUpdate = {
	// Opponent socket
	player: Client;

	// Paddle of the client
	updated_paddle: PaddleDto;
};
