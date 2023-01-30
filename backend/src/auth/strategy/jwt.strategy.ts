import { Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { t_user_obj } from "src/auth/alias";
import { UserNotFoundError } from "src/user/error";
import { UserService } from "src/user/user.service";
import { t_get_one_fields } from "src/user/alias";

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
	public async validate(payload: t_payload): Promise<t_user_obj> {
		try {
			const user: t_get_one_fields = await this._user.get_one(payload.sub, payload.sub);
			let user_obj: t_user_obj;
			user_obj = {
				id: user.id,
				login: user.login,
				name: user.name,
				email: user.email,
				twoFactAuth: user.twoFactAuth,
			};
			return user_obj;
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				console.log(error.message);
				throw new UnauthorizedException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
}
