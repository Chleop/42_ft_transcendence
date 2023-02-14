import {
	t_get_all_fields,
	t_get_all_fields_tmp,
	t_join_one_fields,
	t_join_one_fields_tmp,
} from "src/channel/alias";
import {
	ChannelAlreadyJoinedError,
	ChannelFieldUnavailableError,
	ChannelForbiddenToJoinError,
	ChannelMemberAlreadyDemotedError,
	ChannelMemberAlreadyMutedError,
	ChannelMemberAlreadyPromotedError,
	ChannelMemberMutedError,
	ChannelMemberNotFoundError,
	ChannelMemberNotOperatorError,
	ChannelMemberNotOwnerError,
	ChannelMessageNotFoundError,
	ChannelMessageTooLongError,
	ChannelMissingOwnerError,
	ChannelNameAlreadyTakenError,
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
import { ChannelMemberNotBannedError } from "./error/ChannelMemberNotBanned.error";

@Injectable()
export class ChannelService {
	// REMIND: would it be better to make these properties static ?
	// REMIND: check if passing `_prisma` in readonly keep it working well
	private _prisma: PrismaService;
	// REMIND: check if passing `_gateway` in readonly keep it working well
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
		}

		return channel;
	}

	/**
	 * @brief	Make a user ban another user from a specific channel.
	 * 			The banning user must be either the owner of the channel, or an operator.
	 * 			It is assumed that the provided banning user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	banning_user_id The id of the user who is banning the other user.
	 * @param	channel_id The id of the channel to ban the user from.
	 * @param	banned_user_id The id of the user who is being banned.
	 *
	 * @error	The following errors may be thrown :
	 * 			- ChannelNotFoundError
	 * 			- ChannelNotJoinedError
	 * 			- ChannelMemberNotFoundError
	 * 			- ChannelMemberNotOperatorError
	 *
	 * @return	An empty promise.
	 */
	public async ban_ones_member(
		banning_user_id: string,
		channel_id: string,
		banned_user_id: string,
	): Promise<void> {
		type t_fields = {
			members: {
				id: string;
			}[];
			operators: {
				id: string;
			}[];
			owner: {
				id: string;
			} | null;
		};

		const channel: t_fields | null = await this._prisma.channel.findUnique({
			select: {
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
				owner: {
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

		await this.kick_ones_member(banning_user_id, channel_id, banned_user_id, channel);
		await this._prisma.channel.update({
			data: {
				banned: {
					connect: {
						id: banned_user_id,
					},
				},
			},
			where: {
				id: channel_id,
			},
		});

		this._logger.log(
			`User ${banned_user_id} banned from channel ${channel_id} by ${banning_user_id}`,
		);
	}

	/**
	 * @brief	Create a new channel in the database.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is ACTIVE)
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
	 * 			(user exists and is ACTIVE)
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
	 * @brief	Make a user demote another user from operators.
	 * 			The demoting user must be either the owner of the channel, or an operator.
	 * 			It is assumed that the provided user ids are valid.
	 * 			(users exist and are ACTIVE)
	 *
	 * @param	demoting_user_id The id of the user who is demoting the other user.
	 * @param	channel_id The id of the channel to demote a user in.
	 * @param	demoted_user_id The id of the user who is being demoted.
	 *
	 * @error	The following errors may be thrown :
	 * 			- ChannelNotFoundError
	 * 			- ChannelNotJoinedError
	 * 			- ChannelMemberNotFoundError
	 * 			- ChannelMemberNotOperatorError
	 * 			- ChannelMemberAlreadyDemotedError
	 *
	 * @return	An empty promise.
	 */
	public async demote_ones_operator(
		demoting_user_id: string,
		channel_id: string,
		demoted_user_id: string,
	): Promise<void> {
		type t_fields = {
			members: {
				id: string;
			}[];
			operators: {
				id: string;
			}[];
			owner: {
				id: string;
			} | null;
		};

		const channel: t_fields | null = await this._prisma.channel.findUnique({
			select: {
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
				owner: {
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

		if (channel.members.every((member): boolean => member.id !== demoting_user_id)) {
			throw new ChannelNotJoinedError(`user: ${demoting_user_id} | channel: ${channel_id}`);
		}

		if (channel.members.every((member): boolean => member.id !== demoted_user_id)) {
			throw new ChannelMemberNotFoundError(
				`user: ${demoted_user_id} | channel: ${channel_id}`,
			);
		}

		if (
			channel.owner!.id !== demoting_user_id &&
			channel.operators.every((operator): boolean => operator.id !== demoting_user_id)
		) {
			throw new ChannelMemberNotOperatorError(
				`user: ${demoting_user_id} | channel: ${channel_id}`,
			);
		}

		if (channel.operators.every((operator): boolean => operator.id !== demoted_user_id)) {
			throw new ChannelMemberAlreadyDemotedError(
				`user: ${demoted_user_id} | channel: ${channel_id}`,
			);
		}

		await this._prisma.channel.update({
			data: {
				operators: {
					disconnect: {
						id: demoted_user_id,
					},
				},
			},
			where: {
				id: channel_id,
			},
		});
		this._logger.log(
			`User ${demoted_user_id} demoted from operators in channel ${channel_id} by user ${demoting_user_id}`,
		);
	}

	/**
	 * @brief	Get the list of the available channels.
	 * 			Channels which are private or which the user is already in are not listed.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	user_id The id of the user who is getting the channels.
	 *
	 * @return	A promise containing the list of the available channels.
	 */
	public async get_all(user_id: string): Promise<t_get_all_fields> {
		const channels_tmp: t_get_all_fields_tmp = await this._prisma.channel.findMany({
			select: {
				id: true,
				name: true,
				chanType: true,
				ownerId: true,
				members: {
					select: {
						id: true,
					},
				},
			},
			where: {
				OR: [
					{
						chanType: ChanType.PUBLIC,
					},
					{
						chanType: ChanType.PROTECTED,
					},
				],
				NOT: {
					members: {
						some: {
							id: user_id,
						},
					},
				},
			},
		});

		const channels: t_get_all_fields = [];
		for (const channel_tmp of channels_tmp) {
			channels.push({
				id: channel_tmp.id,
				name: channel_tmp.name,
				type: channel_tmp.chanType,
				owner_id: channel_tmp.ownerId,
				members_count: channel_tmp.members.length,
			});
		}

		return channels;
	}

	/**
	 * @brief	Get channel's messages from the database.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is ACTIVE)
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
	 * 			- PRIVATE, nothing is requered.
	 * 			If the channel is ownerless, the user will inherit of the ownership of the channel.
	 * 			It is assumed that the provided joining user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	joining_user_id The id of the user who is joining the channel.
	 * @param	channel_id The id of the channel to join.
	 * @param	password The password of the channel to join.
	 *
	 * @error	The following errors may be thrown :
	 * 			- ChannelNotFoundError
	 * 			- ChannelAlreadyJoinedError
	 * 			- ChannelPasswordUnexpectedError
	 * 			- ChannelPasswordMissingError
	 * 			- ChannelPasswordIncorrectError
	 * 			- ChannelForbiddenToJoinError
	 *
	 * @return	A promise containing the joined channel's data.
	 */
	public async join_one(
		joining_user_id: string,
		channel_id: string,
		password?: string,
	): Promise<t_join_one_fields> {
		const channel_tmp: t_join_one_fields_tmp | null = await this._prisma.channel.findUnique({
			select: {
				banned: {
					select: {
						id: true,
					},
				},
				chanType: true,
				hash: true,
				id: true,
				members: {
					select: {
						id: true,
					},
				},
				name: true,
				ownerId: true,
			},

			where: {
				id: channel_id,
			},
		});

		if (!channel_tmp) {
			throw new ChannelNotFoundError(channel_id);
		}

		if (channel_tmp.members.some((member) => member.id === joining_user_id)) {
			throw new ChannelAlreadyJoinedError(channel_id);
		}

		switch (channel_tmp.chanType) {
			case ChanType.PRIVATE:
				if (password !== undefined) {
					throw new ChannelPasswordUnexpectedError();
				}
				break;

			case ChanType.PROTECTED:
				if (password === undefined) {
					throw new ChannelPasswordMissingError();
				} else if (!(await argon2.verify(<string>channel_tmp.hash, password))) {
					throw new ChannelPasswordIncorrectError();
				}
				break;

			case ChanType.PUBLIC:
				if (password !== undefined) {
					throw new ChannelPasswordUnexpectedError();
				}
				break;
		}

		if (channel_tmp.banned.some((ban) => ban.id === joining_user_id)) {
			throw new ChannelForbiddenToJoinError(
				`channel: ${channel_id} | user: ${joining_user_id}`,
			);
		}

		await this._prisma.channel.update({
			data: {
				members: {
					connect: {
						id: joining_user_id,
					},
				},
			},
			where: {
				id: channel_id,
			},
		});
		this._logger.log(`Channel ${channel_id} joined by ${joining_user_id}`);

		this._gateway.make_user_socket_join_room(joining_user_id, channel_id);
		const channel: t_join_one_fields = {
			id: channel_tmp.id,
			name: channel_tmp.name,
			type: channel_tmp.chanType,
			owner_id: (await this._inherit_ones_ownership(channel_tmp, joining_user_id)).ownerId,
		};
		return channel;
	}

	/**
	 * @brief	Make a user remove another user from the members of a specific channel.
	 * 			The kicking user must be either the owner of the channel, or an operator.
	 * 			It is assumed that the provided kicking user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	kicking_user_id The id of the user who is kicking the other user.
	 * @param	channel_id The id of the channel to kick the user from.
	 * @param	kicked_user_id The id of the user who is being kicked.
	 *
	 * @error	The following errors may be thrown :
	 * 			- ChannelNotFoundError
	 * 			- ChannelNotJoinedError
	 * 			- ChannelMemberNotFoundError
	 * 			- ChannelMemberNotOperatorError
	 *
	 * @return	An empty promise.
	 */
	public async kick_ones_member(
		kicking_user_id: string,
		channel_id: string,
		kicked_user_id: string,
		channel?: {
			members: {
				id: string;
			}[];
			operators: {
				id: string;
			}[];
			owner: {
				id: string;
			} | null;
		} | null,
	): Promise<void> {
		if (!channel) {
			channel = await this._prisma.channel.findUnique({
				select: {
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
					owner: {
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

		if (channel.members.every((member): boolean => member.id !== kicking_user_id)) {
			throw new ChannelNotJoinedError(`user: ${kicking_user_id} | channel: ${channel_id}`);
		}

		if (channel.members.every((member): boolean => member.id !== kicked_user_id)) {
			throw new ChannelMemberNotFoundError(
				`user: ${kicked_user_id} | channel: ${channel_id}`,
			);
		}

		if (
			channel.owner!.id !== kicking_user_id &&
			channel.operators.every((operator): boolean => operator.id !== kicking_user_id)
		) {
			throw new ChannelMemberNotOperatorError(
				`user: ${kicking_user_id} | channel: ${channel_id}`,
			);
		}

		await this._prisma.channel.update({
			data: {
				members: {
					disconnect: {
						id: kicked_user_id,
					},
				},
			},
			where: {
				id: channel_id,
			},
		});

		this._logger.log(
			`User ${kicked_user_id} kicked from channel ${channel_id} by ${kicking_user_id}`,
		);
	}

	/**
	 * @brief	Make a user leave a channel.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is ACTIVE)
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

		if (channel.members.every((member): boolean => member.id !== user_id)) {
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

		this._gateway.make_user_socket_leave_room(user_id, channel_id);
	}

	/**
	 * @brief	Make a user mute another user.
	 * 			The muting user must be either the owner of the channel, or an operator.
	 * 			It is assumed that the provided muting user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	muting_user_id The id of the user muting another user.
	 * @param	channel_id The id of the channel to mute a user in.
	 * @param	muted_user_id The id of the user being muted.
	 * @param	duration The duration of the mute. (in seconds)
	 *
	 * @error	The following errors may be thrown :
	 * 			- ChannelNotFoundError
	 * 			- ChannelNotJoinedError
	 * 			- ChannelMemberNotFoundError
	 * 			- ChannelMemberNotOperatorError
	 * 			- ChannelMemberAlreadyMutedError
	 *
	 * @return	An empty promise.
	 */
	public async mute_ones_member(
		muting_user_id: string,
		channel_id: string,
		muted_user_id: string,
		duration: number,
	): Promise<void> {
		type t_fields = {
			members: {
				id: string;
			}[];
			muted: {
				id: string;
			}[];
			operators: {
				id: string;
			}[];
			owner: {
				id: string;
			} | null;
		};

		const channel: t_fields | null = await this._prisma.channel.findUnique({
			select: {
				members: {
					select: {
						id: true,
					},
				},
				muted: {
					select: {
						id: true,
					},
				},
				operators: {
					select: {
						id: true,
					},
				},
				owner: {
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

		if (channel.members.every((member): boolean => member.id !== muting_user_id)) {
			throw new ChannelNotJoinedError(`user: ${muting_user_id} | channel: ${channel_id}`);
		}

		if (channel.members.every((member): boolean => member.id !== muted_user_id)) {
			throw new ChannelMemberNotFoundError(`user: ${muted_user_id} | channel: ${channel_id}`);
		}

		if (
			channel.operators.every((operator): boolean => operator.id !== muting_user_id) &&
			channel.owner?.id !== muting_user_id
		) {
			throw new ChannelMemberNotOperatorError(
				`user: ${muting_user_id} | channel: ${channel_id}`,
			);
		}

		if (channel.muted.some((muted): boolean => muted.id === muted_user_id)) {
			throw new ChannelMemberAlreadyMutedError(
				`user: ${muted_user_id} | channel: ${channel_id}`,
			);
		}

		await this._prisma.channel.update({
			data: {
				muted: {
					connect: {
						id: muted_user_id,
					},
				},
			},
			where: {
				id: channel_id,
			},
		});

		setTimeout(async () => {
			await this._prisma.channel.update({
				data: {
					muted: {
						disconnect: {
							id: muted_user_id,
						},
					},
				},
				where: {
					id: channel_id,
				},
			});
		}, duration * 1000);

		this._logger.log(
			`User ${muted_user_id} muted in channel ${channel_id} by user ${muting_user_id} for ${duration} seconds`,
		);
	}

	/**
	 * @brief	Make a user promote another user as operator.
	 * 			The promoting user must be either the owner of the channel, or an operator.
	 * 			Operators are able to :
	 * 				- Promote other users as operators.
	 * 				- Demote other users from operators.
	 * 				- Kick other users from the channel.
	 * 				- Ban other users from the channel.
	 * 				- Unban other users from the channel.
	 * 				- Mute other users in the channel for a limited time.
	 * 			It is assumed that the provided promoting user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	promoting_user_id The id of the user promoting another user.
	 * @param	channel_id The id of the channel to promote a user in.
	 * @param	promoted_user_id The id of the user being promoted.
	 *
	 * @error	The following errors may be thrown :
	 * 			- ChannelNotFoundError
	 * 			- ChannelNotJoinedError
	 * 			- ChannelMemberNotFoundError
	 * 			- ChannelMemberNotOperatorError
	 * 			- ChannelMemberAlreadyPromotedError
	 *
	 * @return	An empty promise.
	 */
	public async promote_ones_member(
		promoting_user_id: string,
		channel_id: string,
		promoted_user_id: string,
	): Promise<void> {
		type t_fields = {
			members: {
				id: string;
			}[];
			operators: {
				id: string;
			}[];
			owner: {
				id: string;
			} | null;
		};

		const channel: t_fields | null = await this._prisma.channel.findUnique({
			select: {
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
				owner: {
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

		if (channel.members.every((member): boolean => member.id !== promoting_user_id)) {
			throw new ChannelNotJoinedError(`user: ${promoting_user_id} | channel: ${channel_id}`);
		}

		if (channel.members.every((member): boolean => member.id !== promoted_user_id)) {
			throw new ChannelMemberNotFoundError(
				`user: ${promoted_user_id} | channel: ${channel_id}`,
			);
		}

		if (
			channel.owner!.id !== promoting_user_id &&
			channel.operators.every((operator): boolean => operator.id !== promoting_user_id)
		) {
			throw new ChannelMemberNotOperatorError(
				`user: ${promoting_user_id} | channel: ${channel_id}`,
			);
		}

		if (channel.operators.some((operator): boolean => operator.id === promoted_user_id)) {
			throw new ChannelMemberAlreadyPromotedError(
				`user: ${promoted_user_id} | channel: ${channel_id}`,
			);
		}

		await this._prisma.channel.update({
			data: {
				operators: {
					connect: {
						id: promoted_user_id,
					},
				},
			},
			where: {
				id: channel_id,
			},
		});
		this._logger.log(
			`User ${promoted_user_id} promoted as operator in channel ${channel_id} by user ${promoting_user_id}`,
		);
	}

	/**
	 * @brief	Make a user send a message to a channel they are in.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	user_id The id of the user sending the message.
	 * @param	channel_id The id of the channel to send the message to.
	 * @param	content The message content to send in the channel.
	 *
	 * @error	The following errors may be thrown :
	 * 			- ChannelNotFoundError
	 * 			- ChannelNotJoinedError
	 * 			- ChannelMemberMutedError
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
			muted: {
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
				muted: {
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

		if (channel.members.every((member): boolean => member.id !== user_id)) {
			throw new ChannelNotJoinedError(channel_id);
		}

		if (channel.muted.some((muted): boolean => muted.id === user_id)) {
			throw new ChannelMemberMutedError(user_id);
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
		this._gateway.broadcast_to_room(message);
		this._logger.verbose(`Message sent to channel ${channel_id} by user ${user_id}`);

		return message;
	}

	/**
	 * @brief	Make a user unban another user from a specific channel.
	 * 			The unbanning user must be either the owner of the channel, or an operator.
	 * 			It is assumed that the provided unbanning user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	unbanning_user_id The id of the user who is unbanning the other user.
	 * @param	channel_id The id of the channel to ban the user from.
	 * @param	unbanned_user_id The id of the user who is being unbanned.
	 *
	 * @error	The following errors may be thrown :
	 * 			- ChannelNotFoundError
	 * 			- ChannelNotJoinedError
	 * 			- ChannelMemberNotBannedError
	 * 			- ChannelMemberNotOperatorError
	 *
	 * @return	An empty promise.
	 */
	public async unban_ones_member(
		unbanning_user_id: string,
		channel_id: string,
		unbanned_user_id: string,
	): Promise<void> {
		type t_fields = {
			banned: {
				id: string;
			}[];
			members: {
				id: string;
			}[];
			operators: {
				id: string;
			}[];
			owner: {
				id: string;
			} | null;
		};

		const channel: t_fields | null = await this._prisma.channel.findUnique({
			select: {
				banned: {
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
				owner: {
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

		if (channel.members.every((member): boolean => member.id !== unbanning_user_id)) {
			throw new ChannelNotJoinedError(`user: ${unbanning_user_id} | channel: ${channel_id}`);
		}

		if (channel.banned.every((banned): boolean => banned.id !== unbanned_user_id)) {
			throw new ChannelMemberNotBannedError(
				`user: ${unbanned_user_id} | channel: ${channel_id}`,
			);
		}

		if (
			channel.owner!.id !== unbanning_user_id &&
			channel.operators.every((operator): boolean => operator.id !== unbanning_user_id)
		) {
			throw new ChannelMemberNotOperatorError(
				`user: ${unbanning_user_id} | channel: ${channel_id}`,
			);
		}

		await this._prisma.channel.update({
			data: {
				banned: {
					disconnect: {
						id: unbanned_user_id,
					},
				},
			},
			where: {
				id: channel_id,
			},
		});
		this._logger.log(
			`User ${unbanned_user_id} unbanned from channel ${channel_id} by user ${unbanning_user_id}`,
		);
	}

	/**
	 * @brief	Make a user update a specific channel.
	 * 			The updating user must be the owner of the channel.
	 * 			It is assumed that the provided updating user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	updating_user_id The id of the user who is updating the channel.
	 * @param	channel_id The id of the channel to update.
	 * @param	name The new name of the channel.
	 * @param	type The new type of the channel.
	 * @param	password The new password of the channel.
	 *
	 * @error	The following errors may be thrown :
	 * 			- ChannelNotFoundError
	 * 			- ChannelNotJoinedError
	 * 			- ChannelMemberNotOwnerError
	 * 			- ChannelNameAlreadyTakenError
	 * 			- ChannelPasswordMissingError
	 * 			- ChannelPasswordNotAllowedError
	 *
	 * @return	An empty promise.
	 */
	public async update_one(
		updating_user_id: string,
		channel_id: string,
		name?: string,
		type?: ChanType,
		password?: string,
	): Promise<void> {
		type t_fields = {
			chanType: ChanType;
			hash: string | null;
			members: {
				id: string;
			}[];
			name: string;
			owner: {
				id: string;
			} | null;
		};

		const channel: t_fields | null = await this._prisma.channel.findUnique({
			select: {
				chanType: true,
				hash: true,
				members: {
					select: {
						id: true,
					},
				},
				name: true,
				owner: {
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

		if (channel.members.every((member): boolean => member.id !== updating_user_id)) {
			throw new ChannelNotJoinedError(`user: ${updating_user_id} | channel: ${channel_id}`);
		}

		if (channel.owner!.id !== updating_user_id) {
			throw new ChannelMemberNotOwnerError(
				`user: ${updating_user_id} | channel: ${channel_id}`,
			);
		}

		if (name !== undefined) {
			if (
				(
					await this._prisma.channel.findUnique({
						select: {
							id: true,
						},
						where: {
							name: name,
						},
					})
				)?.id !== channel_id
			) {
				throw new ChannelNameAlreadyTakenError(name);
			}
			channel.name = name;
		}

		if (type !== undefined) {
			channel.chanType = type;
		}

		if (password !== undefined) {
			channel.hash = password ? await argon2.hash(password) : null;
		}

		if (channel.chanType === ChanType.PROTECTED && !channel.hash) {
			throw new ChannelPasswordMissingError();
		}

		if (channel.chanType !== ChanType.PROTECTED && channel.hash) {
			throw new ChannelPasswordNotAllowedError();
		}

		await this._prisma.channel.update({
			data: {
				chanType: channel.chanType,
				hash: channel.hash,
				name: channel.name,
			},
			where: {
				id: channel_id,
			},
		});
	}
}
