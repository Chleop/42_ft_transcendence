import { Client } from "./api/client"
import { DummyPlayer } from "./game/dummy_player";
import { GameScene } from "./game/game";
import { LocalPlayer } from "./game/local_player";
import { MainMenuScene } from "./main_menu/main_menu";
import { History, State } from "./strawberry/history";
import { Router } from "./strawberry/router";

/**
 * Tries to get the value of a specific cookie.
 */
function get_cookie(name: string): string | undefined {
    const maybe_pair =
        document
            .cookie
            .split(';')
            .map(pair => pair.split('='))
            .find(([key, _]) => key == name);

    if (maybe_pair) {
        return maybe_pair[1];
    } else {
        return undefined;
    }
}

/**
 * The entry point of the application.
 */
export function entry_point() {
    // Verify that the user is connected and if so, create a client to start interacting with the
    // backend.
    const token = get_cookie("token");
    if (!token) {
        // The user is not connected.

        // TODO:
        //  Redirect to School 42.
        throw "User Not Connected!";
    }

    const client = new Client(token);
    const router = new Router<State>();

    const main_menu = new MainMenuScene(client);
    const game = new GameScene();

    router.register_route("/game", game);
    router.register_route("/game/", game);
    router.register_route("/", main_menu);

    const route_result = router.get(window.location.pathname);
    if (route_result) {
        History.replace_state(route_result.meta);
    } else {
        // TODO: 404 error
    }
}
