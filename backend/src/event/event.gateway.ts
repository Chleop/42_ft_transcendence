import { Server, Socket } from "socket.io";
import { ChannelMessage, StateType } from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WsResponse } from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@WebSocketGateway({
	cors: {
		origin: ["http://localhost:3000"], // REMIND: is it really the expected value for `origin` property
	},
	namespace: "/event",
	transports: ["polling", "websocket"]
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
		if (client.handshake.auth.access_token) {
			const config: ConfigService = new ConfigService();
			const secret: string | undefined = config.get<string>("JWT_SECRET");

			if (!secret) {
				throw new InternalServerErrorException("JWT_SECRET is not defined in the environment.");
			}

			try {
				const jwt_service: JwtService = new JwtService();
				const decoded: {
					sub: string
				} = jwt_service.verify(client.handshake.auth.access_token, {
					secret
				});

				console.log(`Decoded access_token: ${decoded?.sub}`);
				new PrismaService().user.findUnique({
					select: {
						name: true,
					},
					where: {
						idAndState: {
							id: decoded.sub,
							state: StateType.ACTIVE
						},
					},
				}).then((user) => {
					if (user) {
						console.log(`User ${user.name} is connected to the gateway.`);
					} else {
						console.log(`Provided access token is invalid.`);
						client.disconnect();
					}
				});

			} catch (error) {
				console.log("An error occurred while decoding the access_token:");
				console.log(error);
				throw new InternalServerErrorException();
				
			}

		}
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

	@SubscribeMessage("event_test")
	public event_test(@ConnectedSocket() client: Socket, @MessageBody() data: unknown): WsResponse<unknown> {
		console.log(`Received data: ${data} from client: ${client.id}`);
		return {
			event: "event_test",
			data,
		};
	}
}
