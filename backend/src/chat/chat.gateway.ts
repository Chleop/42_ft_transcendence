import { Server, Socket } from "socket.io";
import { ChannelMessage } from "@prisma/client";
import {
	ConnectedSocket,
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
	WsResponse,
} from "@nestjs/websockets";

@WebSocketGateway({
	cors: {
		origin: ["http://localhost:3000"], // REMIND: is it really the expected value for `origin` property
	},
	namespace: "/chat",
	transports: ["polling", "websocket"],
})
export class ChatGateway {
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
		for (const socket of ChatGateway._sockets) {
			console.log(`Sending message to: ${socket.id}...`);
			socket.emit("message", message);
		}
	}

	public handleConnection(client: Socket): void {
		console.log(`Client connected to gateway: ${client.data.user.name}`);
		ChatGateway._sockets.add(client);
	}

	public handleDisconnect(client: Socket): void {
		console.log(`Client disconnected from gateway: ${client.data.user.name}`);
		ChatGateway._sockets.delete(client);

		console.log("Currently connected users to gateway:");
		for (const socket of ChatGateway._sockets) {
			console.log(`\t${socket.id}`);
		}
	}

	@SubscribeMessage("event_test")
	public event_test(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: unknown,
	): WsResponse<unknown> {
		console.log(`Received data: ${data} from client: ${client.id}`);
		return {
			event: "event_test",
			data,
		};
	}
}
