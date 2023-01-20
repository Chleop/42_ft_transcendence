import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

type t_payload = { sub: string | undefined };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
	constructor(config: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: config.get("JWT_SECRET"),
		});
	}

	// Passport invokes the validate() method passing the decoded JSON
	// as its single parameter. Based on the way JWT signing
	// works, we're guaranteed that we're receiving a valid token
	// that we have previously signed and issued to a valid user.
	// As a result of all this, our response to the validate() callback
	// is trivial: we simply return an object containing the userId
	// and username properties. Recall that Passport will build
	// a user object based on the return value of our validate() method,
	// and attach it as a property on the Request object.
	async validate(payload: t_payload): Promise<t_payload> {
		return payload;
	}
}
