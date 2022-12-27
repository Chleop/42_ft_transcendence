import { ChannelCreateDto, ChannelMessageGetDto } from "src/channel/dto";
import { e_status } from "src/channel/enum";
import { PrismaService } from "src/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { ChannelMessage, ChanType } from "@prisma/client";
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
	): Promise<{ messages: ChannelMessage[] | null; status: e_status }> {
		type t_fields = {
			dateTime: Date;
		};

		// DBG
		console.log("Getting messages after a specific message");
		const message: t_fields | null = await this._prisma.channelMessage.findUnique({
			where: {
				id: message_id,
			},
			select: {
				dateTime: true,
			},
		});

		if (!message) {
			// DBG
			console.log("No such reference message");
			return { messages: null, status: e_status.ERR_CHANNEL_MESSAGE_NOT_FOUND };
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

		// DBG
		console.log("Messages found");
		return { messages, status: e_status.SUCCESS };
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
	): Promise<{ messages: ChannelMessage[] | null; status: e_status }> {
		type t_fields = {
			dateTime: Date;
		};

		// DBG
		console.log("Getting messages before a specific message");
		const message: t_fields | null = await this._prisma.channelMessage.findUnique({
			where: {
				id: message_id,
			},
			select: {
				dateTime: true,
			},
		});

		if (!message) {
			// DBG
			console.log("No such reference message");
			return { messages: null, status: e_status.ERR_CHANNEL_MESSAGE_NOT_FOUND };
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

		// DBG
		console.log("Messages found");
		// Get the most ancient messages first
		messages.reverse();
		return { messages, status: e_status.SUCCESS };
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
	): Promise<{ messages: ChannelMessage[] | null; status: e_status }> {
		// DBG
		console.log("Getting most recent messages");
		const messages: ChannelMessage[] | null = await this._prisma.channelMessage.findMany({
			where: {
				channelId: id,
			},
			orderBy: {
				dateTime: "desc",
			},
			take: limit,
		});

		// DBG
		console.log("Messages found");
		// Get the most ancient messages first
		messages.reverse();
		return { messages, status: e_status.SUCCESS };
	}

	/**
	 * @brief	Create a new channel in the database.
	 *
	 * @param	dto The dto containing the data to create the channel.
	 *
	 * @return	A promise containing the status of the operation.
	 */
	public async create_one(dto: ChannelCreateDto): Promise<e_status> {
		let channel_type: ChanType;

		// DBG
		console.log("Determining channel type...");
		if (dto.is_private) {
			if (dto.password) {
				return e_status.ERR_CHANNEL_PASSWORD_NOT_ALLOWED;
			}
			channel_type = ChanType.PRIVATE;
		} else if (dto.password) {
			channel_type = ChanType.PROTECTED;
		} else {
			channel_type = ChanType.PUBLIC;
		}

		try {
			// DBG
			console.log("Creating channel...");
			await this._prisma.channel.create({
				data: {
					name: dto.name,
					hash: dto.password ? await argon2.hash(dto.password) : null,
					chanType: channel_type,
				},
			});
			// DBG
			console.log("Channel created");
		} catch (error) {
			// DBG
			console.log("Error occured while creating channel");
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2002":
						// DBG
						console.log("Field already taken");
						return e_status.ERR_CHANNEL_FIELD_UNAVAILABLE;
				}
				console.log(error.code);
			}
			// DBG
			console.log("Unknown error");
			return e_status.ERR_UNKNOWN;
		}

		return e_status.SUCCESS;
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
			// DBG
			console.log("Deleting channel...");
			await this._prisma.channel.delete({
				where: {
					id: id,
				},
			});
			// DBG
			console.log("Channel deleted");
		} catch (error) {
			// DBG
			console.log("Error occured while deleting channel");
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2025":
						// DBG
						console.log("No such channel");
						return e_status.ERR_CHANNEL_NOT_FOUND;
				}
				// DBG
				console.log(error.code);
			}
			// DBG
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
	): Promise<{ messages: ChannelMessage[] | null; status: e_status }> {
		if (dto.before) {
			return this._get_ones_messages_before_a_specific_message(id, dto.before, dto.limit);
		} else if (dto.after) {
			return this._get_ones_messages_after_a_specific_message(id, dto.after, dto.limit);
		} else {
			return this._get_ones_most_recent_messages(id, dto.limit);
		}
	}
}
