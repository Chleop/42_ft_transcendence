import { RawHTTPClient } from "./raw_client";
import { PrivateUser } from "./user";

export class Client {
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
