import {
	Injectable,
	InternalServerErrorException,
	Logger,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtStrategy } from ".";
import { t_user_auth } from "src/auth/alias";
import { UserNotFoundError } from "src/user/error";
import { UserService } from "src/user/user.service";
import { AuthController } from "./auth.controller";
import { t_payload } from "src/auth/alias";
import { AuthService } from "../auth.service";
import { StateType } from "@prisma/client";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-oauth2";

@Injectable()
export class Jwt2FAStrategy extends PassportStrategy(Strategy, "Jwt2FA") {
	private readonly _user: UserService;
	private readonly _authService: AuthService;
	private readonly _logger = new Logger(AuthController.name);

	public async validate(payload: t_payload): Promise<t_user_auth> {
		this._logger.debug("IN Jwt2FAStrategy validate function");
		try {
			this._logger.debug("GROS CACA");
			const user: t_user_auth = await this._authService.get_user_auth(payload.sub);
			if (!user || user.state != StateType.ACTIVE) throw new UserNotFoundError(payload.sub);
			return user;
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				this._logger.error(error.message);
				throw new UnauthorizedException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
}
