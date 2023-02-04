import {Body, JsonBody} from "./body";
import {ChannelId, ChannelJoined, Message, MessageId} from "./channel";
import {PrivateUser, User, UserId} from "./user";

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
export class RawHTTPClient {
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

	public get access_token(): string {
		return this.token;
	}

	/**
	 * Executes a request using this client. The appropriate `Authorization` header authomatically
	 * added, errors are properly dispatched using exceptions.
	 */
	private async make_request(request: Request): Promise<Response> {
		let headers: Record<string, string> = {};

		headers["Authorization"] = "Bearer " + this.token;

		let body: BodyInit | undefined = undefined;
		if (request.body) {
			body = request.body.data;
			headers["Content-Type"] = request.body.content_type;
		}

		if (request.accept) headers["Accept"] = request.accept;

		let success_status = 200;
		if (request.success_status) success_status = request.success_status;

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

		return response;
	}

	/**
	 * Requests information about the current user.
	 */
	public async me(): Promise<PrivateUser> {
		return (
			await this.make_request({
				accept: "application/json",
				method: "GET",
				url: "/api/user/@me",
			})
		).json();
	}

	/**
	 * Generates a local URL for a user's avatar.
	 */
	public async user_avatar(user: UserId): Promise<string> {
		const img = await this.make_request({
			method: "GET",
			url: `/api/user/${user}/avatar`,
		});
		return URL.createObjectURL(await img.blob());
	}

	/**
	 * Gets public information about a user.
	 */
	public async user(user: UserId): Promise<User> {
		return (
			await this.make_request({
				accept: "application/json",
				method: "GET",
				url: "/api/user/" + user,
			})
		).json();
	}

	/**
	 * Requests the creation of a new channel.
	 */
	public async create_channel(
		name: string,
		priv: boolean,
		password: string = "",
	): Promise<ChannelJoined> {
		return (
			await this.make_request({
				accept: "application/json",
				method: "POST",
				success_status: 201,
				url: "/api/channel",
				body: new JsonBody({
					name,
					private: priv,
					password,
				}),
			})
		).json();
	}

	/**
	 * Joins a new channel.
	 */
	public async join_channel(id: ChannelId, password: string = ""): Promise<ChannelJoined> {
		return (
			await this.make_request({
				accept: "application/json",
				method: "POST",
				url: `/api/channel/${id}/join`,
				body: new JsonBody({
					password,
				}),
			})
		).json();
	}

	/**
	 * Leaves a channel.
	 */
	public async leave_channel(id: ChannelId) {
		this.make_request({
			method: "POST",
			url: `/api/channel/${id}/leave`,
		});
	}

	/**
	 * Gets the last messages of the given channel.
	 */
	public async last_messages(channel: ChannelId, limit?: number): Promise<Message[]> {
		let url = `/api/channel/${channel}/messages`;
		if (limit) url += `?limit=${limit}`;

		return (
			await this.make_request({
				method: "GET",
				url,
				accept: "application/json",
			})
		).json();
	}

	/**
	 * Gets the messages that were sent *before* another message.
	 */
	public async messages_before(
		channel: ChannelId,
		anchor: MessageId,
		limit?: number,
	): Promise<Message[]> {
		let url = `/api/channel/${channel}/messages?before=${anchor}`;
		if (limit) url += `&limit=${limit}`;

		return (
			await this.make_request({
				method: "GET",
				url,
				accept: "application/json",
			})
		).json();
	}

	/**
	 * Gets the messages that were sent *after* another message.
	 */
	public async messages_after(
		channel: ChannelId,
		anchor: MessageId,
		limit?: number,
	): Promise<Message[]> {
		let url = `/api/channel/${channel}/messages?after=${anchor}`;
		if (limit) url += `&limit=${limit}`;

		return (
			await this.make_request({
				method: "GET",
				url,
				accept: "application/json",
			})
		).json();
	}

	/**
	 * Sends a message to the specified channel.
	 */
	public async send_message(channel: ChannelId, content: string): Promise<Message> {
		return (
			await this.make_request({
				method: "POST",
				success_status: 201,
				accept: "application/json",
				url: `/api/channel/${channel}/message`,
				body: new JsonBody({content}),
			})
		).json();
	}
}
