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
	UseGuards,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";
import {
	ChannelCreateDto,
	ChannelJoinDto,
	ChannelLeaveDto,
	ChannelMessageGetDto,
	ChannelMessageSendDto,
} from "src/channel/dto";
import { Channel, ChannelMessage } from "@prisma/client";
import {
	ChannelAlreadyJoinedError,
	ChannelFieldUnavailableError,
	ChannelInvitationIncorrectError,
	ChannelInvitationUnexpectedError,
	ChannelMessageNotFoundError,
	ChannelMessageTooLongError,
	ChannelNotFoundError,
	ChannelNotJoinedError,
	ChannelPasswordIncorrectError,
	ChannelPasswordMissingError,
	ChannelPasswordNotAllowedError,
	ChannelPasswordUnexpectedError,
	ChannelRelationNotFoundError,
	UnknownError,
} from "src/channel/error";
import { JwtGuard } from "src/auth/guards";

@UseGuards(JwtGuard)
@Controller("channel")
export class ChannelController {
	private _channel_service: ChannelService;

	constructor() {
		this._channel_service = new ChannelService();
	}

	@Post()
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async create_one(@Body() dto: ChannelCreateDto): Promise<Channel> {
		let channel: Channel;

		try {
			channel = await this._channel_service.create_one(dto);
		} catch (error) {
			if (
				error instanceof ChannelPasswordNotAllowedError ||
				error instanceof ChannelRelationNotFoundError
			) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof ChannelFieldUnavailableError) {
				console.log(error.message);
				throw new ForbiddenException(error.message);
			}
			if (error instanceof UnknownError) {
				console.log(error.message);
				throw new InternalServerErrorException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}

		return channel;
	}

	@Delete(":id")
	async delete_one(@Param("id") id: string): Promise<void> {
		try {
			await this._channel_service.delete_one(id);
		} catch (error) {
			if (error instanceof ChannelNotFoundError) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof UnknownError) {
				console.log(error.message);
				throw new InternalServerErrorException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Get(":id/messages")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async get_ones_messages(
		@Param("id") id: string,
		@Query() dto: ChannelMessageGetDto,
	): Promise<ChannelMessage[]> {
		if (dto.after && dto.before) {
			throw new BadRequestException("Unexpected both `before` and `after` received");
		}

		let messages: ChannelMessage[];

		try {
			messages = await this._channel_service.get_ones_messages(id, dto);
		} catch (error) {
			if (
				error instanceof ChannelNotFoundError ||
				error instanceof ChannelMessageNotFoundError
			) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}

		return messages;
	}

	@Patch(":id/join")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async join_one(@Param("id") id: string, @Body() dto: ChannelJoinDto): Promise<Channel> {
		let channel: Channel;

		try {
			channel = await this._channel_service.join_one(id, dto);
		} catch (error) {
			if (
				error instanceof ChannelNotFoundError ||
				error instanceof ChannelAlreadyJoinedError ||
				error instanceof ChannelPasswordUnexpectedError ||
				error instanceof ChannelInvitationIncorrectError ||
				error instanceof ChannelInvitationUnexpectedError ||
				error instanceof ChannelPasswordMissingError ||
				error instanceof ChannelPasswordIncorrectError ||
				error instanceof ChannelRelationNotFoundError
			) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof UnknownError) {
				console.log(error.message);
				throw new InternalServerErrorException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}

		return channel;
	}

	@Patch(":id/leave")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async leave_one(@Param("id") id: string, @Body() dto: ChannelLeaveDto): Promise<void> {
		try {
			await this._channel_service.leave_one(id, dto.user_id);
		} catch (error) {
			if (error instanceof ChannelNotFoundError || error instanceof ChannelNotJoinedError) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
		}
	}

	@Post(":id/message")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async send_message_to_one(
		@Param("id") id: string,
		@Body() dto: ChannelMessageSendDto,
	): Promise<void> {
		try {
			await this._channel_service.send_message_to_one(id, dto.user_id, dto.message);
		} catch (error) {
			if (error instanceof ChannelNotFoundError || error instanceof ChannelNotJoinedError) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof ChannelMessageTooLongError) {
				console.log(error.message);
				throw new ForbiddenException(error.message);
			}
		}
	}
}
