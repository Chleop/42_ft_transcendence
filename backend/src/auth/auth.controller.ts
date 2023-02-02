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
import { UserService } from "src/user/user.service";
import { AuthService } from "./auth.service";
import { FtOauthGuard, JwtGuard } from "./guards";
import { ExpiredCode, InvalidCode } from "./error";
import { t_access_token, t_user_auth } from "./alias";

@Controller("auth")
export class AuthController {
	private _authService: AuthService;
	private readonly _user: UserService;
	private readonly _logger = new Logger(AuthController.name);

	constructor() {
		this._authService = new AuthService();
		this._user = new UserService();
	}

	@Get("42/login")
	@UseGuards(FtOauthGuard)
	login() {
		this._logger.debug("IN CONTROLLER login");
		//
	}

	@Get("42/callback")
	@UseGuards(FtOauthGuard)
	async signin(@Req() request: any, @Res() response: Response) {
		this._logger.debug("IN CONTROLLER signin");
		try {
			const token: t_access_token = await this._authService.create_access_token(
				request.user.login,
			);
			const user_id: string = await this._user.get_ones_id_by_login(request.user.login);
			const user: t_user_auth = await this._authService.get_user_auth(user_id);
			response.cookie("access_token", token.access_token); // REMIND try with httpOnly
			if (user.twoFactAuth === true) {
				await this._authService.activate_2FA(user_id);
				response.redirect("http://localhost:3000/api/auth/42/2FARedirect");
			} else response.redirect("http://localhost:3000/");
		} catch (error) {
			this._logger.error(error);
			if (error instanceof PrismaClientKnownRequestError) {
				if (error.code == "P2002")
					throw new ForbiddenException(
						"One of the provided fields is already taken (unique constraint)",
					);
			} else throw new InternalServerErrorException("An unknown error occured");
		}
	}

	@Get("42/2FARedirect")
	async two_factor_authentication_redirect(): Promise<void> {}

	@UseGuards(JwtGuard)
	@Get("42/2FAActivate")
	async initiate_2FA(@Req() req: any, @Body("email") email: string): Promise<void> {
		this._logger.debug("IN CONTROLLER initiate_2FA");
		try {
			await this._authService.initiate_2FA(req.user.id, email);
		} catch (error) {
			this._logger.error(error);
			if (error instanceof PrismaClientKnownRequestError) {
				if (error.code == "P2002")
					throw new ForbiddenException(
						"One of the provided fields is already taken (unique constraint)",
					);
			} else throw new InternalServerErrorException("An unknown error occured");
		}
	}

	@UseGuards(JwtGuard)
	@Post("42/2FAValidate")
	async validate_2FA(@Req() req: any, @Body("code") code: string): Promise<void> {
		this._logger.debug("IN CONTROLLER validate_2FA");
		try {
			await this._authService.validate_2FA(req.user.id, code);
		} catch (error) {
			this._logger.error(error);
			if (error instanceof PrismaClientKnownRequestError) {
				if (error.code == "P2002")
					throw new ForbiddenException(
						"One of the provided fields is already taken (unique constraint)",
					);
			} else if (error instanceof InvalidCode || error instanceof ExpiredCode)
				throw new BadRequestException(error.message);
			else throw new InternalServerErrorException("An unknown error occured");
		}
	}
}
