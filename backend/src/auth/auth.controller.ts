import {
	Controller,
	Get,
	ForbiddenException,
	InternalServerErrorException,
	UseGuards,
	Req,
	Res,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { FtOauthGuard } from "./guards";

type t_access_token = { access_token: string | undefined };

@Controller("auth")
export class AuthController {
	private _authService: AuthService;

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
			token = await this._authService.createAccessToken(request.user.login);
			response.cookie("access_token", token.access_token); // REMIND try with httpOnly
			response.redirect("http://localhost/");
		} catch (error) {
			console.info(error);
			if (error instanceof PrismaClientKnownRequestError) {
				if (error.code == "P2002")
					throw new ForbiddenException("One of the provided fields is already taken");
			} else throw new InternalServerErrorException("An unknown error occured");
		}
	}
}
