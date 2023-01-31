import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameService, SpectateService } from "../services";
import { GameRoom, SpectatedRoom } from "../rooms";
import * as Constants from "../constants/constants";

@WebSocketGateway({
	namespace: "spectate",
})
export class SpectatorGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	public readonly server: Server;
	private readonly game_service: GameService;
	private readonly spectate_service: SpectateService;

	/* CONSTRUCTOR ============================================================= */

	constructor(game_service: GameService, spectate_service: SpectateService) {
		this.server = new Server();
		this.game_service = game_service;
		this.spectate_service = spectate_service;
	}

	/* PUBLIC ================================================================== */

	/**
	 * (from OnGatewayInit)
	 * Called after init :)
	 */
	public afterInit(): void {
		console.log("Spectator gateway initialized");
	}

	/* Connection Handler ------------------------------------------------------ */

	/**
	 * (from OnGatewayConnection)
	 * On connection, clients are immediately moved to the spectating room
	 * Else, they're disconnected
	 */
	public handleConnection(client: Socket): void {
		console.log(`Socket '${client.handshake.auth.token}' joined`);
		const room: GameRoom | null = this.game_service.findUserGame(client);
		if (room instanceof GameRoom) {
			client.join(room.match.name);
			return this.startStreaming(client, room);
		}
		client.disconnect(true);
	}

	/**
	 * (from OnGatewayDisconnect)
	 * On disconnection, clients are removed from the spectating room
	 *
	 */
	public handleDisconnect(client: Socket): void {
		const game_room: GameRoom | null = this.game_service.findUserGame(client);
		if (game_room instanceof GameRoom) {
			const spectated_room: SpectatedRoom | null = this.spectate_service.getRoom(
				game_room.match.name,
			);
			if (spectated_room instanceof SpectatedRoom) {
				spectated_room.removeSpectator(client);
				if (spectated_room.isEmpty())
					this.stopStreaming(this, spectated_room.game_room.match.name);
			}
		}
		console.log(`Socket '${client.handshake.auth.token}' left`);
	}

	/* PRIVATE ================================================================= */

	private startStreaming(client: Socket, game_room: GameRoom): void {
		const spectated_room: SpectatedRoom | null = this.spectate_service.getRoom(
			game_room.match.name,
		);
		if (spectated_room === null) {
			// Create a new spec room if it doesn't exist
			console.log(`Creating room ${game_room.match.name}`);

			const new_room: SpectatedRoom = new SpectatedRoom(
				game_room,
				setInterval(this.updateGame, Constants.ping, this, game_room),
			);

			new_room.addSpectator(client);
			this.spectate_service.add(new_room);
		} else {
			console.log(`${game_room.match.name} exists`);
			// The room exists
		}
	}

	private updateGame(me: SpectatorGateway, room: GameRoom): void {
		try {
			me.server.to(room.match.name).emit("updateGame", room.getSpectatorUpdate());
		} catch (e) {
			if (e === null) {
				// Game is done
				me.stopStreaming(me, room.match.name);
				// TODO: inform spectators the game is done
				return;
			}
			throw e;
		}
	}

	private stopStreaming(me: SpectatorGateway, room_name: string): void {
		const room: SpectatedRoom | null = me.spectate_service.getRoom(room_name);

		if (room === null) return;

		me.kickEveryone(room);
		me.spectate_service.destroyRoom(room_name);
	}

	private kickEveryone(room: SpectatedRoom): void {
		for (const client of room.spectators) {
			client.disconnect(true);
		}
	}
}
