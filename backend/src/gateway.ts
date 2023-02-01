import { JwtGuard } from "src/auth/guards";
import { UseGuards, Logger } from "@nestjs/common";
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
	private readonly _logger: Logger;

	constructor() {
		this._server = new Server();
		this._logger = new Logger(Gateway.name);

		if (this._server) {
		}
	}

	public handleConnection(client: Socket): void {
		this._logger.log(`Client connected to gateway: ${client.id}`);
		Gateway._sockets.add(client);

		this._logger.verbose("Currently connected users to gateway:");
		for (const socket of Gateway._sockets) {
			this._logger.verbose(`\t${socket.id}`);
		}
	}

	public handleDisconnect(client: Socket): void {
		this._logger.log(`Client disconnected from gateway: ${client.id}`);
		Gateway._sockets.delete(client);

		this._logger.verbose("Currently connected users to gateway:");
		for (const socket of Gateway._sockets) {
			this._logger.verbose(`\t${socket.id}`);
		}
	}

	public broadcast_to_everyone(message: ChannelMessage): void {
		this._logger.verbose(`Broadcasting message "${message.content}" to everyone...`);
		for (const socket of Gateway._sockets) {
			this._logger.verbose(`Sending message to: ${socket.id}`);
			socket.emit("message", message);
		}
	}
}
