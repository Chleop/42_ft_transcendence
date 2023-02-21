import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { PrismaService } from "src/prisma/prisma.service";
import { e_user_status } from "src/user/enum";
import { t_user_id, t_user_status } from "src/chat/alias";

@Injectable()
export class ChatService {
	private static _user_map: Map<string, t_user_status> = new Map<string, t_user_status>();
	private readonly _prisma_service: PrismaService;

	constructor(prisma_service: PrismaService) {
		this._prisma_service = prisma_service;
	}

	// add user to map
	public add_user(socket: Socket): void {
		const user: t_user_status | undefined = ChatService._user_map.get(socket.data.user.id);
		if (user !== undefined) {
			socket.join(user.login);
			user.nb_socket_in_room++;
		} else {
			ChatService._user_map.set(socket.data.user.id, {
				nb_socket_in_room: 1,
				login: socket.data.user.login,
				status: e_user_status.ONLINE,
				spectated_user: undefined,
			});
			socket.join(socket.data.user.login);
		}
	}

	// remove user from map
	public remove_user(socket: Socket): void {
		const user: t_user_status | undefined = ChatService._user_map.get(socket.data.user.id);
		if (user !== undefined) {
			socket.leave(socket.data.user.login);
			user.nb_socket_in_room--;
			if (user.nb_socket_in_room === 0) ChatService._user_map.delete(socket.data.user.id);
		}
	}

	// get user from map
	public get_user(id: string): t_user_status | undefined {
		return ChatService._user_map.get(id);
	}

	// check if user is in map
	public is_user_in_map(id: string): boolean {
		return ChatService._user_map.has(id);
	}

	// update user
	public update_user(id: string, status: e_user_status, spectated_user?: string): void {
		const user: t_user_status | undefined = ChatService._user_map.get(id);

		if (user) {
			user.status = status;
			if (spectated_user !== undefined) user.spectated_user = spectated_user;
		}
	}

	// get all users are related to a user and connected
	public async get_online_related_users(id: string): Promise<t_user_id[]> {
		const users: t_user_id[] = await this._prisma_service.user.findMany({
			select: {
				id: true,
				login: true,
			},
			where: {
				OR: [
					{
						friends: {
							some: {
								id,
							},
						},
					},
					{
						channels: {
							some: {
								members: {
									some: {
										id,
									},
								},
							},
						},
					},
					{
						directMessagesSent: {
							some: {
								receiverId: id,
							},
						},
					},
					{
						directMessagesReceived: {
							some: {
								senderId: id,
							},
						},
					},
					{
						gamesPlayed: {
							some: {
								players: {
									some: {
										id,
									},
								},
							},
						},
					},
				],
			},
		});

		return users.filter((user: t_user_id) => {
			return ChatService._user_map.has(user.id);
		});
	}

	// get all users that are in a channel and connected
	public async get_online_users_in_channel(channel_id: string): Promise<t_user_id[]> {
		const users: t_user_id[] = (await this._prisma_service.channel.findUnique({
			select: {
				members: {
					select: {
						id: true,
						login: true,
					},
				},
			},
			where: {
				id: channel_id,
			},
		}))!.members;

		return users.filter((user: t_user_id) => {
			return ChatService._user_map.has(user.id);
		});
	}
}
