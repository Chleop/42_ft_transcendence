import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Server } from "socket.io";
import { Client } from "../aliases";
import { GameService, SpectateService } from "../services";
import { GameRoom, SpectatedRoom } from "../rooms";
import * as Constants from "../constants/constants";

@WebSocketGateway({
	namespace: "/spectate",
	cors: {
		origin: ["http://localhost:3000"],
	},
})
export class SpectatorGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
	@WebSocketServer()
	public readonly server: Server;
	private readonly game_service: GameService;
	// private rooms: SpectatedRoom[];
	private readonly spectate_service: SpectateService;

	/* CONSTRUCTOR ============================================================= */

	constructor(game_service: GameService, spectate_service: SpectateService) {
		this.server = new Server();
		this.game_service = game_service;
		this.spectate_service = spectate_service;
	}

	/* PUBLIC ================================================================== */

	public afterInit(): void {
		console.log("Spectator gateway initialized");
	}

	/* Connection Handler ------------------------------------------------------ */

	public handleConnection(client: Client): void {
		// Find game to spectate: Cookie? Header?
		// For now:
		//		client.handshake.headers.socket_id

		console.log(`Client '${client.id}' joined`);
		const room: GameRoom | null = this.game_service.findUserGame(client);
		if (room instanceof GameRoom) {
			client.join(room.match.name);
			return this.startStreaming(client, room);
		}
	}

	public handleDisconnect(client: Client): void {
		const room: GameRoom | null = this.game_service.findUserGame(client);
		if (room instanceof GameRoom) {
			const spectated_room: SpectatedRoom | null = this.spectate_service.getRoom(
				room.match.name,
			);
			if (spectated_room instanceof SpectatedRoom) {
				spectated_room.removeSpectator(client);
				if (spectated_room.isEmpty())
					this.stopStreaming(this, spectated_room.game_room.match.name);
			}
		}
		console.log(`Client '${client.id}' left`);
	}

	/* PRIVATE ================================================================= */

	private startStreaming(client: Client, room: GameRoom): void {
		const spectated_room: SpectatedRoom | null = this.spectate_service.getRoom(room.match.name);
		if (spectated_room === null) {
			console.log(`Creating room ${room.match.name}`);
			// Create a new spec room if it doesn't exist
			const new_room: SpectatedRoom = new SpectatedRoom(
				room,
				setInterval(this.updateGame, Constants.ping, this, room),
			);
			new_room.addSpectator(client);
			this.spectate_service.add(new_room);
		} else {
			console.log(`${room.match.name} exists`);
			// The room exists
		}
	}

	private updateGame(me: SpectatorGateway, room: GameRoom): void {
		try {
			// me.server.emit("updateBallSpectator", room.getBall());
			me.server.emit("updatePaddles", room.getSpectatorUpdate());
		} catch (e) {
			if (e === null) {
				// Game is done
				me.stopStreaming(me, room.match.name);
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
