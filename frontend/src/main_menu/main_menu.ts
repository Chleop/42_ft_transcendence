import { RawHTTPClient } from "../api/raw_client";
import { ChatElement } from "./chat";
import { Scene } from "../strawberry/scene";
import { PrivateUser } from "../api/user";
import { History } from "../strawberry/history";
import { Scenes } from "../scenes"

/**
 * The scene that contains the main menu.
 */
export class MainMenuScene extends Scene {
    /**
     * The state of the chat.
     */
    private chat_element: ChatElement;

    /**
     * The root HTML element of the main menu.
     */
    private container: HTMLDivElement;

    /**
     * Creatse a new `MainMenuElement` instance.
     */
    public constructor(client: RawHTTPClient) {
        super();

        this.container = document.createElement("div");
        this.container.id = "main-menu-container";

        const title = document.createElement("div");
        title.id = "main-menu-title";
        title.innerText = "Pong";
        this.container.appendChild(title);

        const rank = document.createElement("div");
        rank.id = "main-menu-rank";
        this.container.appendChild(rank);

        const find_game = document.createElement("button");
        find_game.id = "main-menu-find-game";
        find_game.classList.add("main-menu-button");
        find_game.onclick = () => History.push_state(Scenes.game);
        const find_game_span = document.createElement("span");
        find_game_span.innerText = "Find Game";
        find_game.appendChild(find_game_span);
        this.container.appendChild(find_game);

        const profile = document.createElement("button");
        profile.id = "main-menu-profile";
        profile.classList.add("main-menu-button");
        const profile_span = document.createElement("span");
        profile_span.innerText = "Profile";
        profile.appendChild(profile_span);
        this.container.appendChild(profile);

        this.chat_element = new ChatElement(client);
        this.container.appendChild(this.chat_element.html);

        // TODO:
        //  Ensure that this logic uses a cached client + update when receiving
        //  new events through websockets.
        //client.me().then(me => {
        {
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

            // Initialize the stuff that's related to the user.
            let first: boolean = true;
            for (const channel of me.channels) {
                console.log(`adding channel '${channel.name}'`);

                const element = this.chat_element.add_channel(channel);

                if (first) {
                    first = false;
                    this.chat_element.set_selected_channel(element);
                }
            }
        };
    }

    public get location(): string {
        return "/";
    }

    public get root_html_element(): HTMLElement {
        return this.container;
    }
}
