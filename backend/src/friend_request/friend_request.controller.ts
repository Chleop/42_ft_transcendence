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
import { JwtGuard } from "src/auth/guards";
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
import { t_get_one_fields } from "src/user/alias";

@Controller("friend_request")
@UseGuards(JwtGuard)
export class FriendRequestController {
	private _friend_request_service: FriendRequestService;
	private readonly _logger: Logger;

	constructor() {
		this._friend_request_service = new FriendRequestService();
		this._logger = new Logger(FriendRequestController.name);
	}

	@Patch("accept")
	@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
	async accept_one(
		@Req()
		request: {
			user: t_get_one_fields;
		},
		@Body() dto: FriendRequestAcceptDto,
	): Promise<void> {
		try {
			await this._friend_request_service.accept_one(request.user.id, dto.accepted_user_id);
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
			user: t_get_one_fields;
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
			user: t_get_one_fields;
		},
		@Body() dto: FriendRequestSendDto,
	): Promise<void> {
		try {
			await this._friend_request_service.send_one(request.user.id, dto.receiving_user_id);
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
