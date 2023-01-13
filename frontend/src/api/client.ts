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
         * Cached information about the user.
         */
        private me_: PrivateUser | undefined;

        /**
         * Creates a new `Client`.
         */
        public constructor(token: string) {
            this.raw = new RawHTTPClient(token);
        }

        /**
         * Returns information about the current user.
         */
        public async me(): Promise<PrivateUser> {
            if (this.me_)
                return this.me_;

            this.me_ = await this.raw.me();
            return this.me_;
        }
    }

    // Verify that the user is connected and if so, create a client to start interacting with the
    // backend.
    let token = get_cookie("token");
    if (!token) {
        // The user is not connected.

        // TODO:
        //  Redirect to School 42.
        token = "totally real token";
    }

    return new ClientClass(token);
})();
