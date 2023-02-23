import { IUserPrivate } from "src/user/interface";
import { UserService } from "src/user/user.service";
import { ForbiddenException, INestApplicationContext, InternalServerErrorException, Logger } from "@nestjs/common";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Server, ServerOptions, Socket } from "socket.io";
import { AuthService } from "./auth/auth.service";
import { StateType } from "@prisma/client";
import { t_user_auth } from "./auth/alias";

/**
 * Allows gateway to have dynamic ports (imported from env)
 * amongst other goodies that I'll add later
 */
export class SocketIOAdapter extends IoAdapter {
	private readonly app: INestApplicationContext;
	private readonly config_service: ConfigService;
	private readonly logger: Logger;

	constructor(app: INestApplicationContext, configService: ConfigService) {
		super(app);
		this.app = app;
		this.config_service = configService;
		this.logger = new Logger(SocketIOAdapter.name);
		this.logger.log("SocketIOAdapter instanciated.")
	}

	/* PUBLIC ================================================================== */

	/**
	 * (from IoAdapter)
	 * Called from main (when SocketIOAdapter instanciated).
	 *
	 * Defines extra indications for the new gateway instanciated,
	 * allows middleware usage.
	 */
	public override createIOServer(port: number, options?: ServerOptions): Server {
		let client_port: number;
		const port_str: string | undefined = this.config_service.get("CLIENT_PORT");

		if (port_str === undefined) {
			this.logger.log("Port not specified in .env file. Using default value.");
			client_port = 8080;
		} else {
			client_port = parseInt(port_str);
		}

		const cors: CorsOptions = {
			origin: [new RegExp(`/^http:\/\/192\.168\.1\.([1-9]|[1-9]\d):${client_port}$/`)],
		};

		const jwt_service: JwtService = this.app.get(JwtService);
		const config_service: ConfigService = this.app.get(ConfigService);
		const user_service: UserService = this.app.get(UserService);
		const auth_service: AuthService = this.app.get(AuthService);

		const server: Server = super.createIOServer(port, { ...options, cors });

		server
			.of("chat")
			.use(websocketMiddleware(jwt_service, config_service, user_service, auth_service));
		server
			.of("game")
			.use(websocketMiddleware(jwt_service, config_service, user_service, auth_service));
		server
			.of("spectate")
			.use(websocketMiddleware(jwt_service, config_service, user_service, auth_service));

		return server;
	}
}

/**
 * Middleware function.
 *
 * Will verify jwt token and decode the jwt.
 */
const websocketMiddleware =
	(
		jwt_service: JwtService,
		config_service: ConfigService,
		user_service: UserService,
		auth_service: AuthService,
	) =>
		async (client: Socket, next: (error?: any) => void) => {
			const token: string | undefined = client.handshake.auth.token;
			const secret: string | undefined = config_service.get<string>("JWT_SECRET");

			if (secret === undefined) throw new Error("JwtSecret undefined"); // should NOT happen

			try {
				if (!token) {
					throw new Error("No token provided");
				}
				console.log("Token ", token)
				const payload: { sub?: string } = jwt_service.verify(token, { secret });
				console.log("PAYLOAD :", payload);
				if (!payload.sub) {
					throw new Error("Invalid token");
				}
				const user: IUserPrivate = await user_service.get_me(payload.sub);
				client.data.user = user;
				const user_auth: t_user_auth = await auth_service.get_user_auth(user.id);
				if (user_auth.state === StateType.DISABLED) {
					throw new Error("Account disabled");
				} else if (user_auth.state === StateType.PENDING) {
					throw new Error("2FA enabled and pending");
				}
				next();
			} catch (e) {
				if (e instanceof Error) {
					console.error(e.message);
					next(new ForbiddenException(e.message));
				}
				console.error(e);
				next(new InternalServerErrorException("Unknown error in SocketIOAdapter"));
			}
		};
