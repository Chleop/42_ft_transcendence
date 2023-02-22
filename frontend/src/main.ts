import { History } from "./strawberry";
import { RouteData, Router } from "./strawberry/router";
import MAIN_MENU from "./main_menu/main_menu";
import { SpectatingGame } from "./game/spectating_game";
import PROFILE_OVERLAY from "./main_menu/profile_overlay";
import GAME_BOARD from "./game/game_board";
import FRIEND_OVERLAY from "./main_menu/friend_overlay";

/**
 * The entry point of the application.
 */
function entry_point() {
	History.default_state = MAIN_MENU;

	const router = new Router<(data: RouteData) => void>();

	router.register_route("/", () => History.replace_state(MAIN_MENU));
	router.register_route("/profile", () => {
		History.replace_state(MAIN_MENU);
		setTimeout(() => {
			History.push_state(PROFILE_OVERLAY);
		}, 1);
	});
	router.register_route("/friends", () => {
		History.replace_state(MAIN_MENU);
		setTimeout(() => {
			History.push_state(FRIEND_OVERLAY);
		}, 1);
	});
	router.register_route("/spectate/:room_id", data => {
		GAME_BOARD.start_game(new SpectatingGame(data["room_id"]));
		History.replace_state(GAME_BOARD);
	});

	const route_result = router.get(window.location.pathname);
	if (route_result) {
		route_result.meta(route_result.data);
	} else {
		// When the page is not found,
		// TP the user on the main menu.
		History.replace_state(MAIN_MENU);
	}
}

entry_point();
