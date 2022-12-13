import { PrivateUser } from "./api/user";
import { Client as ApiClient } from "./api/client"
import { ChatElement } from "./chat";
import { on_key_pressed } from "./strawberry/input";

/**
 * Tries to get the value of a specific cookie.
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
    // Verify that the user is connected and if so, create a client to start interacting with the
    // backend.
    const token = get_cookie("token");
    if (!token) {
        // The user is not connected.

        // TODO:
        //  Redirect to School 42.
        throw "User Not Connected!";
    }

    const client = new ApiClient(token);

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

    console.info(`Connected as '${me.name}'!`);

    const chat = new ChatElement(client);

    document.body.appendChild(chat.html);

    // Initialize the stuff that's related to the user.
    let first: boolean = true;
    for (const channel of me.channels) {
        console.log(`adding channel '${channel.name}'`);

        const element = chat.add_channel(channel);

        if (first)
        {
            first = false;
            chat.set_selected_channel(element);
        }
    }
}
