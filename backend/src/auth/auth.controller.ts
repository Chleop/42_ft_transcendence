import {
	Controller,
	Get,
	ForbiddenException,
	InternalServerErrorException,
	UseGuards,
	Req,
	Post,
	Body,
	Res,
	Logger,
	BadRequestException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { FtOauthGuard, Jwt2FAGuard, JwtPendingStateGuard } from "./guards";
import { CodeIsNotSet, ExpiredCode, InvalidCode, PendingUser } from "./error";
import { CodeDto, EmailDto } from "./dto";

@Controller("auth")
export class AuthController {
	private _authService: AuthService;
	private readonly _logger: Logger;

	constructor(auth_service: AuthService) {
		this._authService = auth_service;
		this._logger = new Logger(AuthController.name);
	}

	@Get("42/login")
	@UseGuards(FtOauthGuard)
	login() {
		// REMIND: What is this for?
	}

	@Get("42/callback")
	@UseGuards(FtOauthGuard)
	async signin(@Req() request: any, @Res() response: Response): Promise<void> {
		try {
			await this._authService.signin(request.user.login, response);
		} catch (error) {
			this._logger.error(`signin`);
			if (error instanceof PendingUser) {
				return;
			}
			if (error instanceof PrismaClientKnownRequestError) {
				if (error.code == "P2002")
					throw new ForbiddenException(
						"One of the provided fields is already taken (unique constraint)",
					);
			}
			this._logger.error("Unexpected error: " + error.message || "non standard error");
			throw new InternalServerErrorException();
		}
	}

	@Get("42/2FARedirect")
	async two_factor_authentication_redirect(): Promise<void> {}

	@UseGuards(JwtPendingStateGuard)
	@Post("42/2FAActivate")
	async activate_2FA(@Req() req: any, @Body() dto: EmailDto): Promise<void> {
		try {
			await this._authService.activate_2FA(req.user.id, dto.email);
		} catch (error) {
			this._logger.error(`activate thingy`);
			this._logger.error("Unexpected error: " + error.message || "non standard error");
			throw new InternalServerErrorException();
		}
	}

	@UseGuards(Jwt2FAGuard)
	@Post("42/2FADeactivate")
	async deactivate_2FA(@Req() req: any): Promise<void> {
		try {
			await this._authService.deactivate_2FA(req.user.id);
		} catch (error) {
			this._logger.error(`desac thingy`);
			this._logger.error("Unexpected error: " + error.message || "non standard error");
			throw new InternalServerErrorException();
		}
	}

	@UseGuards(JwtPendingStateGuard)
	@Post("42/2FAValidate")
	async validate_2FA(@Req() req: any, @Body() dto: CodeDto): Promise<void> {
		try {
			await this._authService.validate_2FA(req.user.id, dto.code);
		} catch (error) {
			this._logger.error(`validate thingy`);
			if (error instanceof CodeIsNotSet) {
				throw new ForbiddenException(error.message);
			}
			if (error instanceof InvalidCode || error instanceof ExpiredCode) {
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unexpected error: " + error.message || "non standard error");
			throw new InternalServerErrorException();
		}
	}
}
