import { Logger } from "@nestjs/common";
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

import { GameService } from "../game/game.service";
import { GameRoom } from "../game/rooms";
import { ScoreUpdate } from "../game/objects";
import { WrongData } from "../game/exceptions";
import { Constants } from "../game/constants";

import { SpectatorService } from "./spectator.service";
import { SpectatedRoom } from "./rooms";
import { RoomData } from "./aliases";
import { SpectatorUpdate } from "./objects";
import { ChatGateway } from "src/chat/chat.gateway";
import { e_user_status } from "src/user/enum";

@WebSocketGateway({
	namespace: "spectate",
	path: "/api/spectate_socket/socket.io",
})
export class SpectatorGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	public readonly server: Server;
	private readonly chat_gateway: ChatGateway;
	private readonly game_service: GameService;
	private readonly spectator_service: SpectatorService;
	private readonly logger: Logger;

	/* CONSTRUCTOR ============================================================= */

	constructor(
		game_service: GameService,
		spectator_service: SpectatorService,
		chat_gateway: ChatGateway,
	) {
		this.server = new Server();
		this.chat_gateway = chat_gateway;
		this.game_service = game_service;
		this.spectator_service = spectator_service;
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
		this.logger.log(`[${client.data.user.login} connected]`);
		try {
			const user_id: string | string[] | undefined = client.handshake.auth.user_id;
			if (typeof user_id !== "string") throw new WrongData("Room not properly specified");
			client.data.valid_uid = true;
			const game_room: GameRoom = this.game_service.findUserGame(user_id);
			return this.startStreaming(client, game_room);
		} catch (e) {
			if (e instanceof WrongData) {
				this.logger.error(e.message);
				client.data.valid_uid = false;
				this.sendError(client, e);
				client.disconnect();
				return;
			}
			throw e;
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
			const spectated_room: SpectatedRoom | null = this.spectator_service.getRoom(
				game_room.match.name,
			);
			if (spectated_room instanceof SpectatedRoom) {
				spectated_room.removeSpectator(client);
				if (spectated_room.isEmpty())
					this.stopStreaming(this, spectated_room.game_room.match.name);
			}
		}
		this.logger.log(`[${client.data.user.login} disconnected]`);
	}

	/* PRIVATE ================================================================= */

	/**
	 * Allows the spectator to watch the ongoing game.
	 * If the room doesn't exist, it is created.
	 */
	private async startStreaming(client: Socket, game_room: GameRoom): Promise<void> {
		client.join(game_room.match.name);

		this.chat_gateway.broadcast_to_online_related_users({
			id: client.data.user.id,
			status: e_user_status.SPECTATING,
			spectating: client.handshake.auth.user_id,
		});

		const spectated_room: SpectatedRoom | null = this.spectator_service.getRoom(
			game_room.match.name,
		);

		if (spectated_room === null) {
			this.logger.log(`Creating spectatedRoom: ${game_room.match.name}`);
			const new_room: SpectatedRoom = new SpectatedRoom(
				game_room,
				setInterval(this.updateGame, Constants.ping, this, game_room),
			);
			new_room.addSpectator(client);
			this.spectator_service.add(new_room);
		} else {
			this.logger.verbose(`${spectated_room.getName()} already exists`);
		}

		try {
			const room_data: RoomData = await this.spectator_service.retrieveRoomData(game_room);
			client.emit("roomData", room_data);
		} catch (e) {
			// Error from prisma
			// if (e instanceof PrismaClientKnownRequestError) {
			// }
			this.logger.error(e.message);
			this.sendError(client, e);
			client.disconnect();
		}
	}

	/**
	 * Sends game updates to spectators.
	 */
	private updateGame(me: SpectatorGateway, room: GameRoom): void {
		const update: SpectatorUpdate | ScoreUpdate | null = room.getSpectatorUpdate();
		if (update === null) {
			me.server.to(room.match.name).emit("endOfGame");
			me.stopStreaming(me, room.match.name);
		} else {
			me.server.to(room.match.name).emit("updateGame", update);
		}
	}

	/**
	 * Removes the spectated room.
	 */
	private stopStreaming(me: SpectatorGateway, room_name: string): void {
		const room: SpectatedRoom | null = me.spectator_service.getRoom(room_name);

		if (room === null) return;

		me.kickEveryone(room, me);
		me.spectator_service.destroyRoom(room_name);
	}

	/**
	 * Kick clients of a room.
	 */
	private kickEveryone(room: SpectatedRoom, me?: SpectatorGateway): void {
		for (const client of room.spectators) {
			client.data.valid_uid = false;
			me?.chat_gateway.broadcast_to_online_related_users({
				id: client.data.user.id,
				status: e_user_status.ONLINE,
			});
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
