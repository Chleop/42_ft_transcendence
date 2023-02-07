import { Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { t_get_me_fields } from "src/user/alias";
import { UserNotFoundError } from "src/user/error";
import { UserService } from "src/user/user.service";

type t_payload = { sub: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
	private _user: UserService;

	constructor(config: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: config.get("JWT_SECRET"),
		});
		this._user = new UserService();
	}

	// Passport invokes the validate() method passing the decoded JSON
	// as its single parameter. Based on the way JWT signing
	// works, we're guaranteed that we're receiving a valid token
	// that we have previously signed and issued to a valid user.
	public async validate(payload: t_payload): Promise<t_get_me_fields> {
		try {
			return await this._user.get_me(payload.sub);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				error.message = `Invalid token (${error.message})`;
				console.log(error.message);
				throw new UnauthorizedException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
}
