import {
	Injectable,
	InternalServerErrorException,
	Logger,
	UnauthorizedException,
} from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { UserNotFoundError } from "src/user/error";
import { AuthController } from "../auth.controller";
import { t_payload, t_user_auth } from "../alias";
import { AuthService } from "../auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
	public readonly _logger: Logger;
	public readonly _authService: AuthService;

	constructor() {
		const _config = new ConfigService();
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: _config.get("JWT_SECRET"),
		});
		this._logger = new Logger(AuthController.name);
		this._authService = new AuthService();
	}

	public async validate(payload: t_payload): Promise<any> {
		try {
			const user: t_user_auth = await this._authService.get_user_auth(payload.sub);
			return user;
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				this._logger.error(error.message);
				throw new UnauthorizedException(error.message);
			}
			this._logger.error("Unknown error type, this should nt happen");
			throw new InternalServerErrorException();
		}
	}
}
