import { PrivateUser } from "./api/user";
import { ChannelElement, Page } from "./page";

/**
 * Tries to get the value of a specific cookie.
 *
 * @param name The cookie's name.
 *
 * @returns The cookie's value.
 */
 function get_cookie(name: string): string|undefined {
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

    // Create references to the content of the page.
    const page = new Page();

    // Verify that the user is connected and if so, create a client to start interacting with the
    // backend.
    const token = get_cookie("token");
    if (!token) {
        // The user is not connected.

        // TODO:
        //  Redirect to School 42.
        throw "User Not Connected!";
    }

    // const client = new Client(token);

    // Request information about the user. We'll need this data during the lifetime of the whole
    // application, so we have to block until we have it.
    const me: PrivateUser = /* await client.me() */ {
        avatar: "4a1041e5-1392-48cb-b89e-c5e3c1eadddc",
        channels: [
            {
                has_password: false,
                id: "",
                name: "Test"
            },
            {
                has_password: false,
                id: "",
                name: "Test2"
            }
        ],
        id: "3ccb95c1-b1c6-4ee2-b84a-b048700ef59c",
        name: "nmathieu",
    };

    console.log(`Connected as '${me.name}'!`);

    // Initialize the stuff that's related to the user.

    let c: undefined|ChannelElement;
    for (const channel of me.channels) {
        console.log(`adding channel '${channel.name}'`);
        c = page.add_channel(channel);
    }

    (window as any).add_message = (author: string, msg: string) => {
        if (c) {
            page.add_message(c, {
                author_avatar: "",
                author_id: author,
                author_name: author,
                id: "",
                content: msg,
            });
        }
    };
}
