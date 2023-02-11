import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { StateType } from "@prisma/client";
import { t_user_auth } from "../alias";

@Injectable()
export class Jwt2FAGuard extends AuthGuard("jwt") {
	override async canActivate(context: ExecutionContext) {
		await super.canActivate(context);
		const request = context.switchToHttp().getRequest();
		return this.validateRequest(request.user);
	}

	private validateRequest(user: t_user_auth): boolean {
		if (user.state === StateType.PENDING)
			throw new UnauthorizedException("User is pending 2FA validation");
		if (user.state != StateType.ACTIVE) throw new UnauthorizedException();
		return true;
	}
}
