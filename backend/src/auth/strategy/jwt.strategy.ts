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
import { t_payload, t_user_auth } from "../alias";
import { AuthService } from "../auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
	public readonly _authService: AuthService;
	public readonly _logger: Logger;

	constructor(config_service: ConfigService, auth_service: AuthService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: config_service.get("JWT_SECRET"),
		});
		this._authService = auth_service;
		this._logger = new Logger(JwtStrategy.name);
	}

	public async validate(payload: t_payload): Promise<t_user_auth> {
		try {
			return await this._authService.get_user_auth(payload.sub);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				this._logger.log(error.message);
				throw new UnauthorizedException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
}
