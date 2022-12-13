import { Body, JsonBody } from "./body"
import { ChannelId, ChannelJoined, Message, MessageId } from "./channel";
import { PrivateUser } from "./user";

/**
 * The server returned a status code which wasn't expected.
 */
export class UnexpectedStatusCode {
    /**
     * The status code that the server returned.
     */
    public readonly status: number;
    /**
     * The text associated with the status.
     */
    public readonly text: string;

    /**
     * Creates a new `UnexpectedStatusCode` exception.
     */
    public constructor(status: number, text: string) {
        this.status = status;
        this.text = text;
    }
}

/**
 * Stores information about a request.
 *
 * This data will be used by the `make_request` function in order to generate proper errors.
 */
interface Request {
    /**
     * The body that will be sent through this request.
     */
    body?: Body;
    /**
     * The URL on which the request will be executed.
     */
    url: string;
    /**
     * The method used for the request.
     */
    method: string;
    /**
     * The kind of data that is expected in the response.
     */
    accept?: string;
    /**
     * The status number that is expected by the request in case of success. Any other number will
     * result in a thrown exception.
     */
    success_status?: number;
}

/**
 * Stores the state required to perform requests to the server.
 */
export class Client {
    /**
     * The connection token of the current user.
     */
    private token: string;

    /**
     * Creates a new `Client`.
     */
    public constructor(token: string) {
        this.token = token;
    }

    /**
     * Executes a request using this client. The appropriate `Authorization` header authomatically
     * added, errors are properly dispatched using exceptions.
     */
    private async make_request(request: Request): Promise<any> {
        let headers: Record<string, string> = {};

        headers["Authorization"] = this.token;

        let body: BodyInit | undefined = undefined;
        if (request.body) {
            body = request.body.data;
            headers["Content-Type"] = request.body.content_type;
        }

        if (request.accept)
            headers["Accept"] = request.accept;

        let success_status = 200;
        if (request.success_status)
            success_status = request.success_status;

        let request_init: RequestInit = {
            method: request.method,
            body,
            headers,
        };

        let response = await fetch(request.url, request_init);

        if (response.status != success_status) {
            // An error seems to have occured server-side.
            throw new UnexpectedStatusCode(response.status, response.statusText);
        }

        return response.json();
    }

    /**
     * Requests information about the current user.
     */
    public async me(): Promise<PrivateUser> {
        return this.make_request({
            accept: "application/json",
            method: "GET",
            url: "/user/@me",
        });
    }

    /**
     * Requests the creation of a new channel.
     */
    public async create_channel(name: string, priv: boolean, password: string = ""): Promise<ChannelJoined> {
        return this.make_request({
            accept: "application/json",
            method: "POST",
            success_status: 201,
            url: "channel",
            body: new JsonBody({
                name,
                private: priv,
                password,
            }),
        });
    }

    /**
     * Joins a new channel.
     */
    public async join_channel(id: ChannelId, password: string = ""): Promise<ChannelJoined> {
        return this.make_request({
            accept: "application/json",
            method: "POST",
            url: `channel/${id}/join`,
            body: new JsonBody({
                password
            }),
        });
    }

    /**
     * Leaves a channel.
     */
    public async leave_channel(id: ChannelId) {
        this.make_request({
            method: "POST",
            url: `channel/${id}/leave`,
        });
    }

    /**
     * Gets the last messages of the given channel.
     */
    public async get_last_messages(channel: ChannelId, limit?: number): Promise<Message[]> {
        let url = `channel/${channel}/message`;
        if (limit)
            url += `?limit=${limit}`;

        return this.make_request({
            method: "GET",
            url,
            accept: "application/json",
        });
    }

    /**
     * Gets the messages that were sent *before* another message.
     */
    public async get_messages_before(channel: ChannelId, anchor: MessageId, limit?: number): Promise<Message[]> {
        let url = `channel/${channel}/message?before=${anchor}`;
        if (limit)
            url += `&limit=${limit}`;

        return this.make_request({
            method: "GET",
            url,
            accept: "application/json",
        });
    }

    /**
     * Gets the messages that were sent *after* another message.
     */
    public async get_messages_after(channel: ChannelId, anchor: MessageId, limit?: number): Promise<Message[]> {
        let url = `channel/${channel}/message?after=${anchor}`;
        if (limit)
            url += `&limit=${limit}`;

        return this.make_request({
            method: "GET",
            url,
            accept: "application/json",
        });
    }

    /**
     * Sends a message to the specified channel.
     */
    public async send_message(channel: ChannelId, content: string): Promise<Message> {
        return this.make_request({
            method: "POST",
            success_status: 201,
            accept: "application/json",
            url: `channel/${channel}/message`,
            body: {
                content_type: "text/plain",
                data: content,
            }
        });
    }
}
