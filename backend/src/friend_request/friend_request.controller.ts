import {
	FriendRequestAcceptDto,
	FriendRequestRejectDto,
	FriendRequestSendDto,
} from "src/friend_request/dto";
import {
	FriendRequestAlreadySentError,
	FriendRequestNotFoundError,
	FriendRequestSelfAcceptError,
	FriendRequestSelfRejectError,
	FriendRequestSelfSendError,
} from "src/friend_request/error";
import { FriendRequestService } from "src/friend_request/friend_request.service";
import { Jwt2FAGuard } from "src/auth/guards";
import { UserAlreadyFriendError, UserBlockedError, UserNotFoundError } from "src/user/error";
import {
	BadRequestException,
	Body,
	Controller,
	ForbiddenException,
	InternalServerErrorException,
	Patch,
	Req,
	UseGuards,
	UsePipes,
	ValidationPipe,
	Logger,
} from "@nestjs/common";
import { t_user_auth } from "src/auth/alias";
import { ChatGateway } from "src/chat/chat.gateway";
import { UserService } from "src/user/user.service";

@Controller("friend_request")
@UseGuards(Jwt2FAGuard)
export class FriendRequestController {
	// REMIND: check if passing `_friend_request_service` in readonly keep it working well
	private readonly _chat_gateway: ChatGateway;
	private _friend_request_service: FriendRequestService;
	private readonly _user_service: UserService;
	private readonly _logger: Logger;

	constructor(
		chat_gateway: ChatGateway,
		friend_request_service: FriendRequestService,
		user_service: UserService,
	) {
		this._chat_gateway = chat_gateway;
		this._friend_request_service = friend_request_service;
		this._user_service = user_service;
		this._logger = new Logger(FriendRequestController.name);
	}

	@Patch("accept")
	@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
	async accept_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Body() dto: FriendRequestAcceptDto,
	): Promise<void> {
		try {
			await this._friend_request_service.accept_one(request.user.id, dto.accepted_user_id);
			this._chat_gateway.forward_to_user_socket(
				"user_updated",
				dto.accepted_user_id,
				await this._user_service.get_me(dto.accepted_user_id),
			);
			this._chat_gateway.forward_to_user_socket(
				"user_updated",
				request.user.id,
				await this._user_service.get_me(request.user.id),
			);
		} catch (error) {
			if (
				error instanceof UserNotFoundError ||
				error instanceof FriendRequestSelfAcceptError ||
				error instanceof UserAlreadyFriendError ||
				error instanceof FriendRequestNotFoundError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Patch("reject")
	@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
	async reject_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Body() dto: FriendRequestRejectDto,
	): Promise<void> {
		try {
			await this._friend_request_service.reject_one(request.user.id, dto.rejected_user_id);
			
		} catch (error) {
			if (
				error instanceof UserNotFoundError ||
				error instanceof FriendRequestSelfRejectError ||
				error instanceof FriendRequestNotFoundError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Patch("send")
	@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
	async send_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Body() dto: FriendRequestSendDto,
	): Promise<void> {
		try {
			await this._friend_request_service.send_one(request.user.id, dto.receiving_user_id);
			this._chat_gateway.forward_to_user_socket(
				"user_updated",
				dto.receiving_user_id,
				await this._user_service.get_me(dto.receiving_user_id),
			);
		} catch (error) {
			if (
				error instanceof UserNotFoundError ||
				error instanceof FriendRequestSelfSendError ||
				error instanceof UserAlreadyFriendError ||
				error instanceof FriendRequestAlreadySentError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof UserBlockedError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
}
