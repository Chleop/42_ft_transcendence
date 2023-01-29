// import { JwtGuard } from "src/auth/guards";
// import { UseGuards } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { ChannelMessage } from "@prisma/client";
import { SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";

// @UseGuards(JwtGuard)
@WebSocketGateway({
	cors: {
		origin: ["http://localhost:3000"],
	},
	namespace: "/event",
})
export class EventGateway {
	private _server: Server;
	private static _sockets: Set<Socket> = new Set<Socket>();

	constructor() {
		this._server = new Server();

		// REMIND: This is a workaround for the fact that the server is not used yet.
		if (this._server) {
		}
	}

	public broadcast_to_everyone(message: ChannelMessage): void {
		console.log("Broadcasting message to everyone...");
		for (const socket of EventGateway._sockets) {
			console.log(`Sending message to: ${socket.id}...`);
			socket.emit("message", message);
		}
	}

	public handleConnection(client: Socket): void {
		console.log(`Client connected to gateway: ${client.id}`);
		EventGateway._sockets.add(client);

		console.log("Currently connected users to gateway:");
		for (const socket of EventGateway._sockets) {
			console.log(`\t${socket.id}`);
		}
	}

	public handleDisconnect(client: Socket): void {
		console.log(`Client disconnected from gateway: ${client.id}`);
		EventGateway._sockets.delete(client);

		console.log("Currently connected users to gateway:");
		for (const socket of EventGateway._sockets) {
			console.log(`\t${socket.id}`);
		}
	}

	@SubscribeMessage("my_name_is")
	public my_name_is(client: Socket, id: string): void {
		console.log(`Client ${client.id} is ${id}`);
	}
}
