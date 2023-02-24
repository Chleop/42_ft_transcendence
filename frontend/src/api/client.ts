import { RawHTTPClient } from "./raw_client";

/**
 * Tries to get the value of a specific cookie.
 */
export function get_cookie(name: string): string | undefined {
	const maybe_pair = document.cookie
		.split(";")
		.map((pair) => pair.split("="))
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
export const Client = new RawHTTPClient(get_cookie("access_token") || "");
