import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameService } from "../service";
import { GameRoom } from "../room";
import { SpectatedRoom } from "../objects";
import * as Constants from "../constants/constants";

@WebSocketGateway({
	namespace: "/spectate",
	cors: {
		origin: ["http://localhost:3000"],
	},
})
export class SpectatorGateway {
	@WebSocketServer()
	public readonly server: Server;
	private readonly game_service: GameService;
	private rooms: SpectatedRoom[];

	constructor(game_service: GameService) {
		this.server = new Server();
		this.game_service = game_service;
	}

	public handleConnection(client: Socket): void {
		// Find game to spectate: Cookie? Header?
		// For now:
		//		client.handshake.headers.socket_id

		const room: GameRoom | null = this.game_service.findUserGame(client);
		if (room === null) {
			client.disconnect(true);
		} else {
			client.join(room.match.name);
			this.startSpectating(room);
		}
		this.game_service.display();
	}

	public handleDisconnect(client: Socket): void {
		// if room exists with name
		// remove room and timer

		const room: GameRoom | null = this.game_service.findUserGame(client);
		if (room === null) {
			return;
		} else {
			const spectated_room: SpectatedRoom | undefined = this.rooms.find((obj) => {
				return room.match.name === obj.name;
			});
			if (spectated_room === undefined) {
				return;
			} else {
				--spectated_room.number_spectator;
				if (spectated_room.isEmpty()) {
					this.stopStreaming(spectated_room.name);
				}
			}
		}
	}

	// ------------------------------

	private startSpectating(room: GameRoom): void {
		const spectated_room: SpectatedRoom | undefined = this.rooms.find((obj) => {
			return obj.name === room.match.name;
		});
		if (spectated_room === undefined) {
			const new_room: SpectatedRoom = new SpectatedRoom(
				room.match.name,
				setInterval(this.updateGame, Constants.ping, this, room),
			);
			this.rooms.push(new_room);
		} else {
			++spectated_room.number_spectator;
		}
	}

	private updateGame(me: SpectatorGateway, room: GameRoom): void {
		try {
			me.server.emit("updateBallSpectator", room.getBall());
		} catch (e) {
			if (e === null) {
				me.stopStreaming(room.match.name);
				return;
			}
			throw e;
		}
	}

	private stopStreaming(room: string | number): void {
		let room_index: number;
		if (typeof room === "number") {
			room_index = room;
		} else {
			room_index = this.rooms.findIndex((obj) => {
				obj.name === room;
			});
		}
		if (room_index < 0) return;
		clearInterval(this.rooms[room_index].ping_id);
		this.rooms.splice(room_index, 1);
	}
}
