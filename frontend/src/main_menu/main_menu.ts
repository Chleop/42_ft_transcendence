import CHAT_ELEMENT from "./chat";
import { Scene, History, State } from "../strawberry";
import { GameSocket, Users } from "../api";
import { PlayingGame } from "../game";
import { rank_to_image, ratio_to_rank } from "../utility";
import PROFILE_OVERLAY, { refresh_overlay } from "./profile_overlay";
import GAME_BOARD from "../game/game_board";

import { ConnectError } from "../api";
import USER_CARD from "./user_card";

/**
 * The scene that contains the main menu.
 */
class MainMenuScene extends Scene {
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
        this.game_socket = null;
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

                this.game_socket.on_error = (err) => {
                    console.error(err);
                    if (this.game_socket === null) return;
                    this.game_socket.disconnect();
                    throw new ConnectError();
                };

                this.game_socket.on_connected = () => {
                    console.log("Connected to the server!");
                };

                this.game_socket.on_disconnected = () => {
                    console.log("Disconnected!");

                    this.game_socket = null;
                    find_game_span.innerText = "Find Game";
                };

                this.game_socket.on_match_found = (found) => {
                    console.log("Match found!");

                    const s: GameSocket | null = this.game_socket;
                    if (s === null) return;
                    Users.me().then((me) => {
                        Users.get(found.id).then(user => {
                            GAME_BOARD.start_game(
                                new PlayingGame(s, me, user)
                            );
                            History.push_state(GAME_BOARD);
                        });
                    });
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
        profile.onclick = () => {
            refresh_overlay();
            History.push_state(PROFILE_OVERLAY);
        };
        this.container.appendChild(profile);

        this.container.appendChild(CHAT_ELEMENT.html);
        this.container.appendChild(PROFILE_OVERLAY.root_html_element);

        Users.me().then((me) => {
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

        this.game_socket = null;
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
