import {
	ChannelCreateDto,
	ChannelJoinDto,
	ChannelLeaveDto,
	ChannelMessageGetDto,
} from "src/channel/dto";
import { e_status } from "src/channel/enum";
import {
	t_return_create_one,
	t_return_get_ones_messages,
	t_return_join_one,
} from "src/channel/alias";
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
	 * @return	A promise containing the messages and the status of the operation.
	 */
	private async _get_ones_messages_after_a_specific_message(
		id: string,
		message_id: string,
		limit: number,
	): Promise<t_return_get_ones_messages> {
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
			console.log("No such reference message");
			return {
				messages: null,
				status: e_status.ERR_CHANNEL_MESSAGE_NOT_FOUND,
			};
		}

		const messages: ChannelMessage[] | null = await this._prisma.channelMessage.findMany({
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
		return {
			messages,
			status: e_status.SUCCESS,
		};
	}

	/**
	 * @brief	Get channel's messages which have been sent before a specific one from the database.
	 *
	 * @param	id The id of the channel to get the messages from.
	 * @param	message_id The id of the message to get the messages before.
	 * @param	limit The maximum number of messages to get.
	 *
	 * @return	A promise containing the messages and the status of the operation.
	 */
	private async _get_ones_messages_before_a_specific_message(
		id: string,
		message_id: string,
		limit: number,
	): Promise<t_return_get_ones_messages> {
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
			console.log("No such reference message");
			return {
				messages: null,
				status: e_status.ERR_CHANNEL_MESSAGE_NOT_FOUND,
			};
		}

		const messages: ChannelMessage[] | null = await this._prisma.channelMessage.findMany({
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
		return {
			messages,
			status: e_status.SUCCESS,
		};
	}

	/**
	 * @brief	Get channel's most recent messages from the database.
	 *
	 * @param	id The id of the channel to get the messages from.
	 * @param	limit The maximum number of messages to get.
	 *
	 * @return	A promise containing the messages and the status of the operation.
	 */
	private async _get_ones_most_recent_messages(
		id: string,
		limit: number,
	): Promise<t_return_get_ones_messages> {
		console.log("Getting most recent messages...");
		const messages: ChannelMessage[] | null = await this._prisma.channelMessage.findMany({
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
		return {
			messages,
			status: e_status.SUCCESS,
		};
	}

	/**
	 * @brief	Create a new channel in the database.
	 *
	 * @param	dto The dto containing the data to create the channel.
	 *
	 * @return	A promise containing the newly created channel's data
	 * 			and the status of the operation.
	 */
	public async create_one(dto: ChannelCreateDto): Promise<t_return_create_one> {
		let type: ChanType;
		let channel: Channel;

		console.log("Determining channel type...");
		if (dto.is_private) {
			if (dto.password) {
				console.log("Channel password not allowed for PRIVATE channels");
				return { channel: null, status: e_status.ERR_CHANNEL_PASSWORD_NOT_ALLOWED };
			}
			console.log("Channel type is PRIVATE");
			type = ChanType.PRIVATE;
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
						console.log("Field already taken");
						return {
							channel: null,
							status: e_status.ERR_CHANNEL_FIELD_UNAVAILABLE,
						};
					case "P2025":
						console.log("No such user");
						return {
							channel: null,
							status: e_status.ERR_CHANNEL_RELATION_NOT_FOUND,
						};
				}
				console.log(`PrismaClientKnownRequestError code was ${error.code}`);
			}

			console.log("Unknown error");
			return {
				channel: null,
				status: e_status.ERR_UNKNOWN,
			};
		}

		channel.hash = null;
		return {
			channel,
			status: e_status.SUCCESS,
		};
	}

	/**
	 * @brief	Delete a channel from the database.
	 *
	 * @param	id The id of the channel to delete.
	 *
	 * @return	A promise containing the status of the operation.
	 */
	public async delete_one(id: string): Promise<e_status> {
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
						console.log("No such channel");
						return e_status.ERR_CHANNEL_NOT_FOUND;
				}
				console.log(`PrismaClientKnownRequestError code was ${error.code}`);
			}

			console.log("Unknown error");
			return e_status.ERR_UNKNOWN;
		}

		return e_status.SUCCESS;
	}

	/**
	 * @brief	Get channel's messages from the database.
	 *
	 * @param	id The id of the channel to get the messages from.
	 * @param	dto The dto containing the data to get the messages.
	 *
	 * @return	A promise containing the messages and the status of the operation.
	 */
	public async get_ones_messages(
		id: string,
		dto: ChannelMessageGetDto,
	): Promise<t_return_get_ones_messages> {
		let ret: t_return_get_ones_messages;

		if (dto.before) {
			ret = await this._get_ones_messages_before_a_specific_message(
				id,
				dto.before,
				dto.limit,
			);
		} else if (dto.after) {
			ret = await this._get_ones_messages_after_a_specific_message(id, dto.after, dto.limit);
		} else {
			ret = await this._get_ones_most_recent_messages(id, dto.limit);
		}

		if (
			ret.messages !== null &&
			!ret.messages.length &&
			!(await this._prisma.channel.count({ where: { id: id } }))
		) {
			ret.status = e_status.ERR_CHANNEL_NOT_FOUND;
		}

		return ret;
	}

	/**
	 * @brief	Make an user join a channel.
	 *
	 * @param	id The id of the channel to join.
	 * @param	dto The dto containing the data to join the channel.
	 *
	 * @return	A promise containing the status of the operation.
	 */
	public async join_one(id: string, dto: ChannelJoinDto): Promise<t_return_join_one> {
		let channel: Channel | null;

		console.log("Searching for the channel to join...");
		channel = await this._prisma.channel.findUnique({
			where: {
				id: id,
			},
		});
		if (!channel) {
			console.log("No such channel");
			return {
				channel: null,
				status: e_status.ERR_CHANNEL_NOT_FOUND,
			};
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
			console.log("Already joined");
			return {
				channel: null,
				status: e_status.ERR_CHANNEL_ALREADY_JOINED,
			};
		}

		console.log("Checking channel type...");
		if (channel.chanType === ChanType.PRIVATE) {
			console.log("Channel is private");
			if (dto.password !== undefined) {
				console.log("Unexpected provided password");
				return {
					channel: null,
					status: e_status.ERR_CHANNEL_PASSWORD_UNEXPECTED,
				};
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
				console.log("Invitation is incorrect");
				return {
					channel: null,
					status: e_status.ERR_CHANNEL_INVITATION_INCORRECT,
				};
			}
		} else if (channel.chanType === ChanType.PROTECTED) {
			console.log("Channel is protected");
			if (dto.inviting_user_id !== undefined) {
				console.log("Unexpected provided invitation");
				return {
					channel: null,
					status: e_status.ERR_CHANNEL_INVITATION_UNEXPECTED,
				};
			}
			console.log("Checking password...");
			if (dto.password === undefined) {
				console.log("No password provided");
				return {
					channel: null,
					status: e_status.ERR_CHANNEL_PASSWORD_MISSING,
				};
			} else if (!(await argon2.verify(<string>channel.hash, dto.password))) {
				console.log("Provided password is incorrect");
				return {
					channel: null,
					status: e_status.ERR_CHANNEL_PASSWORD_INCORRECT,
				};
			}
		} else {
			console.log("Channel is public");
			if (dto.password !== undefined) {
				console.log("Unexpected provided password");
				return {
					channel: null,
					status: e_status.ERR_CHANNEL_PASSWORD_UNEXPECTED,
				};
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
		return {
			channel,
			status: e_status.SUCCESS,
		};
	}

	/**
	 * @brief	Make an user leave a channel.
	 *
	 * @param	id The id of the channel to leave.
	 * @param	dto The dto containing the data to leave the channel.
	 *
	 * @return	A promise containing the status of the operation.
	 */
	public async leave_one(id: string, dto: ChannelLeaveDto): Promise<e_status> {
		console.log("Searching for the channel to leave...");
		const channel: Channel | null = await this._prisma.channel.findUnique({
			where: {
				id: id,
			},
		});

		if (!channel) {
			console.log("No such channel");
			return e_status.ERR_CHANNEL_NOT_FOUND;
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
			console.log("Not joined");
			return e_status.ERR_CHANNEL_NOT_JOINED;
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

		return e_status.SUCCESS;
	}
}
