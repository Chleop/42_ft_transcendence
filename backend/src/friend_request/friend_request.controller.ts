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
import { UserAlreadyFriendError, UserNotFoundError } from "src/user/error";
import {
	BadRequestException,
	Body,
	Controller,
	InternalServerErrorException,
	Patch,
	Req,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";

@Controller("friend_request")
@UseGuards(JwtGuard)
export class FriendRequestController {
	private _friend_request_service: FriendRequestService;

	constructor() {
		this._friend_request_service = new FriendRequestService();
	}

	@Patch("accept")
	@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
	async accept_one(
		@Req()
		request: {
			user: {
				sub: string;
			};
		},
		@Body() dto: FriendRequestAcceptDto,
	): Promise<void> {
		try {
			await this._friend_request_service.accept_one(request.user.sub, dto.accepted_user_id);
		} catch (error) {
			if (
				error instanceof UserNotFoundError ||
				error instanceof FriendRequestSelfAcceptError ||
				error instanceof UserAlreadyFriendError ||
				error instanceof FriendRequestNotFoundError
			) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Patch("reject")
	@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
	async reject_one(
		@Req()
		request: {
			user: {
				sub: string;
			};
		},
		@Body() dto: FriendRequestRejectDto,
	): Promise<void> {
		try {
			await this._friend_request_service.reject_one(request.user.sub, dto.rejected_user_id);
		} catch (error) {
			if (
				error instanceof UserNotFoundError ||
				error instanceof FriendRequestSelfRejectError ||
				error instanceof FriendRequestNotFoundError
			) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Patch("send")
	@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
	async send_one(
		@Req()
		request: {
			user: {
				sub: string;
			};
		},
		@Body() dto: FriendRequestSendDto,
	): Promise<void> {
		console.log(request.user.sub);
		try {
			await this._friend_request_service.send_one(request.user.sub, dto.receiving_user_id);
		} catch (error) {
			if (
				error instanceof UserNotFoundError ||
				error instanceof FriendRequestSelfSendError ||
				error instanceof UserAlreadyFriendError ||
				error instanceof FriendRequestAlreadySentError
			) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
}
