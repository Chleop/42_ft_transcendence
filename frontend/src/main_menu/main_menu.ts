import { ChatElement } from "./chat";
import { Scene } from "../strawberry/scene";
; import { PrivateUser, GameSocket } from "../api";
import { History } from "../strawberry/history";
import { GameScene, RemotePlayer, LocalPlayer } from "../game";

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
     * When the user is looking for a game, the matchmaking socket is stored here.
     */
    private game_socket: GameSocket | null;
    /** Whether a match has been found. The user just need to accept it. */
    private match_found: boolean;

    /**
     * Creatse a new `MainMenuElement` instance.
     */
    public constructor() {
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
        const find_game_span = document.createElement("div");
        find_game_span.innerText = "Find Game";
        find_game.appendChild(find_game_span);
        find_game.onclick = () => {
            if (this.game_socket) {
                if (this.match_found) {
                    console.log("A match has been found.");
                    // Notify the server that we are ready to start the match.
                    this.game_socket.ok();
                    History.push_state(new GameScene(this.game_socket, new LocalPlayer(this.game_socket), new RemotePlayer(this.game_socket)));
                    this.game_socket = null;
                    this.match_found = false;
                    find_game_span.innerText = "Find Game";
                } else {
                    console.log("Cancelled matchmaking.");

                    this.game_socket.disconnect();

                    this.game_socket = null;
                    find_game_span.innerText = "Find Game";
                }
            } else {
                console.log("Looking for a game.");
                find_game_span.innerText = "Searching...";

                // Start looking for a game.
                this.game_socket = new GameSocket();

                this.game_socket.on_connected = () => {
                    console.log("Connected to the server!");
                }

                this.game_socket.on_disconnected = () => {
                    console.log("Disconnected!");

                    this.game_socket = null;
                    find_game_span.innerText = "Find Game";
                    this.match_found = false;
                };

                this.game_socket.on_match_found = () => {
                    console.log("A match has been found.");
                    this.match_found = true;
                    find_game_span.innerText = "Start!";
                };
            }
        };
        this.container.appendChild(find_game);

        const profile = document.createElement("button");
        profile.id = "main-menu-profile";
        profile.classList.add("main-menu-button");
        const profile_span = document.createElement("div");
        profile_span.innerText = "Profile";
        profile.appendChild(profile_span);
        this.container.appendChild(profile);

        this.chat_element = new ChatElement();
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

        this.game_socket = null;
        this.match_found = false;
    }

    public get location(): string {
        return "/";
    }

    public get root_html_element(): HTMLElement {
        return this.container;
    }
}
