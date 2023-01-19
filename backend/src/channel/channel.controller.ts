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
	Req,
	// TODO: Uncomment this line when the access token is well considered in the internal API
	UseGuards,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";
import {
	ChannelCreateDto,
	ChannelJoinDto,
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
	ChannelNotOwnedError,
	ChannelPasswordIncorrectError,
	ChannelPasswordMissingError,
	ChannelPasswordNotAllowedError,
	ChannelPasswordUnexpectedError,
	ChannelRelationNotFoundError,
	UnknownError,
} from "src/channel/error";
// TODO: Uncomment this line when the access token is well considered in the internal API
import { JwtGuard } from "src/auth/guards";

// TODO: Uncomment this line when the access token is well considered in the internal API
@UseGuards(JwtGuard)
@Controller("channel")
export class ChannelController {
	private _channel_service: ChannelService;

	constructor() {
		this._channel_service = new ChannelService();
	}

	@Post()
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async create_one(
		@Req() request: { user: { sub: string } },
		@Body() dto: ChannelCreateDto,
	): Promise<Channel> {
		let channel: Channel;

		try {
			channel = await this._channel_service.create_one(
				request.user.sub,
				dto.name,
				dto.is_private,
				dto.password,
			);
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
	async delete_one(
		@Req() request: { user: { sub: string } },
		@Param("id") channel_id: string,
	): Promise<void> {
		try {
			await this._channel_service.delete_one(request.user.sub, channel_id);
		} catch (error) {
			if (
				error instanceof ChannelNotFoundError ||
				error instanceof ChannelNotJoinedError ||
				error instanceof ChannelNotOwnedError
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
	}

	@Get(":id/messages")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async get_ones_messages(
		@Req() request: { user: { sub: string } },
		@Param("id") id: string,
		@Query() dto: ChannelMessageGetDto,
	): Promise<ChannelMessage[]> {
		if (dto.after && dto.before) {
			throw new BadRequestException("Unexpected both `before` and `after` received");
		}

		let messages: ChannelMessage[];

		try {
			messages = await this._channel_service.get_ones_messages(
				request.user.sub,
				id,
				dto.limit,
				dto.before,
				dto.after,
			);
		} catch (error) {
			if (
				error instanceof ChannelNotFoundError ||
				error instanceof ChannelNotJoinedError ||
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
	async join_one(
		@Req() request: { user: { sub: string } },
		@Param("id") id: string,
		@Body() dto: ChannelJoinDto,
	): Promise<Channel> {
		let channel: Channel;

		try {
			channel = await this._channel_service.join_one(
				request.user.sub,
				id,
				dto.password,
				dto.inviting_user_id,
			);
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
	async leave_one(
		@Req() request: { user: { sub: string } },
		@Param("id") id: string,
	): Promise<void> {
		try {
			await this._channel_service.leave_one(id, request.user.sub);
		} catch (error) {
			if (error instanceof ChannelNotFoundError || error instanceof ChannelNotJoinedError) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
		}
	}

	// TODO : Add the access token to the request
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
