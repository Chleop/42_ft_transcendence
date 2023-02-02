import { t_get_one_fields } from "src/user/alias";
import { UserService } from "src/user/user.service";
import { ForbiddenException, INestApplicationContext, Logger } from "@nestjs/common";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Server, ServerOptions, Socket } from "socket.io";

type UserData = t_get_one_fields;

/**
 * Allows gateway to have dynamic ports (imported from env)
 * amongst other goodies that I'll add later
 */
export class SocketIOAdapter extends IoAdapter {
	private readonly app: INestApplicationContext;
	private readonly config_service: ConfigService;
	private readonly _logger: Logger;

	constructor(app: INestApplicationContext, configService: ConfigService) {
		super(app);
		this.app = app;
		this.config_service = configService;
		this._logger = new Logger(SocketIOAdapter.name);
		this._logger.debug("Adapter created");
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
			client_port = 3000;
		} else {
			client_port = parseInt(port_str);
		}

		const cors: CorsOptions = {
			origin: [
				`http://localhost:${client_port}`,
				new RegExp(`/^http:\/\/192\.168\.1\.([1-9]|[1-9]\d):${client_port}$/`),
			],
		};

		const jwt_service: JwtService = this.app.get(JwtService);
		const config_service: ConfigService = this.app.get(ConfigService);
		const user_service: UserService = this.app.get(UserService);

		const server: Server = super.createIOServer(port, { ...options, cors });

		server.of("chat").use(websocketMiddleware(jwt_service, config_service, user_service));
		server.of("game").use(websocketMiddleware(jwt_service, config_service, user_service));
		server.of("spectate").use(websocketMiddleware(jwt_service, config_service, user_service));

		return server;
	}
}

/**
 * Middleware function.
 *
 * Will verify jwt token and decode the jwt.
 */
const websocketMiddleware =
	(jwt_service: JwtService, config_service: ConfigService, user_service: UserService) =>
	async (client: Socket, next: (error?: any) => void) => {
		const token: string | undefined = client.handshake.auth.token;
		const secret: string | undefined = config_service.get<string>("JWT_SECRET");

		if (secret === undefined) throw new Error("JwtSecret undefined"); // should NOT happen

		try {
			if (token === undefined) {
				throw new Error("No token provided");
			}
			const payload: { sub: string } = jwt_service.verify(token, { secret });
			const user: UserData = await user_service.get_one(payload.sub, payload.sub);
			// TODO: remove this assignation, it's useless
			// as far as the user id is already contained in the retreived user
			client.handshake.auth.token = payload.sub;
			client.data.user = user;
			next();
		} catch (e) {
			next(new ForbiddenException("Invalid token"));
		}
	};
