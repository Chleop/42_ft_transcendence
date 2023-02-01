import {
	ChannelAlreadyJoinedError,
	ChannelFieldUnavailableError,
	ChannelInvitationIncorrectError,
	ChannelInvitationUnexpectedError,
	ChannelMessageNotFoundError,
	ChannelMessageTooLongError,
	ChannelMissingOwnerError,
	ChannelNotFoundError,
	ChannelNotJoinedError,
	ChannelNotOwnedError,
	ChannelPasswordIncorrectError,
	ChannelPasswordMissingError,
	ChannelPasswordNotAllowedError,
	ChannelPasswordUnexpectedError,
	ChannelRelationNotFoundError,
	ChannelUnpopulatedError,
	UnknownError,
} from "src/channel/error";
import { g_channel_message_length_limit } from "src/channel/limit";
import { ChatGateway } from "src/chat/chat.gateway";
import { PrismaService } from "src/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { Channel, ChannelMessage, ChanType, StateType } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import * as argon2 from "argon2";

@Injectable()
export class ChannelService {
	private _prisma: PrismaService;
	private _gateway: ChatGateway;
	private readonly _logger: Logger;

	constructor() {
		this._prisma = new PrismaService();
		this._gateway = new ChatGateway();
		this._logger = new Logger(ChannelService.name);
	}

	/**
	 * @brief	Delegate the ownership of a channel
	 * 			to a user chosen arbitrary among those present in this channel.
	 *
	 * @param	id The id of the channel to delegate the ownership.
	 * @param	channel The channel to delegate the ownership.
	 *
	 * @error	The following errors may be thrown:
	 * 			- ChannelNotFoundError
	 * 			- ChannelUnpopulatedError
	 * 			- ChannelMissingOwnerError
	 *
	 * @return	An empty promise.
	 */
	private async _delegate_ones_ownership(
		id: string,
		channel: {
			owner: {
				id: string;
			} | null;
			members: {
				id: string;
			}[];
			operators: {
				id: string;
			}[];
		},
	): Promise<void> {
		if (!channel.owner) {
			throw new ChannelMissingOwnerError(id);
		}

		if (channel.members.length < 2) {
			throw new ChannelUnpopulatedError(id);
		}

		for (const operator of channel.operators) {
			if (operator.id !== channel.owner.id) {
				await this._prisma.channel.update({
					where: {
						id: id,
					},
					data: {
						owner: {
							connect: {
								id: operator.id,
							},
						},
					},
				});
				this._logger.verbose(
					`Channel ${id} ownership delegated to operator ${operator.id}`,
				);
				return;
			}
		}
		for (const member of channel.members) {
			if (member.id !== channel.owner.id) {
				await this._prisma.channel.update({
					where: {
						id: id,
					},
					data: {
						owner: {
							connect: {
								id: member.id,
							},
						},
					},
				});
				this._logger.verbose(`Channel ${id} ownership delegated to member ${member.id}`);
				return;
			}
		}
	}

	/**
	 * @brief	Drop the ownership of a channel, making the channel unowned,
	 * 			and making the next joining user become the new owner of the channel.
	 *
	 * @param	id The id of the channel to drop the ownership.
	 * @param	channel The channel to drop the ownership.
	 *
	 * @error	The following errors may be thrown:
	 * 			- ChannelNotFoundError
	 * 			- ChannelMissingOwnerError
	 *
	 * @return	An empty promise.
	 */
	private async _drop_ones_ownership(
		id: string,
		channel?: {
			owner: {
				id: string;
			} | null;
		} | null,
	): Promise<void> {
		if (!channel) {
			channel = await this._prisma.channel.findUnique({
				where: {
					id: id,
				},
				select: {
					owner: {
						select: {
							id: true,
						},
					},
				},
			});

			if (!channel) {
				throw new ChannelNotFoundError(id);
			}
		}

		if (!channel.owner) {
			throw new ChannelMissingOwnerError(id);
		}

		await this._prisma.channel.update({
			where: {
				id: id,
			},
			data: {
				owner: {
					disconnect: true,
				},
			},
		});
		this._logger.verbose(`Channel ${id} ownership dropped`);
	}

	/**
	 * @brief	Get channel's messages which have been sent after a specific one from the database.
	 *
	 * @param	id The id of the channel to get the messages from.
	 * @param	message_id The id of the message to get the messages after.
	 * @param	limit The maximum number of messages to get.
	 *
	 * @error	The following errors may be thrown :
	 * 			- ChannelMessageNotFoundError
	 *
	 * @return	A promise containing the wanted messages.
	 */
	private async _get_ones_messages_after_a_specific_message(
		id: string,
		message_id: string,
		limit: number,
	): Promise<ChannelMessage[]> {
		type t_fields = {
			channelId: string;
			dateTime: Date;
		};

		const message: t_fields | null = await this._prisma.channelMessage.findUnique({
			where: {
				id: message_id,
			},
			select: {
				channelId: true,
				dateTime: true,
			},
		});

		if (!message || message.channelId !== id) {
			throw new ChannelMessageNotFoundError(message_id);
		}

		const messages: ChannelMessage[] = await this._prisma.channelMessage.findMany({
			where: {
				channelId: id,
				dateTime: {
					gt: message.dateTime,
				},
			},
			orderBy: {
				dateTime: "asc",
			},
			take: limit,
		});

		return messages;
	}

	/**
	 * @brief	Get channel's messages which have been sent before a specific one from the database.
	 *
	 * @param	id The id of the channel to get the messages from.
	 * @param	message_id The id of the message to get the messages before.
	 * @param	limit The maximum number of messages to get.
	 *
	 * @error	The following errors may be thrown :
	 * 			- ChannelMessageNotFoundError
	 *
	 * @return	A promise containing the wanted messages.
	 */
	private async _get_ones_messages_before_a_specific_message(
		id: string,
		message_id: string,
		limit: number,
	): Promise<ChannelMessage[]> {
		type t_fields = {
			channelId: string;
			dateTime: Date;
		};

		const message: t_fields | null = await this._prisma.channelMessage.findUnique({
			where: {
				id: message_id,
			},
			select: {
				channelId: true,
				dateTime: true,
			},
		});

		if (!message || message.channelId !== id) {
			throw new ChannelMessageNotFoundError(message_id);
		}

		const messages: ChannelMessage[] = await this._prisma.channelMessage.findMany({
			where: {
				channelId: id,
				dateTime: {
					lt: message.dateTime,
				},
			},
			orderBy: {
				dateTime: "desc",
			},
			take: limit,
		});

		// Get the most ancient messages first
		messages.reverse();
		return messages;
	}

	/**
	 * @brief	Get channel's most recent messages from the database.
	 *
	 * @param	id The id of the channel to get the messages from.
	 * @param	limit The maximum number of messages to get.
	 *
	 * @return	A promise containing the wanted messages.
	 */
	private async _get_ones_most_recent_messages(
		id: string,
		limit: number,
	): Promise<ChannelMessage[]> {
		const messages: ChannelMessage[] = await this._prisma.channelMessage.findMany({
			where: {
				channelId: id,
			},
			orderBy: {
				dateTime: "desc",
			},
			take: limit,
		});

		// Get the most ancient messages first
		messages.reverse();
		return messages;
	}

	/**
	 * @brief	Check if a channel is ownerless,
	 * 			and if so, make the new joining user inherit the ownership of this channel.
	 *
	 * @param	channel The channel to check.
	 * @param	user_id The id of the user who is joining the channel.
	 *
	 * @return	A promise containing the updated channel.
	 */
	private async _inherit_ones_ownership(channel: Channel, user_id: string): Promise<Channel> {
		if (!channel.ownerId) {
			channel = await this._prisma.channel.update({
				where: {
					id: channel.id,
				},
				data: {
					owner: {
						connect: {
							id: user_id,
						},
					},
				},
			});
			this._logger.log(`Channel ${channel.id} owner changed to ${user_id}`);
		} else {
		}
		return channel;
	}

	/**
	 * @brief	Create a new channel in the database.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is not DISABLED)
	 *
	 * @param	user_id The id of the user who is creating the channel.
	 * @param	name The name of the channel.
	 * @param	is_private Whether the channel is private or not.
	 * @param	password The password of the channel, if it isn't private.
	 *
	 * @error	The following errors may be thrown :
	 * 			- ChannelPasswordNotAllowedError
	 * 			- ChannelFieldUnavailableError
	 * 			- ChannelRelationNotFoundError
	 * 			- UnknownError
	 *
	 * @return	A promise containing the created channel's data.
	 */
	public async create_one(
		user_id: string,
		name: string,
		is_private: boolean,
		password?: string,
	): Promise<Channel> {
		let type: ChanType;
		let channel: Channel;

		if (is_private) {
			type = ChanType.PRIVATE;
			if (password) {
				throw new ChannelPasswordNotAllowedError();
			}
		} else if (password) {
			type = ChanType.PROTECTED;
		} else {
			type = ChanType.PUBLIC;
		}

		try {
			channel = await this._prisma.channel.create({
				data: {
					name: name,
					chanType: type,
					hash: password ? await argon2.hash(password) : null,
					owner: {
						connect: {
							idAndState: {
								id: user_id,
								state: StateType.ACTIVE,
							},
						},
					},
					members: {
						connect: {
							idAndState: {
								id: user_id,
								state: StateType.ACTIVE,
							},
						},
					},
				},
			});
			this._logger.log(`Channel ${channel.id} created`);
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2002":
						throw new ChannelFieldUnavailableError("name");
					case "P2025":
						throw new ChannelRelationNotFoundError("owner|members");
				}
			}

			throw new UnknownError();
		}

		channel.hash = null;
		return channel;
	}

	/**
	 * @brief	Delete a channel from the database.
	 * 			Only the owner of the channel is allowed to delete it.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is not DISABLED)
	 *
	 * @param	user_id The id of the user who is deleting the channel.
	 * @param	channel_id The id of the channel to delete.
	 *
	 * @error	The following errors may be thrown :
	 * 			- ChannelNotFoundError
	 * 			- ChannelNotJoinedError
	 * 			- ChannelNotOwnedError
	 * 			- UnknownError
	 *
	 * @return	An empty promise.
	 */
	public async delete_one(user_id: string, channel_id: string): Promise<void> {
		type t_fields = {
			ownerId: string | null;
			members: {
				id: string;
			}[];
		};

		const channel: t_fields | null = await this._prisma.channel.findUnique({
			select: {
				ownerId: true,
				members: {
					select: { id: true },
				},
			},
			where: { id: channel_id },
		});

		if (!channel) {
			throw new ChannelNotFoundError(channel_id);
		} else if (channel.members.find((member) => member.id === user_id) === undefined) {
			throw new ChannelNotJoinedError(channel_id);
		} else if (channel.ownerId !== user_id) {
			throw new ChannelNotOwnedError(channel_id);
		}

		try {
			await this._prisma.channelMessage.deleteMany({
				where: {
					channelId: channel_id,
				},
			});

			await this._prisma.channel.delete({
				where: {
					id: channel_id,
				},
			});
			this._logger.log(`Channel ${channel_id} deleted`);
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2025":
						throw new ChannelNotFoundError(channel_id);
				}
			}

			throw new UnknownError();
		}
	}

	/**
	 * @brief	Get channel's messages from the database.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is not DISABLED)
	 *
	 * @param	user_id The id of the user who is getting the messages.
	 * @param	channel_id The id of the channel to get the messages from.
	 * @param	limit The maximum number of messages to get.
	 * @param	before The id of the message to get the messages before.
	 * @param	after The id of the message to get the messages after.
	 *
	 * @error	The following errors may be thrown :
	 * 			- ChannelNotFoundError
	 * 			- ChannelNotJoinedError
	 * 			- ChannelMessageNotFoundError
	 *
	 * @return	A promise containing the wanted messages.
	 */
	public async get_ones_messages(
		user_id: string,
		channel_id: string,
		limit: number,
		before?: string,
		after?: string,
	): Promise<ChannelMessage[]> {
		type t_fields = {
			members: {
				id: string;
			}[];
		};

		const channel: t_fields | null = await this._prisma.channel.findUnique({
			select: {
				members: {
					select: {
						id: true,
					},
				},
			},
			where: {
				id: channel_id,
			},
		});

		if (!channel) {
			throw new ChannelNotFoundError(channel_id);
		} else if (channel.members.find((member) => member.id === user_id) === undefined) {
			throw new ChannelNotJoinedError(channel_id);
		}

		if (before) {
			return await this._get_ones_messages_before_a_specific_message(
				channel_id,
				before,
				limit,
			);
		} else if (after) {
			return await this._get_ones_messages_after_a_specific_message(channel_id, after, limit);
		} else {
			return await this._get_ones_most_recent_messages(channel_id, limit);
		}
	}

	/**
	 * @brief	Make a user join a channel.
	 * 			Depending on the channel's type, the user will join the channel in different ways :
	 * 			- PUBLIC, nothing is requiered.
	 * 			- PROTECTED, a correct password is required.
	 * 			- PRIVATE, an valid invitation is required.
	 * 			If the channel is ownerless, the user will inherit of the ownership of the channel.
	 * 			It is assumed that the provided joining user id is valid.
	 * 			(user exists and is not DISABLED)
	 *
	 * @param	joining_user_id The id of the user who is joining the channel.
	 * @param	channel_id The id of the channel to join.
	 * @param	password The password of the channel to join.
	 * @param	inviting_user_id The id of the user who invited the joining user.
	 *
	 * @error	The following errors may be thrown :
	 * 			- ChannelNotFoundError
	 * 			- ChannelAlreadyJoinedError
	 * 			- ChannelPasswordUnexpectedError
	 * 			- ChannelInvitationIncorrectError
	 * 			- ChannelInvitationUnexpectedError
	 * 			- ChannelPasswordMissingError
	 * 			- ChannelPasswordIncorrectError
	 * 			- ChannelRelationNotFoundError
	 * 			- UnknownError
	 *
	 * @return	A promise containing the joined channel's data.
	 */
	public async join_one(
		joining_user_id: string,
		channel_id: string,
		password?: string,
		inviting_user_id?: string,
	): Promise<Channel> {
		let channel: Channel | null;

		channel = await this._prisma.channel.findUnique({
			where: {
				id: channel_id,
			},
		});
		if (!channel) {
			throw new ChannelNotFoundError(channel_id);
		}

		if (
			await this._prisma.channel.count({
				where: {
					id: channel_id,
					members: {
						some: {
							id: joining_user_id,
						},
					},
				},
			})
		) {
			throw new ChannelAlreadyJoinedError(channel_id);
		}

		if (channel.chanType === ChanType.PRIVATE) {
			if (password !== undefined) {
				throw new ChannelPasswordUnexpectedError();
			}
			if (
				inviting_user_id === undefined ||
				!(await this._prisma.channel.count({
					where: {
						id: channel_id,
						members: {
							some: {
								id: inviting_user_id,
							},
						},
					},
				}))
			) {
				throw new ChannelInvitationIncorrectError();
			}
		} else if (channel.chanType === ChanType.PROTECTED) {
			if (inviting_user_id !== undefined) {
				throw new ChannelInvitationUnexpectedError();
			}
			if (password === undefined) {
				throw new ChannelPasswordMissingError();
			} else if (!(await argon2.verify(<string>channel.hash, password))) {
				throw new ChannelPasswordIncorrectError();
			}
		} else {
			if (password !== undefined) {
				throw new ChannelPasswordUnexpectedError();
			}
		}

		try {
			channel = await this._prisma.channel.update({
				where: {
					id: channel_id,
				},
				data: {
					members: {
						connect: {
							idAndState: {
								id: joining_user_id,
								state: StateType.ACTIVE,
							},
						},
					},
				},
			});
			this._logger.log(`Channel ${channel_id} joined by ${joining_user_id}`);
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2025":
						throw new ChannelRelationNotFoundError("members");
				}
			}
			throw new UnknownError();
		}

		channel = await this._inherit_ones_ownership(channel, joining_user_id);
		channel.hash = null;
		return channel;
	}

	/**
	 * @brief	Make a user leave a channel.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is not DISABLED)
	 *
	 * @param	user_id The id of the user leaving the channel.
	 * @param	channel_id The id of the channel to leave.
	 * @param	channel The channel to leave.
	 *
	 * @error	The following errors may be thrown :
	 * 			- ChannelNotFoundError
	 * 			- ChannelNotJoinedError
	 *
	 * @return	An empty promise.
	 */

	public async leave_one(
		user_id: string,
		channel_id: string,
		channel?: {
			owner: {
				id: string;
			} | null;
			members: {
				id: string;
			}[];
			operators: {
				id: string;
			}[];
		} | null,
	): Promise<void> {
		if (!channel) {
			channel = await this._prisma.channel.findUnique({
				select: {
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
					id: channel_id,
				},
			});

			if (!channel) {
				throw new ChannelNotFoundError(channel_id);
			}
		}

		if (
			!(await this._prisma.channel.count({
				where: {
					id: channel_id,
					members: {
						some: {
							id: user_id,
						},
					},
				},
			}))
		) {
			throw new ChannelNotJoinedError(channel_id);
		}

		if (channel.owner?.id === user_id) {
			try {
				await this._delegate_ones_ownership(channel_id, channel);
			} catch (error) {
				if (error instanceof ChannelUnpopulatedError) {
					await this._drop_ones_ownership(channel_id, channel);
				}
			}
		} else {
		}

		await this._prisma.channel.update({
			where: {
				id: channel_id,
			},
			data: {
				members: {
					disconnect: {
						id: user_id,
					},
				},
				operators: {
					disconnect: {
						id: user_id,
					},
				},
			},
		});
		this._logger.log(`Channel ${channel_id} left by user ${user_id}`);
	}

	/**
	 * @brief	Make a user send a message to a channel they are in.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is not DISABLED)
	 *
	 * @param	user_id The id of the user sending the message.
	 * @param	channel_id The id of the channel to send the message to.
	 * @param	content The message content to send in the channel.
	 *
	 * @error	The following errors may be thrown :
	 * 			- ChannelNotFoundError
	 * 			- ChannelNotJoinedError
	 * 			- ChannelMessageTooLongError
	 *
	 * @return	A promise containing the newly sent message data.
	 */
	public async send_message_to_one(
		user_id: string,
		channel_id: string,
		content: string,
	): Promise<ChannelMessage> {
		type t_fields = {
			members: {
				id: string;
			}[];
		};

		const channel: t_fields | null = await this._prisma.channel.findUnique({
			select: {
				members: {
					select: {
						id: true,
					},
				},
			},
			where: {
				id: channel_id,
			},
		});

		if (!channel) {
			throw new ChannelNotFoundError(channel_id);
		}

		if (
			!(await this._prisma.channel.count({
				where: {
					id: channel_id,
					members: {
						some: {
							id: user_id,
						},
					},
				},
			}))
		) {
			throw new ChannelNotJoinedError(channel_id);
		}

		if (content.length > g_channel_message_length_limit) {
			throw new ChannelMessageTooLongError(
				`message length: ${content.length} ; limit: ${g_channel_message_length_limit}`,
			);
		}

		const message: ChannelMessage = await this._prisma.channelMessage.create({
			data: {
				channel: {
					connect: {
						id: channel_id,
					},
				},
				sender: {
					connect: {
						id: user_id,
					},
				},
				content: content,
			},
		});
		this._gateway.broadcast_to_everyone(message);
		this._logger.verbose(`Message sent to channel ${channel_id} by user ${user_id}`);

		return message;
	}
}
