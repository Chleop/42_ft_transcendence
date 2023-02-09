import { History } from "./strawberry";
import { RouteData, Router } from "./strawberry/router";
import { MainMenu } from "./main_menu/main_menu";
import { GameBoard } from "./game";
import { SpectatingGame } from "./game/spectating_game";
import { Client } from "./api";

/**
 * The entry point of the application.
 */
function entry_point() {
	History.default_state = MainMenu;

	const router = new Router<(data: RouteData) => void>();

    router.register_route("/", () => History.replace_state(MainMenu));
    router.register_route("/profile", () => {
		History.replace_state(MainMenu);
		History.push_state(MainMenu.profile_overlay);
	});
	router.register_route("/spectate/:room_id", data => {
		GameBoard.start_game(new SpectatingGame(data["room_id"]));
		History.replace_state(GameBoard);
	});
	router.register_route("/2FA", () => {
		const code = prompt("gimme the code") || "";
		Client.validate_2fa(code).then(() => {
			History.replace_state(MainMenu);
		});
	});

	const route_result = router.get(window.location.pathname);
	if (route_result) {
		route_result.meta(route_result.data);
	} else {
		// When the page is not found,
		// TP the user on the main menu.
		History.replace_state(MainMenu);
	}
}

entry_point();
