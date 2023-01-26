import {History} from "./strawberry/history";
import {RouteData, Router} from "./strawberry/router";
import {MainMenuScene} from "./main_menu/main_menu";
import {io, Socket} from "socket.io-client";

/**
 * The entry point of the application.
 */
function entry_point() {
	const router = new Router<(data: RouteData) => void>();

	router.register_route("/", () => History.replace_state(new MainMenuScene()));

	const route_result = router.get(window.location.pathname);
	if (route_result) {
		route_result.meta(route_result.data);
	} else {
		// TODO: 404 error
	}
	const socket: Socket = io("/gateway");

	socket.on("message", (message) => {
		console.log(message);
	});
}

entry_point();
