import { ChannelCreateDto } from "src/channel/dto";
import { e_status } from "src/channel/enum";
import { PrismaService } from "src/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { ChannelMessage } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";

@Injectable()
export class ChannelService {
	private _prisma: PrismaService;

	constructor(prisma: PrismaService) {
		this._prisma = prisma;
	}

	/**
	 * @brief	Create a new channel in the database.
	 *
	 * @param	dto The dto containing the data to create the channel.
	 *
	 * @return	A promise containing the status of the operation.
	 */
	public async create_one(dto: ChannelCreateDto): Promise<e_status> {
		try {
			// DBG
			console.log("Creating channel...");
			await this._prisma.channel.create({
				data: {
					name: dto.name,
					// TODO: Hash password before storing it
					hash: dto.password,
					chantype: dto.type,
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
						return e_status.ERR_CHANNEL_FIELD_UNAVAILABLE;
				}
				console.log(error.code);
			}

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
	): Promise<{ messages: ChannelMessage[] | null; status: e_status }> {
		type t_fields = {
			messages: ChannelMessage[];
		};

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
