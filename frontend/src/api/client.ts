import { RawHTTPClient } from "./raw_client";

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
 * The global client.
 */
export const Client = (function() {
    // Verify that the user is connected and if so, create a client to start interacting with the
    // backend.
    let token = get_cookie("access_token");
    if (!token) {
        // The user is not connected.
        document.location.pathname = "/api/auth/42/login";
        throw "used not connected";
    }

    return new RawHTTPClient(token);
})();
