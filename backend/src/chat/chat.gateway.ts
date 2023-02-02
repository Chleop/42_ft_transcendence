import { Server, Socket } from "socket.io";
import { ChannelMessage } from "@prisma/client";
import { WebSocketGateway } from "@nestjs/websockets";
import { Logger } from "@nestjs/common";

@WebSocketGateway({
	cors: {
		// REMIND: is it really the expected value for `origin` property
		origin: ["http://localhost:3000"],
	},
	namespace: "/chat",
	transports: ["polling", "websocket"],
})
export class ChatGateway {
	private _server: Server;
	private static _client_sockets: Map<string, Socket> = new Map<string, Socket>();
	private static _logger: Logger = new Logger(ChatGateway.name);

	constructor() {
		this._server = new Server();

		// REMIND: This is a workaround for the fact that the server is not used yet.
		this._server;
	}

	/**
	 * @brief	Broadcast a message to all users connected through a socket.
	 *
	 * @param	message The message to broadcast.
	 */
	public broadcast_to_everyone(message: ChannelMessage): void {
		ChatGateway._logger.debug(`Broadcasting message to everyone...`);
		this._server.sockets.emit("message", message);
	}

	/**
	 * @brief	Broadcast a message to all users who are joined to a specific socket room.
	 *
	 * @param	message The message to broadcast.
	 */
	public broadcast_to_room(message: ChannelMessage): void {
		ChatGateway._logger.debug(`Broadcasting message to room: ${message.channelId}...`);
		for (const socket of ChatGateway._client_sockets.values()) {
            if (socket.rooms.has(message.channelId)) {
                ChatGateway._logger.debug(`Sending message to user: ${socket.data.user.name}`);
                socket.emit("message", message);
            }
        }
	}

	/**
	 * @brief	Accept a new connection and store the client socket,
	 * 			mapping it with its corresponding user id.
	 * 			Make the client socket join the socket rooms
	 * 			corresponding to the channels the user is currently joined in.
	 *
	 * @param	client The socket that just connected.
	 */
	public handleConnection(client: Socket): void {
		ChatGateway._logger.log(`Client connected to gateway: ${client.data.user.name}`);
		ChatGateway._client_sockets.set(client.data.user.id, client);
		for (const channel of client.data.user.channels) {
			client.join(channel.id);
		}
	}

	/**
	 * @brief	Removing a client socket from the list of connected sockets.
	 *
	 * @param	client The socket that just disconnected.
	 */
	public handleDisconnect(client: Socket): void {
		console.log(`Client disconnected from gateway: ${client.data.user.name}`);
		for (const room of client.rooms) {
			client.leave(room);
		}
		ChatGateway._client_sockets.delete(client.data.user.id);
	}

	/**
	 * @brief	Add a socket to a socket room,
	 * 			allowing to broadcast messages to a specific subset of users.
	 * 			It is assumed that the provided user id correspond to a valid socket.
	 * 			(connected and not joined in the wanted room yet)
	 *
	 * @param	user_id The id of the user whose socket is to be joined in the room.
	 * @param	room_id The id of the room to join.
	 */
	public make_user_socket_join_room(user_id: string, room_id: string): void {
		const socket: Socket = ChatGateway._client_sockets.get(user_id) as Socket;

		ChatGateway._logger.debug(`User ${user_id} is joining socket room: ${room_id}...`);
		socket.join(room_id);
	}

	/**
	 * @brief	Remove a socket from a socket room,
	 * 			preventing to broadcast messages to a specific subset of users.
	 * 			It is assumed that the provided user id correspond to a valid socket.
	 * 			(connected and joined in the wanted room)
	 * 			It is assumed that the provided room id correspond to a valid room.
	 *
	 * @param	user_id The id of the user whose socket is to be left from the room.
	 * @param	room_id The id of the room to leave.
	 */
	public make_user_socket_leave_room(user_id: string, room_id: string): void {
		const socket: Socket = ChatGateway._client_sockets.get(user_id) as Socket;

		ChatGateway._logger.debug(`User ${user_id} is leaving socket room: ${room_id}...`);
		socket.leave(room_id);
	}
}
