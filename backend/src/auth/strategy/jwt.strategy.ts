import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { UserService } from "src/user/user.service";
import { User } from "@prisma/client";

type t_payload = { 
	sub: string | undefined 
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
	private readonly _user: UserService;

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
	async validate(payload: t_payload): Promise<User> {
		const user = await this._user.get_one(payload.sub);
		return user;
	}
}
