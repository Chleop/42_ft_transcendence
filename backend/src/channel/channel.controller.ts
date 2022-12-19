import { ChannelService } from "src/channel/channel.service";
import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	InternalServerErrorException,
	Param,
	Patch,
	Post,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";
import { ChannelCreateDto } from "src/channel/dto/ChannelCreate.dto";
import { e_status } from "src/channel/enum";
import { ChannelMessage } from "@prisma/client";

@Controller("channel")
export class ChannelController {
	private _channel_service: ChannelService;

	constructor() {
		this._channel_service = new ChannelService();
	}

	@Post()
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async create_one(@Body() dto: ChannelCreateDto): Promise<void> {
		type t_ret = e_status;

		const ret: t_ret = await this._channel_service.create_one(dto);

		switch (ret) {
			case e_status.SUCCESS:
				break;
			case e_status.ERR_CHANNEL_PASSWORD_NOT_ALLOWED:
				throw new BadRequestException("Expected no password");
			case e_status.ERR_CHANNEL_FIELD_UNAVAILABLE:
				throw new ForbiddenException("One of the provided fields is already taken");
			case e_status.ERR_UNKNOWN:
				throw new InternalServerErrorException("An unknown error occured");
		}
	}

	@Delete(":id")
	async delete_one(@Param("id") id: string): Promise<void> {
		type t_ret = e_status;

		const ret: t_ret = await this._channel_service.delete_one(id);

		switch (ret) {
			case e_status.SUCCESS:
				break;
			case e_status.ERR_CHANNEL_NOT_FOUND:
				throw new BadRequestException("No such channel");
			case e_status.ERR_UNKNOWN:
				throw new InternalServerErrorException("An unknown error occured");
		}
	}

	@Get(":id/message")
	async get_ones_messages(@Param("id") id: string): Promise<ChannelMessage[] | null> {
		type t_ret = {
			messages: ChannelMessage[] | null;
			status: e_status;
		};

		const ret: t_ret = await this._channel_service.get_ones_messages(id);

		switch (ret.status) {
			case e_status.SUCCESS:
				break;
			case e_status.ERR_CHANNEL_NOT_FOUND:
				throw new BadRequestException("No such channel");
			case e_status.ERR_UNKNOWN:
				throw new InternalServerErrorException("An unknown error occured");
		}

		return ret.messages;
	}

	@Patch(":id/join")
	async join_one(@Param("id") id: string): Promise<void> {
		// TODO
		console.log(`Someone wants to join the channel ${id}`);
	}

	@Patch(":id/leave")
	async leave_one(@Param("id") id: string): Promise<void> {
		// TODO
		console.log(`Someone wants to leave the channel ${id}`);
	}
}
