import { StateType } from ".prisma/client";
import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { t_user_auth } from "../alias";

@Injectable()
export class JwtPendingStateGuard extends AuthGuard("jwt") {
	override async canActivate(context: ExecutionContext) {
		await super.canActivate(context);
		const request = context.switchToHttp().getRequest();
		return this.validateRequest(request.user);
	}

	private validateRequest(user: t_user_auth): boolean {
		if (user.state !== StateType.PENDING && user.state !== StateType.ACTIVE)
			throw new UnauthorizedException();
		return true;
	}
}
