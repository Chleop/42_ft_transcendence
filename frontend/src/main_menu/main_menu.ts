import { ChatElement } from "./chat";
import { Overlay, Scene, State, History } from "../strawberry";
import { Client, GameSocket, Users } from "../api";
import { GameBoard, PlayingGame } from "../game";
import { rank_to_image, ratio_to_rank } from "../utility";

class ProfileOverlay extends Overlay {
    private html: HTMLDivElement;

    public constructor(parent_state: State) {
        super(parent_state);

        this.html = document.createElement("div");
        this.html.id = "profile";
        this.html.onclick = e => {
            if (e.target === this.html) {
                History.go_back();
            }
        };

        const container = document.createElement("div");
        container.id = "profile-container";

        const card = document.createElement("div");
        card.id = "profile-card";
        container.appendChild(card);

        const header = document.createElement("div");
        header.id = "profile-header";
        card.appendChild(header);

        const avatar = document.createElement("div");
        avatar.id = "profile-avatar";
        const avatar_input = document.createElement("input");
        avatar_input.type = "file";
        avatar_input.accept = "image/*";
        avatar.onclick = () => avatar_input.click();
        header.appendChild(avatar);

        const header_info = document.createElement("div");
        header_info.id = "profile-header-info";
        header.appendChild(header_info);

        const name = document.createElement("div");
        name.id = "profile-name";
        header_info.appendChild(name);

        const stats = document.createElement("div");
        stats.id = "profile-stats";
        header_info.appendChild(stats);

        const rank = document.createElement("div");
        rank.id = "profile-stats-rank";
        stats.appendChild(rank);

        // TODO: compute the number of wins/loses.
        const scores = document.createElement("div");
        scores.id = "profile-stats-scores";
        scores.innerText = "0 W / 0 L";
        stats.appendChild(scores);

        const game_history = document.createElement("ul");
        game_history.id = "profile-game-history";
        game_history.classList.add("custom-scrollbar");
        card.appendChild(game_history);

        Users.me().then((me) => {
            Users.get_avatar(me.id).then(url => {
                avatar.style.backgroundImage = `url(\"${url}\")`;
            });
            name.innerText = me.name;

            let wins = 0;
            let losses = 0;
            for (const game of me.games_played) {
                if (game.winner_id === me.id) {
                    wins += 1;
                } else {
                    losses += 1;
                }
            }

            rank.style.backgroundImage = `url('${rank_to_image(ratio_to_rank(wins, losses))}')`;

            avatar_input.onchange = () => {
                if (avatar_input.files && avatar_input.files[0]) {
                    const file = avatar_input.files[0];
                    Client.set_avatar(file);
                    Users.invalidate_avatar(me.id);
                    Users.get_avatar(me.id).then(url => {
                        avatar.style.backgroundImage = `url(\"${url}\")`;
                    });
                }
            };

            for (const result of me.games_played) {
                const game_container = document.createElement("li");
                game_container.classList.add("profile-game-container");
                game_history.appendChild(game_container);

                const my_avatar = document.createElement("div");
                my_avatar.classList.add("profile-game-avatar");
                game_container.appendChild(my_avatar);

                const my_score = document.createElement("div");
                my_score.classList.add("profile-game-score");
                game_container.appendChild(my_score);

                const separator = document.createElement("div");
                separator.classList.add("profile-game-separator");
                separator.innerText = "-";
                game_container.appendChild(separator);

                const their_score = document.createElement("div");
                their_score.classList.add("profile-game-score");
                game_container.appendChild(their_score);

                const their_avatar = document.createElement("div");
                their_avatar.classList.add("profile-game-avatar");
                game_container.appendChild(their_avatar);

                const my_idx = (me.id === result.players_ids[0]) ? 0 : 1;

                my_score.innerText = "" + result.scores[my_idx];
                Users.get_avatar(result.players_ids[my_idx]).then(url => {
                    my_avatar.style.backgroundImage = `url(\"${url}\")`;
                });
                their_score.innerText = "" + result.scores[1 - my_idx];
                Users.get_avatar(result.players_ids[1 - my_idx]).then(url => {
                    their_avatar.style.backgroundImage = `url(\"${url}\")`;
                });
            }
        });

        this.html.appendChild(container);
    }

    public get root_html_element(): HTMLElement {
        return this.html;
    }

    public get location(): string {
        return "/profile";
    }
}

/**
 * The scene that contains the main menu.
 */
class MainMenuScene extends Scene {
    /**
     * The state of the chat.
     */
    private chat_element: ChatElement;

    public profile_overlay: ProfileOverlay;

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
                };

                this.game_socket.on_disconnected = () => {
                    console.log("Disconnected!");

                    this.game_socket = null;
                    find_game_span.innerText = "Find Game";
                };

                this.game_socket.on_match_found = () => {
                    console.log("Match found!");

                    const s = <GameSocket>this.game_socket;
                    GameBoard.start_game(new PlayingGame(s));
                    History.push_state(GameBoard);
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
        profile.onclick = () => History.push_state(this.profile_overlay);
        this.container.appendChild(profile);

        this.chat_element = new ChatElement();
        this.container.appendChild(this.chat_element.html);

        this.profile_overlay = new ProfileOverlay(this);
        this.container.appendChild(this.profile_overlay.root_html_element);

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

export const MainMenu = new MainMenuScene();
