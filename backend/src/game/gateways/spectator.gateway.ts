import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameService } from "../game.service";
import { GameRoom } from "../room";
import * as Constants from "../constants/constants";

type ActiveRoom = {
	name: string;
	ping_id: NodeJS.Timer;
};

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
	private rooms: ActiveRoom[];

	constructor(game_service: GameService) {
		this.server = new Server();
		this.game_service = game_service;
	}

	public handleConnection(client: Socket): void {
		// Find game to spectate: Cookie? Header?

		const room: GameRoom | null = this.game_service.findUserGame(client);
		/*
		if game found :
		add to room spec
		else
		disconenct
		*/
		if (room === null) {
			client.disconnect(true);
		} else {
			client.join(room.match.name);
			// room.addSpectator(client);
			this.startSpectating(room);
		}
		// this.game_service.display();
	}

	public handleDisconnect(client: Socket): void {
		// if room exists with name
		// remove room and timer
		client;
	}

	private startSpectating(room: GameRoom): void {
		const spectated_room: ActiveRoom | undefined = this.rooms.find((obj) => {
			return obj.name === room.match.name;
		});
		if (spectated_room === undefined) {
			const new_room: ActiveRoom = {
				name: room.match.name,
				ping_id: setInterval(this.updateGame, Constants.ping),
			};
			this.rooms.push(new_room);
			// setInterval for the room
			// push to room
		}
	}

	private updateGame(room: GameRoom): void {
		this.server.emit("updateBallSpectator", room.getBall());
	}
}
