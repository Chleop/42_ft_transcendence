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
	 *
	 * @return	A promise containing the messages and the status of the operation.
	 */
	public async get_ones_messages(
		id: string,
		dto: ChannelMessageGetDto,
	): Promise<{ messages: ChannelMessage[] | null; status: e_status }> {
		type t_fields = {
			messages: ChannelMessage[];
		};

		console.log(dto);
		// DBG
		console.log("Searching channel...");
		const channel: t_fields | null = await this._prisma.channel.findUnique({
			select: {
				messages: true,
			},
			where: {
				id: id,
			},
		});

		if (channel === null) {
			// DBG
			console.log("No such channel");
			return { messages: null, status: e_status.ERR_CHANNEL_NOT_FOUND };
		}

		// DBG
		console.log("Channel found");
		return { messages: channel.messages, status: e_status.SUCCESS };
	}
}
