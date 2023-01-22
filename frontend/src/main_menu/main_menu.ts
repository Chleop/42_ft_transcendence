import { ChatElement } from "./chat";
import { Scene } from "../strawberry/scene";
import { GameSocket, Client, Users } from "../api";
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
                console.log("Cancelled matchmaking.");
                this.game_socket.disconnect();
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
                };

                this.game_socket.on_match_found = () => {
                    console.log("Match found!");

                    const s = <GameSocket>this.game_socket;
                    History.push_state(new GameScene(s, new LocalPlayer(s), new RemotePlayer(s)));
                    this.game_socket = null;
                    find_game_span.innerText = "Find Game";
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

        Users.me().then(me => {
            console.info(`connected as '${me.name}'`);
            
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
        });

        this.game_socket = null;
    }

    public get location(): string {
        return "/";
    }

    public get root_html_element(): HTMLElement {
        return this.container;
    }
}
