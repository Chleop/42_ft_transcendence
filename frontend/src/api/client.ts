import { RawHTTPClient } from "./raw_client";
import { PrivateUser } from "./user";

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
    class ClientClass {
        /**
         * The raw HTTP client that is used to perform requests to the backend.
         */
        private raw: RawHTTPClient;

        /**
         * The web socket that is opened to receive messages and channel events from the backend.
         */
        private chat_socket: WebSocket;

        /**
         * Information about the user.
         */
        private me_: PrivateUser;

        /**
         * Creates a new `Client`.
         */
        public constructor(token: string) {
            this.raw = new RawHTTPClient(token);
            this.raw.me().then(me => this.me_ = me);

            this.chat_socket = new WebSocket("/chat", ["access_token", token]);
        }

        /**
         * Returns information about the current user.
         */
        public get me(): PrivateUser {
            return this.me;
        }
    }

    // Verify that the user is connected and if so, create a client to start interacting with the
    // backend.
    const token = get_cookie("token");
    if (!token) {
        // The user is not connected.

        // TODO:
        //  Redirect to School 42.
        throw "User Not Connected!";
    }

    return new ClientClass(token);
})();
