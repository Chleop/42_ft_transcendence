import { RawHTTPClient } from "./api/raw_client"
import { Scenes } from "./scenes";
import { History } from "./strawberry/history";
import { RouteData, Router } from "./strawberry/router";

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

    const client = new RawHTTPClient(token);
    const router = new Router<(data: RouteData) => void>();

    Scenes.initialize(client);

    router.register_route("/game", () => History.replace_state(Scenes.game));
    router.register_route("/game/", () => History.replace_state(Scenes.game));
    router.register_route("/", () => History.replace_state(Scenes.main_menu));

    const route_result = router.get(window.location.pathname);
    if (route_result) {
        route_result.meta(route_result.data);
    } else {
        // TODO: 404 error
    }
}
