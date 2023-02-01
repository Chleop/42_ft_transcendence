import { Server, Socket } from "socket.io";
import { ChannelMessage } from "@prisma/client";
import {
	ConnectedSocket,
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
	WsResponse,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";

@WebSocketGateway({
	cors: {
		origin: ["http://localhost:3000"], // REMIND: is it really the expected value for `origin` property
	},
	namespace: "/chat",
	transports: ["polling", "websocket"],
})
export class ChatGateway {
	private _server: Server;
	private static _user_sockets: Map<string, Socket> = new Map<string, Socket>();
	private static _logger: Logger = new Logger(ChatGateway.name);

	constructor() {
		this._server = new Server();

		// REMIND: This is a workaround for the fact that the server is not used yet.
		this._server;
	}

	public broadcast_to_everyone(message: ChannelMessage): void {
		ChatGateway._logger.debug(`Broadcasting message to everyone...`);
		for (const pair of ChatGateway._user_sockets) {
			ChatGateway._logger.debug(`Sending message to user: ${pair[0]}...`);
			pair[1].emit("message", message);
		}
	}

	public handleConnection(client: Socket): void {
		console.log(`Client connected to gateway: ${client.data.user.name}`);
		ChatGateway._user_sockets.set(client.data.user.id, client);
	}

	public handleDisconnect(client: Socket): void {
		console.log(`Client disconnected from gateway: ${client.data.user.name}`);
		ChatGateway._user_sockets.delete(client.data.user.id);
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
