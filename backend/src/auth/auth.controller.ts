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
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { FtOauthGuard, JwtGuard } from "./guards";

type t_access_token = { access_token: string | undefined };

@Controller("auth")
export class AuthController {
	private _authService: AuthService;
	public _email_to_be_validated: string;

	constructor(authService: AuthService) {
		this._authService = authService;
	}

	@Get("42/login")
	@UseGuards(FtOauthGuard)
	login() {
		//
	}

	@Get("42/callback")
	@UseGuards(FtOauthGuard)
	async signin(@Req() request: any, @Res() response: Response) {
		let token: t_access_token;
		try {
			if (request.user.twoFactAuth === true) {
				this._authService.send_confirmation_email(this._email_to_be_validated);
			}
			token = await this._authService.create_access_token(request.user.login);
			response.cookie("access_token", token.access_token); // REMIND try with httpOnly
			response.redirect("http://localhost:3000/");
		} catch (error) {
			console.info(error);
			if (error instanceof PrismaClientKnownRequestError) {
				if (error.code == "P2002")
					throw new ForbiddenException("One of the provided fields is already taken");
			} else throw new InternalServerErrorException("An unknown error occured");
		}
	}

	@UseGuards(JwtGuard)
	@Get("42/2FAActivate")
	async activateTwoFactAuth(@Body("email") email: string) {
		this._email_to_be_validated = email;
		this._authService.send_confirmation_email(this._email_to_be_validated);
		// TODO : retirer le return ok
		return "ok!";
	}

	@Post("42/2FAValidate")
	@UseGuards(JwtGuard)
	async validateTwoFactAuth(@Req() request: any, @Body("code") code: string) {
		this._authService.confirm_email(
			request,
			request.user.id,
			this._email_to_be_validated,
			Number(code),
		);
		// TODO : retirer le return ok
		return "ok!";
	}
}
