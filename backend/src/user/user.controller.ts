import { t_relations } from "src/user/alias";
import { UserUpdateDto } from "src/user/dto";
import {
	UnknownError,
	UserFieldUnaivalableError,
	UserNotFoundError,
	UserNotLinkedError,
} from "src/user/error";
import { UserService } from "src/user/user.service";
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
	Put,
	Req,
	StreamableFile,
	UploadedFile,
	UseGuards,
	UseInterceptors,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { User } from "@prisma/client";
import { JwtGuard } from "src/auth/guards";

@Controller("user")
export class UserController {
	private _user_service: UserService;

	constructor() {
		this._user_service = new UserService();
	}

	@Delete("@me")
	@UseGuards(JwtGuard)
	async disable_me(
		@Req()
		request: {
			user: {
				sub: string;
			};
		},
	): Promise<void> {
		try {
			await this._user_service.disable_one(request.user.sub);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
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

	@Get("@me")
	@UseGuards(JwtGuard)
	async get_me(
		@Req()
		request: {
			user: {
				sub: string;
			};
		},
	): Promise<User & t_relations> {
		let user: User & t_relations;

		try {
			user = await this._user_service.get_one(request.user.sub, request.user.sub);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}

		return user;
	}

	@Get(":id")
	@UseGuards(JwtGuard)
	async get_one(
		@Req()
		request: {
			user: {
				sub: string;
			};
		},
		@Param("id") id: string,
	): Promise<User & t_relations> {
		let user: User & t_relations;

		try {
			user = await this._user_service.get_one(request.user.sub, id);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof UserNotLinkedError) {
				console.log(error.message);
				throw new ForbiddenException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}

		return user;
	}

	@Get(":id/avatar")
	@UseGuards(JwtGuard)
	async get_ones_avatar(
		@Req()
		request: {
			user: {
				sub: string;
			};
		},
		@Param("id") id: string,
	): Promise<StreamableFile> {
		let sfile: StreamableFile;

		try {
			sfile = await this._user_service.get_ones_avatar(request.user.sub, id);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof UserNotLinkedError) {
				console.log(error.message);
				throw new ForbiddenException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}

		return sfile;
	}

	@Patch("@me")
	@UseGuards(JwtGuard)
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async update_me(
		@Req()
		request: {
			user: {
				sub: string;
			};
		},
		@Body() dto: UserUpdateDto,
	): Promise<void> {
		try {
			await this._user_service.update_one(request.user.sub, dto);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof UserFieldUnaivalableError) {
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
	}

	@Put("@me/avatar")
	@UseGuards(JwtGuard)
	@UseInterceptors(FileInterceptor("file"))
	async update_ones_avatar(
		@Req()
		request: {
			user: {
				sub: string;
			};
		},
		@UploadedFile() file: Express.Multer.File,
	): Promise<void> {
		try {
			await this._user_service.update_ones_avatar(request.user.sub, file);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
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
}
