import {
	t_channels_fields,
	t_games_played_fields,
	t_get_me_fields,
	t_get_me_fields_tmp,
	t_get_one_fields,
	t_get_one_fields_tmp,
	t_receiving_user_fields,
	t_sending_user_fields,
} from "src/user/alias";
// import { t_user_id } from "src/chat/alias";
import {
	UnknownError,
	UserAlreadyBlockedError,
	UserBlockedError,
	UserFieldUnaivalableError,
	UserMessageNotFoundError,
	UserNotBlockedError,
	UserNotFoundError,
	UserNotFriendError,
	UserNotLinkedError,
	UserSelfBlockError,
	UserSelfMessageError,
	UserSelfUnblockError,
	UserSelfUnfriendError,
} from "src/user/error";
import { ChannelService } from "src/channel/channel.service";
import { PrismaService } from "src/prisma/prisma.service";
import { Injectable, Logger, StreamableFile } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { DirectMessage, StateType } from "@prisma/client";
import { createReadStream, createWriteStream } from "fs";
import { join } from "path";
import { t_user_status, t_user_update_event } from "./alias/user_update_event.alias";

@Injectable()
export class UserService {
	// REMIND: would it be better to make these properties static ?
	// REMIND: check if passing `_channel` in readonly keep it working well
	private _channel: ChannelService;
	// REMIND: check if passing `_prisma` in readonly keep it working well
	private _prisma: PrismaService;
	private readonly _logger: Logger;

	constructor(channel_service: ChannelService, prisma_service: PrismaService) {
		this._channel = channel_service;
		this._prisma = prisma_service;
		this._logger = new Logger(UserService.name);
	}

	/**
	 * @brief	Check whether two users are linked through :
	 * 			- a common channel
	 * 			- a direct message sent by one to the other
	 * 			- a friendship
	 * 			- a game played together
	 *
	 * @param	user0_id The id of the first user.
	 * @param	user1_id The id of the second user.
	 * @param	user0 The first user.
	 * @param	user1 The second user.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 *
	 * @return	True if the two users are linked, false otherwise.
	 */
	private async _are_linked(
		user0_id: string,
		user1_id: string,
		user0?: {
			channels: {
				members: {
					id: string;
				}[];
			}[];
			directMessagesReceived: {
				sender: {
					id: string;
				};
			}[];
			directMessagesSent: {
				receiver: {
					id: string;
				};
			}[];
			friends: {
				id: string;
			}[];
			gamesPlayed: {
				players: {
					id: string;
				}[];
			}[];
		} | null,
	): Promise<boolean> {
		if (!user0) {
			user0 = await this._prisma.user.findUnique({
				select: {
					channels: {
						select: {
							members: {
								select: {
									id: true,
								},
							},
						},
					},
					directMessagesReceived: {
						select: {
							sender: {
								select: {
									id: true,
								},
							},
						},
					},
					directMessagesSent: {
						select: {
							receiver: {
								select: {
									id: true,
								},
							},
						},
					},
					friends: {
						select: {
							id: true,
						},
					},
					gamesPlayed: {
						select: {
							players: {
								select: {
									id: true,
								},
							},
						},
					},
				},
				where: {
					idAndState: {
						id: user0_id,
						state: StateType.ACTIVE,
					},
				},
			});

			if (!user0) {
				throw new UserNotFoundError(user0_id);
			}
		}

		return (
			user0.channels.some((channel): boolean =>
				channel.members.some((member): boolean => member.id === user1_id),
			) ||
			user0.directMessagesReceived.some(
				(direct_message): boolean => direct_message.sender.id === user1_id,
			) ||
			user0.directMessagesSent.some(
				(direct_message): boolean => direct_message.receiver.id === user1_id,
			) ||
			user0.friends.some((friend): boolean => friend.id === user1_id) ||
			user0.gamesPlayed.some((game_played): boolean =>
				game_played.players.some((player): boolean => player.id === user1_id),
			)
		);
	}

	/**
	 * @brief	Get direct messages between two users,
	 * 			which have been sent after a specific one from the database.
	 *
	 * @param	user0_id The id of the first user concerned by the wanted direct messages.
	 * @param	user1_id The id of the second user concerned by the wanted direct messages.
	 * @param	message_id The id of the message to get the messages after.
	 * @param	limit The maximum number of messages to get.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserMessageNotFoundError
	 *
	 * @return	A promise containing the wanted messages.
	 */
	private async _get_ones_messages_after_a_specific_message(
		user0_id: string,
		user1_id: string,
		message_id: string,
		limit: number,
	): Promise<DirectMessage[]> {
		//#region
		type t_fields = {
			//#region
			dateTime: Date;
			receiverId: string;
			senderId: string;
		};
		//#endregion

		const message: t_fields | null = await this._prisma.directMessage.findUnique({
			//#region
			select: {
				dateTime: true,
				receiverId: true,
				senderId: true,
			},
			where: {
				id: message_id,
			},
		});
		//#endregion

		if (
			!message ||
			(message.receiverId !== user0_id && message.senderId !== user0_id) ||
			(message.receiverId !== user1_id && message.senderId !== user1_id)
		) {
			throw new UserMessageNotFoundError(message_id);
		}

		const messages: DirectMessage[] = await this._prisma.directMessage.findMany({
			//#region
			where: {
				AND: [
					{
						OR: [
							{
								receiverId: user0_id,
								senderId: user1_id,
							},
							{
								receiverId: user1_id,
								senderId: user0_id,
							},
						],
					},
					{
						dateTime: {
							gt: message.dateTime,
						},
					},
				],
			},
			orderBy: {
				dateTime: "asc",
			},
			take: limit,
		});
		//#endregion

		return messages;
	}
	//#endregion

	/**
	 * @brief	Get direct messages between two users,
	 * 			which have been sent before a specific one from the database.
	 *
	 * @param	user0_id The id of the first user concerned by the wanted direct messages.
	 * @param	user1_id The id of the second user concerned by the wanted direct messages.
	 * @param	message_id The id of the message to get the messages before.
	 * @param	limit The maximum number of messages to get.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserMessageNotFoundError
	 *
	 * @return	A promise containing the wanted messages.
	 */
	private async _get_ones_messages_before_a_specific_message(
		user0_id: string,
		user1_id: string,
		message_id: string,
		limit: number,
	): Promise<DirectMessage[]> {
		//#region
		type t_fields = {
			//#region
			dateTime: Date;
			receiverId: string;
			senderId: string;
		};
		//#endregion

		const message: t_fields | null = await this._prisma.directMessage.findUnique({
			//#region
			select: {
				dateTime: true,
				receiverId: true,
				senderId: true,
			},
			where: {
				id: message_id,
			},
		});
		//#endregion

		if (
			!message ||
			(message.receiverId !== user0_id && message.senderId !== user0_id) ||
			(message.receiverId !== user1_id && message.senderId !== user1_id)
		) {
			throw new UserMessageNotFoundError(message_id);
		}

		const messages: DirectMessage[] = await this._prisma.directMessage.findMany({
			//#region
			where: {
				AND: [
					{
						OR: [
							{
								receiverId: user0_id,
								senderId: user1_id,
							},
							{
								receiverId: user1_id,
								senderId: user0_id,
							},
						],
					},
					{
						dateTime: {
							lt: message.dateTime,
						},
					},
				],
			},
			orderBy: {
				dateTime: "desc",
			},
			take: limit,
		});
		//#endregion

		// Get the most ancient messages first
		messages.reverse();
		return messages;
	}
	//#endregion

	/**
	 * @brief	Get the most recent direct messages between two users.
	 *
	 * @param	user0_id The id of the first user concerned by the wanted direct messages.
	 * @param	user1_id The id of the second user concerned by the wanted direct messages.
	 * @param	limit The maximum number of messages to get.
	 *
	 * @return	A promise containing the wanted messages.
	 */
	private async _get_ones_most_recent_messages(
		user0_id: string,
		user1_id: string,
		limit: number,
	): Promise<DirectMessage[]> {
		//#region
		const messages: DirectMessage[] = await this._prisma.directMessage.findMany({
			//#region
			where: {
				OR: [
					{
						receiverId: user0_id,
						senderId: user1_id,
					},
					{
						receiverId: user1_id,
						senderId: user0_id,
					},
				],
			},
			orderBy: {
				dateTime: "desc",
			},
			take: limit,
		});
		//#endregion

		// Get the most ancient messages first
		messages.reverse();
		return messages;
	}
	//#endregion

	/**
	 * @brief	Make a user block an other user, preventing the blocking user of :
	 * 			- being challenged by the blocked user
	 * 			- being invited to a channel by the blocked user
	 * 			- seeing the blocked user's messages
	 * 			It is assumed that the provided blocking user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	blocking_user_id The id of the user blocking the other user.
	 * @param	blocked_user_id The id of the user being blocked.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- UserSelfBlockError
	 * 			- UserAlreadyBlockedError
	 *
	 * @return	An empty promise.
	 */
	public async block_one(blocking_user_id: string, blocked_user_id: string): Promise<void> {
		type t_blocking_user_fields = {
			blocked: {
				id: string;
			}[];
			friends: {
				id: string;
			}[];
			pendingFriendRequests: {
				id: string;
			}[];
		};
		type t_blocked_user_fields = {
			id: string;
			pendingFriendRequests: {
				id: string;
			}[];
		};

		const blocking_user: t_blocking_user_fields = (await this._prisma.user.findUnique({
			select: {
				blocked: {
					select: {
						id: true,
					},
				},
				friends: {
					select: {
						id: true,
					},
				},
				pendingFriendRequests: {
					select: {
						id: true,
					},
				},
			},
			where: {
				idAndState: {
					id: blocking_user_id,
					state: StateType.ACTIVE,
				},
			},
		})) as t_blocking_user_fields;

		const blocked_user: t_blocked_user_fields | null = await this._prisma.user.findUnique({
			select: {
				id: true,
				pendingFriendRequests: {
					select: {
						id: true,
					},
				},
			},
			where: {
				idAndState: {
					id: blocked_user_id,
					state: StateType.ACTIVE,
				},
			},
		});

		if (!blocked_user) {
			throw new UserNotFoundError();
		}

		if (blocked_user_id === blocking_user_id) {
			throw new UserSelfBlockError();
		}

		for (const blocked_user of blocking_user.blocked) {
			if (blocked_user.id === blocked_user_id) {
				throw new UserAlreadyBlockedError();
			}
		}

		if (blocking_user.friends.some((friend) => friend.id === blocked_user_id)) {
			await this.unfriend_two(blocking_user_id, blocked_user_id, blocking_user, blocked_user);
		}

		if (
			blocking_user.pendingFriendRequests.some(
				(friend_request) => friend_request.id === blocked_user_id,
			)
		) {
			await this._prisma.user.update({
				data: {
					pendingFriendRequests: {
						disconnect: {
							id: blocked_user_id,
						},
					},
				},
				where: {
					idAndState: {
						id: blocking_user_id,
						state: StateType.ACTIVE,
					},
				},
			});
		}
		if (
			blocked_user.pendingFriendRequests.some(
				(friend_request) => friend_request.id === blocking_user_id,
			)
		) {
			await this._prisma.user.update({
				data: {
					pendingFriendRequests: {
						disconnect: {
							id: blocking_user_id,
						},
					},
				},
				where: {
					idAndState: {
						id: blocked_user_id,
						state: StateType.ACTIVE,
					},
				},
			});
		}

		await this._prisma.user.update({
			data: {
				blocked: {
					connect: {
						id: blocked_user_id,
					},
				},
			},
			where: {
				idAndState: {
					id: blocking_user_id,
					state: StateType.ACTIVE,
				},
			},
		});
		this._logger.log(`User ${blocking_user_id} blocked user ${blocked_user_id}`);
	}

	/**
	 * @brief	Create a new user in the database.
	 *
	 * @param	login The login of the user to create.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserRelationNotFoundError
	 * 			- UserFieldUnaivalableError
	 * 			- UnknownError
	 *
	 * @return	A promise containing the id of the created user.
	 */
	public async create_one(login: string): Promise<string> {
		let user_id: string;

		try {
			let name: string = login;
			let suffix: number = 0;
			while (
				await this._prisma.user.count({
					where: {
						name: name,
					},
				})
			) {
				name = `${login}#${suffix++}`;
			}

			user_id = (
				await this._prisma.user.create({
					data: {
						login: login,
						name: name,
						skin: {
							connect: {
								id: "default",
							},
						},
					},
				})
			).id;
			this._logger.log(`User ${user_id} created`);
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2002":
						throw new UserFieldUnaivalableError();
				}
				this._logger.error(`PrismaClientKnownRequestError code was ${error.code}`);
			}
			throw new UnknownError();
		}

		return user_id;
	}

	/**
	 * @brief	Change the account state of a user to DISABLED, before trully deleting them
	 * 			from the database a certain time later.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	id The id of the user to delete.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UnknownError
	 *
	 * @return	An empty promise.
	 */
	// REMIND: rename into disable_me (?)
	// TODO: remove the UnknownError from potential errors
	public async disable_one(id: string): Promise<void> {
		type t_fields = {
			id: string;
			owner: {
				id: string;
			} | null;
			members: {
				id: string;
			}[];
			operators: {
				id: string;
			}[];
		};

		try {
			const channels: t_fields[] = await this._prisma.channel.findMany({
				select: {
					id: true,
					owner: {
						select: {
							id: true,
						},
					},
					members: {
						select: {
							id: true,
						},
					},
					operators: {
						select: {
							id: true,
						},
					},
				},
				where: {
					ownerId: id,
				},
			});

			for (const channel of channels) {
				await this._channel.leave_one(channel.id, id, channel);
			}

			await this._prisma.user.update({
				where: {
					idAndState: {
						id: id,
						state: StateType.ACTIVE,
					},
				},
				data: {
					state: StateType.DISABLED,
				},
			});
			this._logger.log(`User ${id} disabled`);
		} catch (error) {
			this._logger.error(`Error while disabling user ${id}`);
			if (error instanceof PrismaClientKnownRequestError) {
				this._logger.error(`PrismaClientKnownRequestError code was ${error.code}`);
			}

			throw new UnknownError();
		}
	}

	/**
	 * @brief	Get a user from the database.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	id The id of the user to get.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 *
	 * @return	A promise containing the wanted user.
	 */
	// TODO: remove the UserNotFoundError from potential errors
	public async get_me(id: string): Promise<t_get_me_fields> {
		const user_tmp: t_get_me_fields_tmp | null = await this._prisma.user.findUnique({
			select: {
				id: true,
				login: true,
				name: true,
				email: true,
				skinId: true,
				elo: true,
				twoFactAuth: true,
				channels: {
					select: {
						id: true,
						name: true,
						chanType: true,
					},
				},
				channelsOwned: {
					select: {
						id: true,
					},
				},
				gamesPlayed: {
					select: {
						id: true,
						players: {
							select: {
								id: true,
							},
						},
						scores: true,
						dateTime: true,
						winnerId: true,
					},
				},
				friends: {
					select: {
						id: true,
					},
				},
				pendingFriendRequests: {
					select: {
						id: true,
					},
				},
				blocked: {
					select: {
						id: true,
					},
				},
			},
			where: {
				idAndState: {
					id: id,
					state: StateType.ACTIVE,
				},
			},
		});

		if (!user_tmp) {
			throw new UserNotFoundError(id);
		}

		const user: t_get_me_fields = {
			id: user_tmp.id,
			login: user_tmp.login,
			name: user_tmp.name,
			status: t_user_status.OFFLINE, // TODO this._gateway.get_user_status(user_tmp.id),
			email: user_tmp.email,
			skin_id: user_tmp.skinId,
			elo: user_tmp.elo,
			two_fact_auth: user_tmp.twoFactAuth,
			channels: user_tmp.channels.map((channel): t_channels_fields => {
				return {
					id: channel.id,
					name: channel.name,
					type: channel.chanType,
				};
			}),
			channels_owned_ids: user_tmp.channelsOwned.map((channel): string => {
				return channel.id;
			}),
			games_played: user_tmp.gamesPlayed.map((game): t_games_played_fields => {
				return {
					id: game.id,
					players_ids: game.players.map((player): string => {
						return player.id;
					}) as [string, string],
					scores: game.scores as [number, number],
					date_time: game.dateTime,
					winner_id: game.winnerId,
				};
			}),
			friends_ids: user_tmp.friends.map((friend): string => {
				return friend.id;
			}),
			pending_friends_ids: user_tmp.pendingFriendRequests.map((pending_friend): string => {
				return pending_friend.id;
			}),
			blocked_ids: user_tmp.blocked.map((blocked): string => {
				return blocked.id;
			}),
		};

		this._logger.verbose(`User ${id} was successfully retrieved from the database.`);
		return user;
	}

	/**
	 * @brief	Get a user from the database.
	 * 			Requested user must be active,
	 * 			and either have at least 1 link with the requesting user, or be the requesting user.
	 * 			It is assumed that the provided requesting user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	requesting_user_id The id of the user requesting the user.
	 * @param	requested_user_id The id of the user to get.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- UserNotLinkedError
	 *
	 * @return	A promise containing the wanted user.
	 */
	public async get_one(
		requesting_user_id: string,
		requested_user_id: string,
	): Promise<t_get_one_fields> {
		type t_requesting_user_fields = {
			channels: {
				members: {
					id: string;
				}[];
			}[];
			directMessagesReceived: {
				sender: {
					id: string;
				};
			}[];
			directMessagesSent: {
				receiver: {
					id: string;
				};
			}[];
			friends: {
				id: string;
			}[];
			gamesPlayed: {
				players: {
					id: string;
				}[];
			}[];
		};

		const requesting_user: t_requesting_user_fields = (await this._prisma.user.findUnique({
			select: {
				channels: {
					select: {
						members: {
							select: {
								id: true,
							},
						},
					},
				},
				directMessagesReceived: {
					select: {
						sender: {
							select: {
								id: true,
							},
						},
					},
				},
				directMessagesSent: {
					select: {
						receiver: {
							select: {
								id: true,
							},
						},
					},
				},
				friends: {
					select: {
						id: true,
					},
				},
				gamesPlayed: {
					select: {
						players: {
							select: {
								id: true,
							},
						},
					},
				},
			},
			where: {
				idAndState: {
					id: requesting_user_id,
					state: StateType.ACTIVE,
				},
			},
		})) as t_requesting_user_fields;

		const requested_user_tmp: t_get_one_fields_tmp | null = await this._prisma.user.findUnique({
			select: {
				id: true,
				login: true,
				name: true,
				skinId: true,
				elo: true,
				channels: {
					select: {
						id: true,
						name: true,
						chanType: true,
					},
				},
				gamesPlayed: {
					select: {
						id: true,
					},
				},
				gamesWon: {
					select: {
						id: true,
					},
				},
			},
			where: {
				idAndState: {
					id: requested_user_id,
					state: StateType.ACTIVE,
				},
			},
		});

		if (!requested_user_tmp) {
			throw new UserNotFoundError(requested_user_id);
		}

		const requested_user: t_get_one_fields = {
			id: requested_user_tmp.id,
			login: requested_user_tmp.login,
			name: requested_user_tmp.name,
			status: t_user_status.OFFLINE, //TODO this._gateway.get_user_status(requested_user_tmp.id),
			skin_id: requested_user_tmp.skinId,
			elo: requested_user_tmp.elo,
			channels: requested_user_tmp.channels.map((channel): t_channels_fields => {
				return {
					id: channel.id,
					name: channel.name,
					type: channel.chanType,
				};
			}),
			games_played: requested_user_tmp.gamesPlayed.length,
			games_won: requested_user_tmp.gamesWon.length,
		};

		if (
			requesting_user_id !== requested_user_id &&
			!(await this._are_linked(requesting_user_id, requested_user_id, requesting_user))
		) {
			throw new UserNotLinkedError(`${requesting_user_id} - ${requested_user_id}`);
		}

		this._logger.verbose(
			`User ${requested_user_id} was successfully retrieved from the database.`,
		);
		return requested_user;
	}

	/**
	 * @brief	Get a user's avatar from the database.
	 * 			Requested user must be active,
	 * 			and either have at least 1 link with the requesting user, or be the requesting user.
	 * 			It is assumed that the provided requesting user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	requesting_user_id The id of the user requesting the user's avatar.
	 * @param	requested_user_id The id of the user to get the avatar from.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- UserNotLinkedError
	 *
	 * @return	A promise containing the wanted avatar.
	 */
	public async get_ones_avatar(
		requesting_user_id: string,
		requested_user_id: string,
	): Promise<StreamableFile> {
		type t_requesting_user_fields = {
			channels: {
				members: {
					id: string;
				}[];
			}[];
			directMessagesReceived: {
				sender: {
					id: string;
				};
			}[];
			directMessagesSent: {
				receiver: {
					id: string;
				};
			}[];
			friends: {
				id: string;
			}[];
			gamesPlayed: {
				players: {
					id: string;
				}[];
			}[];
		};
		type t_requested_user_fields = {
			avatar: string;
			channels: {
				id: string;
			}[];
		};

		const requesting_user: t_requesting_user_fields = (await this._prisma.user.findUnique({
			select: {
				channels: {
					select: {
						members: {
							select: {
								id: true,
							},
						},
					},
				},
				directMessagesReceived: {
					select: {
						sender: {
							select: {
								id: true,
							},
						},
					},
				},
				directMessagesSent: {
					select: {
						receiver: {
							select: {
								id: true,
							},
						},
					},
				},
				friends: {
					select: {
						id: true,
					},
				},
				gamesPlayed: {
					select: {
						players: {
							select: {
								id: true,
							},
						},
					},
				},
			},
			where: {
				idAndState: {
					id: requesting_user_id,
					state: StateType.ACTIVE,
				},
			},
		})) as t_requesting_user_fields;

		const requested_user: t_requested_user_fields | null = await this._prisma.user.findUnique({
			select: {
				avatar: true,
				channels: {
					select: {
						id: true,
					},
				},
			},
			where: {
				idAndState: {
					id: requested_user_id,
					state: StateType.ACTIVE,
				},
			},
		});

		if (!requested_user) {
			throw new UserNotFoundError(requested_user_id);
		}

		if (
			requesting_user_id !== requested_user_id &&
			!(await this._are_linked(requesting_user_id, requested_user_id, requesting_user))
		) {
			throw new UserNotLinkedError(`${requesting_user_id} - ${requested_user_id}`);
		}

		return new StreamableFile(createReadStream(join(process.cwd(), requested_user.avatar)));
	}

	/**
	 * @brief	Get a user's background skin from the database.
	 * 			Requested user must be active.
	 *
	 * @param	requested_user_id The id of the user to get the skin from.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 *
	 * @return	A promise containing the wanted background skin.
	 */
	public async get_ones_background(requested_user_id: string): Promise<StreamableFile> {
		type t_requested_user_fields = {
			skin: {
				background: string;
			};
		};
		const requested_user: t_requested_user_fields | null = await this._prisma.user.findUnique({
			select: {
				skin: {
					select: {
						background: true,
					},
				},
			},
			where: {
				idAndState: {
					id: requested_user_id,
					state: StateType.ACTIVE,
				},
			},
		});
		if (!requested_user) throw new UserNotFoundError(requested_user_id);
		return new StreamableFile(
			createReadStream(join(process.cwd(), requested_user.skin.background)),
		);
	}

	/**
	 * @brief	Get a user's ball skin from the database.
	 * 			Requested user must be active.
	 *
	 * @param	requested_user_id The id of the user to get the skin from.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 *
	 * @return	A promise containing the wanted ball skin.
	 */
	public async get_ones_ball(requested_user_id: string): Promise<StreamableFile> {
		type t_requested_user_fields = {
			skin: {
				ball: string;
			};
		};
		const requested_user: t_requested_user_fields | null = await this._prisma.user.findUnique({
			select: {
				skin: {
					select: {
						ball: true,
					},
				},
			},
			where: {
				idAndState: {
					id: requested_user_id,
					state: StateType.ACTIVE,
				},
			},
		});
		if (!requested_user) throw new UserNotFoundError(requested_user_id);
		return new StreamableFile(createReadStream(join(process.cwd(), requested_user.skin.ball)));
	}

	/**
	 * @brief	Get direct messages between two users from the database.
	 * 			It is assumed that the provided user0 id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	user0_id The id of the user who is getting the messages.
	 * @param	user1_id The id of the user with whom the messages are exchanged.
	 * @param	limit The maximum number of messages to get.
	 * @param	before The id of the message to get the messages before.
	 * @param	after The id of the message to get the messages after.
	 *
	 * @error	The following errors may be thrown :
	 *			- UserSelfMessageError
	 * 			- UserNotFoundError
	 * 			- UserMessageNotFoundError
	 *
	 * @return	A promise containing the wanted messages.
	 */
	public async get_ones_messages(
		user0_id: string,
		user1_id: string,
		limit: number,
		before?: string,
		after?: string,
	): Promise<DirectMessage[]> {
		//#region
		if (user0_id === user1_id) {
			throw new UserSelfMessageError();
		}

		if (
			!(await this._prisma.user.findUnique({
				//#region
				where: {
					id: user1_id,
				},
			}))
			//#endregion
		) {
			throw new UserNotFoundError(user1_id);
		}

		if (before) {
			return await this._get_ones_messages_before_a_specific_message(
				user0_id,
				user1_id,
				before,
				limit,
			);
		} else if (after) {
			return await this._get_ones_messages_after_a_specific_message(
				user0_id,
				user1_id,
				after,
				limit,
			);
		} else {
			return await this._get_ones_most_recent_messages(user0_id, user1_id, limit);
		}
	}
	//#endregion

	/**
	 * @brief	Get a user's paddle skin from the database.
	 * 			Requested user must be active.
	 *
	 * @param	requested_user_id The id of the user to get the skin from.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 *
	 * @return	A promise containing the wanted paddle skin.
	 */
	public async get_ones_paddle(requested_user_id: string): Promise<StreamableFile> {
		type t_requested_user_fields = {
			skin: {
				paddle: string;
			};
		};
		const requested_user: t_requested_user_fields | null = await this._prisma.user.findUnique({
			select: {
				skin: {
					select: {
						paddle: true,
					},
				},
			},
			where: {
				idAndState: {
					id: requested_user_id,
					state: StateType.ACTIVE,
				},
			},
		});
		if (!requested_user) throw new UserNotFoundError(requested_user_id);
		return new StreamableFile(
			createReadStream(join(process.cwd(), requested_user.skin.paddle)),
		);
	}

	/**
	 * @brief	Make a user send a direct message to another user.
	 * 			Receiving user must be active, not be the same as the sending user,
	 * 			and have at least 1 link with the sending user.
	 * 			Sending user must not have blocked the receiving user.
	 * 			If the sending user has been blocked by the receiving user,
	 * 			the message will be stored in the database,
	 * 			but it will not be forwarded to the receiving user.
	 * 			It is assumed that the provided sending user id is valid.
	 * 			(user exists and is not DISABLED)
	 *
	 * @param	sending_user_id The id of the user sending the message.
	 * @param	receiving_user_id The id of the user receiving the message.
	 * @param	content The content of the message.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- UserSelfMessageError
	 * 			- UserNotLinkedError
	 * 			- UserBlockedError
	 */
	public async send_message_to_one(
		sending_user_id: string,
		receiving_user_id: string,
		content: string,
	): Promise<{
		sender: t_sending_user_fields;
		receiver: t_receiving_user_fields;
		message: DirectMessage;
	}> {
		const sending_user: t_sending_user_fields = (await this._prisma.user.findUnique({
			select: {
				blocked: {
					select: {
						id: true,
					},
				},
				channels: {
					select: {
						members: {
							select: {
								id: true,
							},
						},
					},
				},
				directMessagesReceived: {
					select: {
						sender: {
							select: {
								id: true,
							},
						},
					},
				},
				directMessagesSent: {
					select: {
						receiver: {
							select: {
								id: true,
							},
						},
					},
				},
				friends: {
					select: {
						id: true,
					},
				},
				gamesPlayed: {
					select: {
						players: {
							select: {
								id: true,
							},
						},
					},
				},
			},
			where: {
				idAndState: {
					id: sending_user_id,
					state: StateType.ACTIVE,
				},
			},
		})) as t_sending_user_fields;

		const receiving_user: t_receiving_user_fields | null = await this._prisma.user.findUnique({
			select: {
				blocked: {
					select: {
						id: true,
					},
				},
			},
			where: {
				idAndState: {
					id: receiving_user_id,
					state: StateType.ACTIVE,
				},
			},
		});

		if (!receiving_user) {
			throw new UserNotFoundError(receiving_user_id);
		}

		if (sending_user_id === receiving_user_id) {
			throw new UserSelfMessageError();
		}

		if (!(await this._are_linked(sending_user_id, receiving_user_id, sending_user))) {
			throw new UserNotLinkedError(`${sending_user_id} - ${receiving_user_id}`);
		}

		if (sending_user.blocked.some((blocked) => blocked.id === receiving_user_id)) {
			throw new UserBlockedError(`${receiving_user_id}`);
		}

		const message: DirectMessage = await this._prisma.directMessage.create({
			data: {
				sender: {
					connect: {
						id: sending_user_id,
					},
				},
				receiver: {
					connect: {
						id: receiving_user_id,
					},
				},
				content,
			},
		});

		// DONE
		// if (!receiving_user.blocked.some((blocked) => blocked.id === sending_user_id)) {
		// 	// this._gateway.forward_to_user_socket(message);
		// }

		this._logger.log(`User ${sending_user_id} sent a message to user ${receiving_user_id}`);
		return {
			sender: sending_user,
			receiver: receiving_user,
			message: message,
		};
	}

	/**
	 * @brief	Make a user unblock another user, ending the restrictions imposed by the block.
	 * 			Unblocked user must be active, be currently blocked by the unblocking user,
	 * 			and not be the same as the unblocking user.
	 * 			It is assumed that the provided unblocking user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	unblocking_user_id The id of the user unblocking the other user.
	 * @param	unblocked_user_id The id of the user being unblocked.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- SelfUnblockError
	 * 			- NotBlockedError
	 *
	 * @return	An empty promise.
	 */
	public async unblock_one(unblocking_user_id: string, unblocked_user_id: string): Promise<void> {
		type t_unblocking_user_fields = {
			blocked: {
				id: string;
			}[];
		};
		type t_unblocked_user_fields = {
			id: string;
		};

		const unblocking_user: t_unblocking_user_fields = (await this._prisma.user.findUnique({
			select: {
				blocked: {
					select: {
						id: true,
					},
				},
			},
			where: {
				idAndState: {
					id: unblocking_user_id,
					state: StateType.ACTIVE,
				},
			},
		})) as t_unblocking_user_fields;

		const unblocked_user: t_unblocked_user_fields | null = await this._prisma.user.findUnique({
			select: {
				id: true,
			},
			where: {
				idAndState: {
					id: unblocked_user_id,
					state: StateType.ACTIVE,
				},
			},
		});

		if (!unblocked_user) {
			throw new UserNotFoundError();
		}

		if (unblocked_user_id === unblocking_user_id) {
			throw new UserSelfUnblockError();
		}

		let found: boolean = false;
		for (const blocked_user of unblocking_user.blocked) {
			if (blocked_user.id === unblocked_user_id) {
				found = true;
				break;
			}
		}
		if (!found) {
			throw new UserNotBlockedError();
		}

		await this._prisma.user.update({
			data: {
				blocked: {
					disconnect: {
						id: unblocked_user_id,
					},
				},
			},
			where: {
				idAndState: {
					id: unblocking_user_id,
					state: StateType.ACTIVE,
				},
			},
		});
		this._logger.log(
			`User ${unblocked_user_id} has been unblocked by user ${unblocking_user_id}`,
		);
	}

	/**
	 * @brief	Make a user unfriend another user, removing their friendship in both directions.
	 * 			Unfriended user must be active, be friend with the unfriending user,
	 * 			and not be the same as the unfriending user.
	 * 			It is assumed that the provided unfriending user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	unfriending_user_id The id of the user unfriending the other user.
	 * @param	unfriended_user_id The id of the user being unfriended.
	 * @param	unfriending_user The user unfriending the other user. (optional)
	 * @param	unfriended_user The user being unfriended. (optional)
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- UserSelfUnfriendError
	 * 			- UserNotFriendError
	 *
	 * @return	An empty promise.
	 */
	public async unfriend_two(
		unfriending_user_id: string,
		unfriended_user_id: string,
		unfriending_user?: {
			friends: {
				id: string;
			}[];
		},
		unfriended_user?: {
			id: string;
		} | null,
	): Promise<void> {
		if (!unfriending_user) {
			unfriending_user = (await this._prisma.user.findUnique({
				select: {
					friends: {
						select: {
							id: true,
						},
					},
				},
				where: {
					idAndState: {
						id: unfriending_user_id,
						state: StateType.ACTIVE,
					},
				},
			})) as {
				friends: {
					id: string;
				}[];
			};
		}

		if (!unfriended_user) {
			unfriended_user = await this._prisma.user.findUnique({
				select: {
					id: true,
				},
				where: {
					idAndState: {
						id: unfriended_user_id,
						state: StateType.ACTIVE,
					},
				},
			});

			if (!unfriended_user) {
				throw new UserNotFoundError();
			}
		}

		if (unfriended_user_id === unfriending_user_id) {
			throw new UserSelfUnfriendError();
		}

		if (!unfriending_user.friends.some((friend) => friend.id === unfriended_user_id)) {
			throw new UserNotFriendError();
		}

		await this._prisma.user.update({
			data: {
				friends: {
					disconnect: {
						idAndState: {
							id: unfriended_user_id,
							state: StateType.ACTIVE,
						},
					},
				},
			},
			where: {
				idAndState: {
					id: unfriending_user_id,
					state: StateType.ACTIVE,
				},
			},
		});
		await this._prisma.user.update({
			data: {
				friends: {
					disconnect: {
						idAndState: {
							id: unfriending_user_id,
							state: StateType.ACTIVE,
						},
					},
				},
			},
			where: {
				idAndState: {
					id: unfriended_user_id,
					state: StateType.ACTIVE,
				},
			},
		});
		this._logger.log(
			`User ${unfriended_user_id} has been unfriended by user ${unfriending_user_id}`,
		);
	}

	/**
	 * @brief	Update a user in the database.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	id The id of the user to update.
	 * @param	name The new name of the user.
	 * @param	email The new email of the user.
	 * @param	two_fact_auth The new two factor authentication state of the user.
	 * @param	skin_id The new skin id of the user.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserFieldUnaivalableError
	 * 			- UnknownError
	 *
	 * @return	An empty promise.
	 */
	// REMIND: rename into update_me (?)
	public async update_one(
		id: string,
		name?: string,
		email?: string,
		two_fact_auth?: boolean,
		skin_id?: string,
	): Promise<void> {
		type t_fields = {
			name: string;
			email: string | null;
			twoFactAuth: boolean;
			skinId: string;
		};

		const user: t_fields = (await this._prisma.user.findUnique({
			select: {
				name: true,
				email: true,
				twoFactAuth: true,
				skinId: true,
			},
			where: {
				idAndState: {
					id: id,
					state: StateType.ACTIVE,
				},
			},
		})) as t_fields;

		if (name !== undefined) user.name = name;
		if (email !== undefined) user.email = email;
		if (two_fact_auth !== undefined) user.twoFactAuth = two_fact_auth;
		if (skin_id !== undefined) user.skinId = skin_id;

		try {
			await this._prisma.user.update({
				data: user,
				where: {
					idAndState: {
						id: id,
						state: StateType.ACTIVE,
					},
				},
			});

			await this.broadcast_user_update_to_many({
				id,
				name,
			});
		} catch (error) {
			this._logger.error(`Error occured while updating user ${id}`);
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2002":
						throw new UserFieldUnaivalableError();
				}
				this._logger.error(`PrismaClientKnownRequestError code was ${error.code}`);
			}

			throw new UnknownError();
		}
	}

	/**
	 * @brief	Update a user's avatar in the database.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	id The id of the user to update the avatar from.
	 * @param	file The file containing the new avatar.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UnknownError
	 *
	 * @return	An empty promise.
	 */
	public async update_ones_avatar(id: string, file: Express.Multer.File): Promise<void> {
		type t_fields = {
			avatar: string;
		};

		const user: t_fields = (await this._prisma.user.findUnique({
			select: {
				avatar: true,
			},
			where: {
				idAndState: {
					id: id,
					state: StateType.ACTIVE,
				},
			},
		})) as t_fields;

		if (user.avatar === "resource/avatar/default.jpg") {
			user.avatar = `resource/avatar/${id}.jpg`;
			await this._prisma.user.update({
				data: {
					avatar: user.avatar,
				},
				where: {
					idAndState: {
						id: id,
						state: StateType.ACTIVE,
					},
				},
			});
		}
		try {
			createWriteStream(join(process.cwd(), user.avatar)).write(file.buffer);

			await this.broadcast_user_update_to_many({
				id,
				is_avatar_changed: true,
			});
		} catch (error) {
			if (error instanceof Error)
				this._logger.error(`Error occured while writing avatar to disk: ${error.message}`);
			throw new UnknownError();
		}
		this._logger.log(`Updated user ${id}'s avatar`);
	}

	/**
	 * @brief	Broadcast that a user has updated his profile to all related users.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	data: The id of the user to update + the fields that have been updated.
	 *
	 * @error	If no field has been provided, do nothing.
	 *
	 * @return	An empty promise.
	 */
	public async broadcast_user_update_to_many(data: t_user_update_event): Promise<void> {
		if (
			data.name === undefined &&
			data.status === undefined &&
			data.spectating === undefined &&
			data.game_lost === undefined &&
			data.game_won === undefined &&
			data.is_avatar_changed === false
		) {
			return;
		}

		/* let users: t_user_id[] =  */ await this._prisma.user.findMany({
			select: {
				id: true,
			},
			where: {
				OR: [
					{
						friends: {
							some: {
								id: data.id,
							},
						},
					},
					{
						channels: {
							some: {
								members: {
									some: {
										id: data.id,
									},
								},
							},
						},
					},
					{
						directMessagesSent: {
							some: {
								receiverId: data.id,
							},
						},
					},
					{
						directMessagesReceived: {
							some: {
								senderId: data.id,
							},
						},
					},
					{
						gamesPlayed: {
							some: {
								players: {
									some: {
										id: data.id,
									},
								},
							},
						},
					},
				],
				NOT: {
					id: data.id,
				},
			},
		});

		// this._gateway.broadcast_to_many("user_updated", new Set<t_user_id>(users), data);
	}
}
