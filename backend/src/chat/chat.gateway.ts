import { t_user_id, t_user_status } from "src/chat/alias";
import { t_user_update_event } from "src/user/alias";
import { ChatService } from "src/chat/chat.service";
import { Logger } from "@nestjs/common";
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChannelMessage } from "@prisma/client";
import { IUserPrivate, IUserPublic } from "src/user/interface";
import { UserService } from "src/user/user.service";
import { IChannel } from "src/channel/interface";
import { ChannelService } from "src/channel/channel.service";
import { BadEvent } from "src/game/exceptions";

@WebSocketGateway({
	namespace: "chat",
	path: "/api/chat_socket/socket.io",
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
	@WebSocketServer()
	public readonly _server: Server;
	private readonly _channel_service: ChannelService;
	private readonly _chat_service: ChatService;
	private readonly _user_service: UserService;
	private readonly _logger: Logger;

	constructor(
		channel_service: ChannelService,
		chat_service: ChatService,
		user_service: UserService,
	) {
		this._server = new Server();
		this._channel_service = channel_service;
		this._chat_service = chat_service;
		this._user_service = user_service;
		this._logger = new Logger(ChatGateway.name);
	}

	public afterInit(): void {
		this._logger.log("Chat gateway initialized");
	}

	/**
	 * @brief	Broadcast a message to all users who are joined to a specific socket room.
	 *
	 * @param	message The message to broadcast.
	 */
	public broadcast_to_room(message: ChannelMessage): void {
		this._server.to(message.channelId).emit("channel_message", message);
	}

	public async broadcast_to_online_related_users(
		user_updated: t_user_update_event,
	): Promise<void> {
		try {
			if (user_updated.status !== undefined)
				this._chat_service.update_user(
					user_updated.id,
					user_updated.status,
					user_updated.spectating,
				);
			const users: t_user_id[] = await this._chat_service.get_online_related_users(
				user_updated.id,
			);
			for (const user_to_notify of users) {
				if (this._chat_service.is_user_in_map(user_to_notify.id)) {
					let data: IUserPrivate | IUserPublic;
					if (user_updated.id === user_to_notify.id) {
						data = await this._user_service.get_me(user_to_notify.id);
					} else {
						data = await this._user_service.get_one(user_updated.id);
					}
					this._server.to(user_to_notify.login).emit("user_updated", data);
				}
			}
		} catch (e) {
			throw new BadEvent("Broadcast error");
		}
	}

	public async broadcast_to_online_channel_members(channel_id: string): Promise<void> {
		// TODO: Add checks
		const users: t_user_id[] = await this._chat_service.get_online_users_in_channel(channel_id);
		const data: IChannel = await this._channel_service.get_one(users[0]?.id, channel_id);
		for (const user_to_notify of users) {
			if (this._chat_service.is_user_in_map(user_to_notify.id)) {
				this._server.to(user_to_notify.login).emit("channel_updated", data);
			}
		}
	}

	public forward_to_user_socket(event: string, user_id: string, data: any): void {
		const user: t_user_status | undefined = this._chat_service.get_user(user_id);

		if (user !== undefined) {
			this._server.to(user.login).emit(event, data);
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
	public async handleConnection(client: Socket): Promise<void> {
		this._logger.log(
			`Client ${client.id} (${client.data.user.login}) connected to chat gateway`,
		);
		this._chat_service.add_user(client);
		for (const channel of client.data.user.channels) {
			client.join(channel.id);
		}
		try {
			await this.broadcast_to_online_related_users({
				id: client.data.user.id,
			});
		} catch (e) {
			if (e instanceof BadEvent) {
				this.sendError(client, e.message);
				await this.handleDisconnect(client);
				client.disconnect();
			}
		}
	}

	/**
	 * @brief	Removing a client socket from the list of connected sockets.
	 *
	 * @param	client The socket that just disconnected.
	 */
	public async handleDisconnect(client: Socket): Promise<void> {
		this._chat_service.remove_user(client);

		try {
			await this.broadcast_to_online_related_users({
				id: client.data.user.id,
			});
		} catch (e) {
			if (!(e instanceof BadEvent)) throw e;
		}
		this._logger.log(
			`Client ${client.id} (${client.data.user.login}) disconnected from chat gateway`,
		);
	}

	/**
	 * @brief	Add a socket to a socket room,
	 * 			allowing to broadcast messages to a specific subset of users.
	 * 			It is assumed that the provided user id corresponds to a valid socket.
	 * 			(connected and not joined in the wanted room yet)
	 *
	 * @param	user_id The id of the user whose socket is to be joined in the room.
	 * @param	room_id The id of the room to join.
	 */
	public make_user_socket_join_room(user_id: string, room_id: string): void {
		const user: t_user_status | undefined = this._chat_service.get_user(user_id);

		if (user !== undefined) this._server.in(user.login).socketsJoin(room_id);
	}

	/**
	 * @brief	Remove a socket from a socket room,
	 * 			preventing to broadcast messages to a specific subset of users.
	 * 			It is assumed that the provided user id corresponds to a valid socket.
	 * 			(connected and joined in the wanted room)
	 * 			It is assumed that the provided room id correspond to a valid room.
	 *
	 * @param	user_id The id of the user whose socket is to be left from the room.
	 * @param	room_id The id of the room to leave.
	 */
	public make_user_socket_leave_room(user_id: string, room_id: string): void {
		const user: t_user_status | undefined = this._chat_service.get_user(user_id);

		if (user !== undefined) this._server.in(user.login).socketsLeave(room_id);
	}

	public sendError(client: Socket, error: string): void {
		client.emit("exception", error);
	}
}
