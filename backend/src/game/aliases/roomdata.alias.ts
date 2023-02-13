import { PlayerInfos } from "../objects";

/**
 * Holds each players of a game room datas (login, avatar, etc).
 */
export type RoomData = {
	player1: PlayerInfos;
	player2: PlayerInfos;
};
