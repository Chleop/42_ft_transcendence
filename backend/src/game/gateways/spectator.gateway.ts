import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameService, SpectatedRooms } from "../services";
import { GameRoom, SpectatedRoom } from "../rooms";
import { PlayerInfos, ScoreUpdate, SpectatorUpdate } from "../objects";
import { Logger, StreamableFile } from "@nestjs/common";
import { UserService } from "src/user/user.service";
import { Constants } from "../constants";

@WebSocketGateway({
	namespace: "spectate",
})
export class SpectatorGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	public readonly server: Server;
	private readonly game_service: GameService;
	private readonly user_service: UserService;
	private readonly spectated_rooms: SpectatedRooms;
	private readonly logger: Logger;

	/* CONSTRUCTOR ============================================================= */

	constructor(game_service: GameService, user_service: UserService) {
		this.server = new Server();
		this.game_service = game_service;
		this.user_service = user_service;
		this.spectated_rooms = new SpectatedRooms();
		this.logger = new Logger(SpectatorGateway.name);
	}

	/* PUBLIC ================================================================== */

	/**
	 * (from OnGatewayInit)
	 * Called after init.
	 */
	public afterInit(): void {
		this.logger.log("Spectator gateway initialized");
	}

	/* Connection Handler ------------------------------------------------------ */

	/**
	 * (from OnGatewayConnection)
	 * Handler for gateway connection.
	 *
	 * On connection, clients are immediately moved to the spectating room.
	 * Else, they're disconnected.
	 */
	public async handleConnection(client: Socket): Promise<void> {
		this.logger.verbose(`['${client.data.user.login}' connected]`);
		try {
			const user_id: string | string[] | undefined = client.handshake.auth.user_id;
			if (typeof user_id !== "string") throw "Room not properly specified";
			client.data.valid_uid = true;
			const room: GameRoom = this.game_service.findUserGame(user_id);

			const player1: Socket = room.match.player1;
			const player2: Socket = room.match.player2;

			const avatar1: StreamableFile = await this.user_service.get_ones_avatar(
				player1.handshake.auth.token,
				player1.handshake.auth.token,
			);
			const avatar2: StreamableFile = await this.user_service.get_ones_avatar(
				player2.handshake.auth.token,
				player2.handshake.auth.token,
			);

			const player_infos1: PlayerInfos = new PlayerInfos(player1.data.user, avatar1);
			const player_infos2: PlayerInfos = new PlayerInfos(player2.data.user, avatar2);

			client.emit("roomData", { player1: player_infos1, player2: player_infos2 });

			client.join(room.match.name);
			return this.startStreaming(client, room);
		} catch (e) {
			this.sendError(client, e);
			client.data.valid_uid = false;
			client.disconnect();
		}
	}

	/**
	 * (from OnGatewayDisconnect)
	 * Handler for gateway disconnection.
	 *
	 * On disconnection, clients are removed from the spectating room
	 * if they sent a valid uid.
	 */
	public handleDisconnect(client: Socket): void {
		if (client.data.valid_uid) {
			const user_id: string = client.handshake.auth.user_id;
			const game_room: GameRoom = this.game_service.findUserGame(user_id);
			const spectated_room: SpectatedRoom | null = this.spectated_rooms.getRoom(
				game_room.match.name,
			);
			if (spectated_room instanceof SpectatedRoom) {
				spectated_room.removeSpectator(client);
				if (spectated_room.isEmpty())
					this.stopStreaming(this, spectated_room.game_room.match.name);
			}
		}
		this.logger.verbose(`['${client.data.user.login}' disconnected]`);
	}

	/* PRIVATE ================================================================= */

	/**
	 * Allows the spectator to watch the ongoing game.
	 * If the room doesn't exist, it is created.
	 */
	private startStreaming(client: Socket, game_room: GameRoom): void {
		const spectated_room: SpectatedRoom | null = this.spectated_rooms.getRoom(
			game_room.match.name,
		);
		if (spectated_room === null) {
			this.logger.verbose(`Creating room ${game_room.match.name}`);
			const new_room: SpectatedRoom = new SpectatedRoom(
				game_room,
				setInterval(this.updateGame, Constants.ping, this, game_room),
			);
			new_room.addSpectator(client);
			this.spectated_rooms.add(new_room);
		} else {
			this.logger.verbose(`${spectated_room.getName()} already exists`);
		}
	}

	/**
	 * Sends game updates to spectators.
	 */
	private updateGame(me: SpectatorGateway, room: GameRoom): void {
		try {
			const update: SpectatorUpdate | ScoreUpdate = room.getSpectatorUpdate();
			me.server.to(room.match.name).emit("updateGame", update);
		} catch (e) {
			if (e === null) {
				// Game is done
				me.server.to(room.match.name).emit("endOfGame");
				me.stopStreaming(me, room.match.name);
				return;
			}
			this.logger.error(e);
			throw e;
		}
	}

	/**
	 * Removes the spectated room.
	 */
	private stopStreaming(me: SpectatorGateway, room_name: string): void {
		const room: SpectatedRoom | null = me.spectated_rooms.getRoom(room_name);

		if (room === null) return;

		me.kickEveryone(room);
		me.spectated_rooms.destroyRoom(room_name);
	}

	/**
	 * Kick clients of a room.
	 */
	private kickEveryone(room: SpectatedRoom): void {
		for (const client of room.spectators) {
			client.data.valid_uid = false; // tested feature
			client.disconnect();
		}
	}

	/**
	 * Sending error event to client.
	 */
	private sendError(client: Socket, msg: string | Error): void {
		if (msg instanceof Error) client.emit("error", msg);
		else client.emit("error", new Error(msg));
	}
}
