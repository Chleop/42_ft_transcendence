import CHAT_ELEMENT from "./chat";
import { Scene, History, State } from "../strawberry";
import {
    GameSocket,
    GLOBAL_GAME_SOCKET,
    IS_FAITHFUL,
    set_faithful,
    set_global_game_socket,
    Users,
} from "../api";
import { rank_to_image, ratio_to_rank } from "../utility";
import PROFILE_OVERLAY from "./profile_overlay";

import USER_CARD from "./user_card";
import FRIEND_OVERLAY from "./friend_overlay";

/**
 * The scene that contains the main menu.
 */
class MainMenuScene extends Scene {
    /**
     * The root HTML element of the main menu.
     */
    private container: HTMLDivElement;

    private play_button: HTMLElement;

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
        this.play_button = find_game_span;
        find_game_span.innerText = "Find Game";
        find_game.appendChild(find_game_span);
        find_game.onclick = () => {
            if (GLOBAL_GAME_SOCKET) {
                console.log("Cancelled matchmaking.");
                GLOBAL_GAME_SOCKET.disconnect();
                set_global_game_socket(null);
                find_game_span.innerText = "Find Game";
                return;
            }

            console.log("Looking for a game.");
            find_game_span.innerText = "Searching...";

            // Start looking for a game.
            set_global_game_socket(new GameSocket());
        };
        this.container.appendChild(find_game);

        const profile = document.createElement("button");
        profile.id = "main-menu-profile";
        profile.classList.add("main-menu-button");
        const profile_span = document.createElement("div");
        profile_span.innerText = "Profile";
        profile.appendChild(profile_span);
        profile.onclick = () => {
            History.push_state(PROFILE_OVERLAY);
        };
        this.container.appendChild(profile);

        const friends_button = document.createElement("button");
        friends_button.id = "main-menu-friends";
        friends_button.classList.add("main-menu-button");
        const friends_span = document.createElement("div");
        friends_span.innerText = "Friends";
        friends_button.appendChild(friends_span);
        friends_button.onclick = () => History.push_state(FRIEND_OVERLAY);
        this.container.appendChild(friends_button);

        this.container.appendChild(CHAT_ELEMENT.html);
        this.container.appendChild(PROFILE_OVERLAY.root_html_element);
        this.container.appendChild(FRIEND_OVERLAY.root_html_element);

        const faithful_mode = document.createElement("button");
        faithful_mode.innerText = "Faithful Mode";
        faithful_mode.id = "faithful-mode-button";
        faithful_mode.onclick = () => {
            set_faithful(!IS_FAITHFUL);
            if (IS_FAITHFUL) {
                faithful_mode.classList.add("active");
            } else {
                faithful_mode.classList.remove("active");
            }
        };
        this.container.appendChild(faithful_mode);

        Users.me().then((me) => {
            console.log(me);

            console.info(`connected as '${me.name}'`);
            console.log(`user ID: '${me.id}'`);

            let wins = 0;
            let losses = 0;

            for (const game of me.games_played) {
                if (game.winner_id === me.id) {
                    wins += 1;
                } else {
                    losses += 1;
                }
            }

            const rank_type = ratio_to_rank(wins, losses);
            const rank_image = rank_to_image(rank_type);
            rank.style.backgroundImage = `url('${rank_image}')`;

            // Initialize the stuff that's related to the user.
            let first: boolean = true;
            for (const channel of me.channels) {
                console.log(`adding channel '${channel.name}'`);

                const element = CHAT_ELEMENT.add_channel(channel);

                if (first) {
                    first = false;
                    CHAT_ELEMENT.set_selected_channel(element);
                }
            }
        });
    }

    public set_game_span(text: string) {
        this.play_button.innerText = text;
    }

    public on_left(prev: State): void {
        USER_CARD.hide();

        super.on_left(prev);
    }

    public get location(): string {
        return "/";
    }

    public get root_html_element(): HTMLElement {
        return this.container;
    }
}

const MAIN_MENU = new MainMenuScene();
export default MAIN_MENU;
