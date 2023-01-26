import { JwtGuard } from "src/auth/guards";
import { UseGuards } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChannelMessage } from "@prisma/client";

@UseGuards(JwtGuard)
@WebSocketGateway({
	cors: {
		origin: ["http://localhost:3000"],
	},
	namespace: "/gateway",
})
export class Gateway {
	@WebSocketServer()
	private _server: Server;
	private static _sockets: Set<Socket> = new Set<Socket>();

	constructor() {
		this._server = new Server();

		if (this._server) {
		}
	}

	public handleConnection(client: Socket): void {
		console.log(`Client connected to gateway: ${client.id}`);
		Gateway._sockets.add(client);

		console.log("Currently connected users to gateway:");
		for (const socket of Gateway._sockets) {
			console.log(`\t${socket.id}`);
		}
	}

	public handleDisconnect(client: Socket): void {
		console.log(`Client disconnected from gateway: ${client.id}`);
		Gateway._sockets.delete(client);

		console.log("Currently connected users to gateway:");
		for (const socket of Gateway._sockets) {
			console.log(`\t${socket.id}`);
		}
	}

	public broadcast_to_everyone(message: ChannelMessage): void {
		console.log("Broadcasting message to everyone...");
		for (const socket of Gateway._sockets) {
			console.log(`Sending message to: ${socket.id}...`);
			socket.emit("message", message);
		}
	}
}
