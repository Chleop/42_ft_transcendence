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
	Query,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";
import {
	ChannelCreateDto,
	ChannelJoinDto,
	ChannelLeaveDto,
	ChannelMessageGetDto,
} from "src/channel/dto";
import { e_status } from "src/channel/enum";
import { t_create_one_return } from "src/channel/alias";
import { Channel, ChannelMessage } from "@prisma/client";

@Controller("channel")
export class ChannelController {
	private _channel_service: ChannelService;

	constructor() {
		this._channel_service = new ChannelService();
	}

	@Post()
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async create_one(@Body() dto: ChannelCreateDto): Promise<Channel | null> {
		const ret: t_create_one_return = await this._channel_service.create_one(dto);

		switch (ret.status) {
			case e_status.SUCCESS:
				break;
			case e_status.ERR_CHANNEL_PASSWORD_NOT_ALLOWED:
				throw new BadRequestException("Expected no password");
			case e_status.ERR_CHANNEL_FIELD_UNAVAILABLE:
				throw new ForbiddenException("One of the provided fields is already taken");
			case e_status.ERR_UNKNOWN:
				throw new InternalServerErrorException("An unknown error occured");
		}

		return ret.channel;
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
			case e_status.ERR_CHANNEL_NOT_EMPTY:
				throw new ForbiddenException("Channel is not empty");
			case e_status.ERR_UNKNOWN:
				throw new InternalServerErrorException("An unknown error occured");
		}
	}

	@Get(":id/message")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async get_ones_messages(
		@Param("id") id: string,
		@Query() dto: ChannelMessageGetDto,
	): Promise<ChannelMessage[] | null> {
		type t_ret = {
			messages: ChannelMessage[] | null;
			status: e_status;
		};

		if (dto.after && dto.before) {
			throw new BadRequestException("Unexpected both `before` and `after` received");
		}

		const ret: t_ret = await this._channel_service.get_ones_messages(id, dto);

		switch (ret.status) {
			case e_status.SUCCESS:
				break;
			case e_status.ERR_CHANNEL_NOT_FOUND:
				throw new BadRequestException("No such channel");
			case e_status.ERR_CHANNEL_MESSAGE_NOT_FOUND:
				throw new BadRequestException("No such message");
			case e_status.ERR_UNKNOWN:
				throw new InternalServerErrorException("An unknown error occured");
		}

		return ret.messages;
	}

	// REMIND: Update the return type later, to return the joined channel's data
	@Patch(":id/join")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async join_one(@Param("id") id: string, @Body() dto: ChannelJoinDto): Promise<Channel | null> {
		type t_ret = {
			channel: Channel | null;
			status: e_status;
		};

		const ret: t_ret = await this._channel_service.join_one(id, dto);

		switch (ret.status) {
			case e_status.SUCCESS:
				break;
			case e_status.ERR_CHANNEL_NOT_FOUND:
				throw new BadRequestException("No such channel");
			case e_status.ERR_CHANNEL_ALREADY_JOINED:
				throw new BadRequestException("User already joined");
			case e_status.ERR_CHANNEL_PRIVATE:
				throw new BadRequestException("Channel is private");
			case e_status.ERR_CHANNEL_PASSWORD_MISSING:
				throw new BadRequestException("Expected a password");
			case e_status.ERR_CHANNEL_PASSWORD_INCORRECT:
				throw new BadRequestException("Incorrect password");
			case e_status.ERR_CHANNEL_PASSWORD_UNEXPECTED:
				throw new BadRequestException("Expected no password");
			case e_status.ERR_UNKNOWN:
				throw new InternalServerErrorException("An unknown error occured");
		}

		return ret.channel;
	}

	@Patch(":id/leave")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async leave_one(@Param("id") id: string, @Body() dto: ChannelLeaveDto): Promise<void> {
		type t_ret = e_status;

		const ret: t_ret = await this._channel_service.leave_one(id, dto);

		switch (ret) {
			case e_status.SUCCESS:
				break;
			case e_status.ERR_CHANNEL_NOT_FOUND:
				throw new BadRequestException("No such channel");
			case e_status.ERR_CHANNEL_NOT_JOINED:
				throw new BadRequestException("User not joined");
			case e_status.ERR_UNKNOWN:
				throw new InternalServerErrorException("An unknown error occured");
		}
	}
}
