import { History } from "./strawberry";
import { RouteData, Router } from "./strawberry/router";
import { MainMenu } from "./main_menu/main_menu";

/**
 * The entry point of the application.
 */
function entry_point() {
	const router = new Router<(data: RouteData) => void>();

    router.register_route("/", () => History.replace_state(MainMenu));
	router.register_route("/spectate/:room_id", () => History.replace_state(MainMenu));

	const route_result = router.get(window.location.pathname);
	if (route_result) {
		route_result.meta(route_result.data);
	} else {
		document.body.innerText = "lol c'est nul part.";
		document.body.style.color = "white";
	}
}

entry_point();
