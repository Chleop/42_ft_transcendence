import {
	ChannelCreateDto,
	ChannelJoinDto,
	ChannelLeaveDto,
	ChannelMessageGetDto,
} from "src/channel/dto";
import {
	ChannelAlreadyJoinedError,
	ChannelFieldUnavailableError,
	ChannelInvitationIncorrectError,
	ChannelInvitationUnexpectedError,
	ChannelMessageNotFoundError,
	ChannelNotFoundError,
	ChannelNotJoinedError,
	ChannelPasswordIncorrectError,
	ChannelPasswordMissingError,
	ChannelPasswordNotAllowedError,
	ChannelPasswordUnexpectedError,
	ChannelRelationNotFoundError,
	UnknownError,
} from "src/channel/error";
import { PrismaService } from "src/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { Channel, ChannelMessage, ChanType } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import * as argon2 from "argon2";

@Injectable()
export class ChannelService {
	private _prisma: PrismaService;

	constructor() {
		this._prisma = new PrismaService();
	}

	/**
	 * @brief	Get channel's messages which have been sent after a specific one from the database.
	 *
	 * @param	id The id of the channel to get the messages from.
	 * @param	message_id The id of the message to get the messages after.
	 * @param	limit The maximum number of messages to get.
	 *
	 * @potential_throws
	 * 	- ChannelMessageNotFoundError
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

		console.log("Getting messages after a specific message...");
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

		console.log("Messages found");
		return messages;
	}

	/**
	 * @brief	Get channel's messages which have been sent before a specific one from the database.
	 *
	 * @param	id The id of the channel to get the messages from.
	 * @param	message_id The id of the message to get the messages before.
	 * @param	limit The maximum number of messages to get.
	 *
	 * @potential_throws
	 * 	- ChannelMessageNotFoundError
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

		console.log("Getting messages before a specific message...");
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

		console.log("Messages found");
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
		console.log("Getting most recent messages...");
		const messages: ChannelMessage[] = await this._prisma.channelMessage.findMany({
			where: {
				channelId: id,
			},
			orderBy: {
				dateTime: "desc",
			},
			take: limit,
		});

		console.log("Messages found");
		// Get the most ancient messages first
		messages.reverse();
		return messages;
	}

	/**
	 * @brief	Create a new channel in the database.
	 *
	 * @param	dto The dto containing the data to create the channel.
	 *
	 * @potential_throws
	 * - ChannelPasswordNotAllowedError
	 * - ChannelFieldUnavailableError
	 * - ChannelRelationNotFoundError
	 * - UnknownError
	 *
	 * @return	A promise containing the created channel's data.
	 */
	public async create_one(dto: ChannelCreateDto): Promise<Channel> {
		let type: ChanType;
		let channel: Channel;

		console.log("Determining channel type...");
		if (dto.is_private) {
			console.log("Channel type is PRIVATE");
			type = ChanType.PRIVATE;
			if (dto.password) {
				throw new ChannelPasswordNotAllowedError();
			}
		} else if (dto.password) {
			console.log("Channel type is PROTECTED");
			type = ChanType.PROTECTED;
		} else {
			console.log("Channel type is PUBLIC");
			type = ChanType.PUBLIC;
		}

		try {
			console.log("Creating channel...");
			channel = await this._prisma.channel.create({
				data: {
					name: dto.name,
					hash: dto.password ? await argon2.hash(dto.password) : null,
					chanType: type,
					members: {
						connect: {
							id: dto.user_id,
						},
					},
					operators: {
						connect: {
							id: dto.user_id,
						},
					},
				},
			});
			console.log("Channel created");
		} catch (error) {
			console.log("Error occured while creating channel");
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2002":
						throw new ChannelFieldUnavailableError("name");
					case "P2025":
						throw new ChannelRelationNotFoundError("user");
				}
				console.log(`PrismaClientKnownRequestError code was ${error.code}`);
			}

			throw new UnknownError();
		}

		channel.hash = null;
		return channel;
	}

	/**
	 * @brief	Delete a channel from the database.
	 *
	 * @param	id The id of the channel to delete.
	 *
	 * @potential_throws
	 * - ChannelNotFoundError
	 * - UnknownError
	 *
	 * @return	An empty promise.
	 */
	public async delete_one(id: string): Promise<void> {
		try {
			console.log("Deleting channel's messages...");
			await this._prisma.channelMessage.deleteMany({
				where: {
					channelId: id,
				},
			});
			console.log("Channel's messages deleted");

			console.log("Deleting channel...");
			await this._prisma.channel.delete({
				where: {
					id: id,
				},
			});
			console.log("Channel deleted");
		} catch (error) {
			console.log("Error occured while deleting channel");
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2025":
						throw new ChannelNotFoundError(id);
				}
				console.log(`PrismaClientKnownRequestError code was ${error.code}`);
			}

			throw new UnknownError();
		}
	}

	/**
	 * @brief	Get channel's messages from the database.
	 *
	 * @param	id The id of the channel to get the messages from.
	 * @param	dto The dto containing the data to get the messages.
	 *
	 * @potential_throws
	 * - ChannelMessageNotFoundError
	 * - ChannelNotFoundError
	 *
	 * @return	A promise containing the wanted messages.
	 */
	public async get_ones_messages(
		id: string,
		dto: ChannelMessageGetDto,
	): Promise<ChannelMessage[]> {
		let messages: ChannelMessage[];

		if (dto.before) {
			messages = await this._get_ones_messages_before_a_specific_message(
				id,
				dto.before,
				dto.limit,
			);
		} else if (dto.after) {
			messages = await this._get_ones_messages_after_a_specific_message(
				id,
				dto.after,
				dto.limit,
			);
		} else {
			messages = await this._get_ones_most_recent_messages(id, dto.limit);
		}

		if (!messages.length && !(await this._prisma.channel.count({ where: { id: id } }))) {
			throw new ChannelNotFoundError(id);
		}

		return messages;
	}

	/**
	 * @brief	Make an user join a channel.
	 *
	 * @param	id The id of the channel to join.
	 * @param	dto The dto containing the data to join the channel.
	 *
	 * @potential_throws
	 * - ChannelNotFoundError
	 * - ChannelAlreadyJoinedError
	 * - ChannelPasswordUnexpectedError
	 * - ChannelInvitationIncorrectError
	 * - ChannelInvitationUnexpectedError
	 * - ChannelPasswordMissingError
	 * - ChannelPasswordIncorrectError
	 *
	 * @return	A promise containing the joined channel's data.
	 */
	public async join_one(id: string, dto: ChannelJoinDto): Promise<Channel> {
		let channel: Channel | null;

		console.log("Searching for the channel to join...");
		channel = await this._prisma.channel.findUnique({
			where: {
				id: id,
			},
		});
		if (!channel) {
			throw new ChannelNotFoundError(id);
		}

		console.log("Checking for already joined...");
		if (
			await this._prisma.channel.count({
				where: {
					id: id,
					members: {
						some: { id: dto.joining_user_id },
					},
				},
			})
		) {
			throw new ChannelAlreadyJoinedError(id);
		}

		console.log("Checking channel type...");
		if (channel.chanType === ChanType.PRIVATE) {
			console.log("Channel is private");
			if (dto.password !== undefined) {
				throw new ChannelPasswordUnexpectedError();
			}
			console.log("Checking invitation...");
			if (
				dto.inviting_user_id === undefined ||
				!(await this._prisma.channel.count({
					where: {
						id: id,
						members: {
							some: { id: dto.inviting_user_id },
						},
					},
				}))
			) {
				throw new ChannelInvitationIncorrectError();
			}
		} else if (channel.chanType === ChanType.PROTECTED) {
			console.log("Channel is protected");
			if (dto.inviting_user_id !== undefined) {
				throw new ChannelInvitationUnexpectedError();
			}
			console.log("Checking password...");
			if (dto.password === undefined) {
				throw new ChannelPasswordMissingError();
			} else if (!(await argon2.verify(<string>channel.hash, dto.password))) {
				throw new ChannelPasswordIncorrectError();
			}
		} else {
			console.log("Channel is public");
			if (dto.password !== undefined) {
				throw new ChannelPasswordUnexpectedError();
			}
		}

		console.log("Joining channel...");
		channel = await this._prisma.channel.update({
			where: {
				id: id,
			},
			data: {
				members: {
					connect: {
						id: dto.joining_user_id,
					},
				},
			},
		});
		console.log("Channel joined");

		channel.hash = null;
		return channel;
	}

	/**
	 * @brief	Make an user leave a channel.
	 *
	 * @param	id The id of the channel to leave.
	 * @param	dto The dto containing the data to leave the channel.
	 *
	 * @potential_throws
	 * - ChannelNotFoundError
	 * - ChannelNotJoinedError
	 *
	 * @return	An empty promise.
	 */
	public async leave_one(id: string, dto: ChannelLeaveDto): Promise<void> {
		console.log("Searching for the channel to leave...");
		const channel: Channel | null = await this._prisma.channel.findUnique({
			where: {
				id: id,
			},
		});

		if (!channel) {
			throw new ChannelNotFoundError(id);
		}

		console.log("Checking for not joined...");
		if (
			!(await this._prisma.channel.count({
				where: {
					id: id,
					members: {
						some: { id: dto.user_id },
					},
				},
			}))
		) {
			throw new ChannelNotJoinedError(id);
		}

		console.log("Leaving channel...");
		await this._prisma.channel.update({
			where: {
				id: id,
			},
			data: {
				members: {
					disconnect: {
						id: dto.user_id,
					},
				},
			},
		});
		console.log("Channel left");
	}
}
