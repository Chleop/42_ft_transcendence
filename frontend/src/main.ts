import { Scenes } from "./scenes";
import { History } from "./strawberry/history";
import { RouteData, Router } from "./strawberry/router";

/**
 * The entry point of the application.
 */
function entry_point() {
    const router = new Router<(data: RouteData) => void>();

    Scenes.initialize();

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

entry_point();
