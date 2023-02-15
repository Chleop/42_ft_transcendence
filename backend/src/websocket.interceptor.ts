import { Injectable, CallHandler, ExecutionContext, Logger, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class WebSocketInterceptor implements NestInterceptor {
	private readonly logger: Logger;

	constructor() {
		this.logger = new Logger(WebSocketInterceptor.name);
		console.log("there");
	}

	intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
		this.logger.debug(`Intercepted connection: ${context}`);
		console.log("here");
		return next.handle();
	}
}
