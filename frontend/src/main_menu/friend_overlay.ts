import { Client, GameSocket, GLOBAL_GAME_SOCKET, set_global_game_socket, User, Users } from "../api";
import GAME_BOARD from "../game/game_board";
import { SpectatingGame } from "../game/spectating_game";
import { NOTIFICATIONS } from "../notification";
import { History, Overlay, State } from "../strawberry";
import CHAT_ELEMENT from "./chat";
import MAIN_MENU from "./main_menu";

class FriendOverlay extends Overlay {
    private html: HTMLDivElement;

    private container: HTMLDivElement;

    public get parent_state(): State {
        return MAIN_MENU;
    }

    public constructor() {
        super();

        const screen = document.createElement("div");
        screen.id = "friend-list-screen";
        screen.onclick = e => {
            if (e.target === this.html) {
                History.go_back();
            }
        };

        const container = document.createElement("div");
        container.id = "friend-list-container";
        screen.appendChild(container);

        this.html = screen;
        this.container = container;
    }

    private unsub: Set<() => void> = new Set();

    public on_entered(st: State): void {
        for (const f of this.unsub) {
            f();
        }
        this.unsub.clear();

        while (this.container.firstChild)
            this.container.firstChild.remove();

        (async () => {
            const me = await Users.me();

            if (me.friends_ids.length === 0) {
                this.container.innerText = "You do not have any friends... :(";
            }

            for (const friend_id of me.friends_ids) {
                const friend_entry = document.createElement("div");
                friend_entry.classList.add("friend-entry");
                this.container.appendChild(friend_entry);

                const avatar = document.createElement("div");
                avatar.classList.add('friend-entry-avatar');
                friend_entry.appendChild(avatar);

                const name = document.createElement("div");
                name.classList.add('friend-entry-name');
                friend_entry.appendChild(name);

                const sep = document.createElement("div");
                sep.classList.add('friend-entry-separator');
                friend_entry.appendChild(sep);

                const stats = document.createElement("div");
                stats.classList.add('friend-entry-stats');
                friend_entry.appendChild(stats);

                const blank = document.createElement("div");
                blank.classList.add('friend-entry-blank');
                friend_entry.appendChild(blank);

                const menu = document.createElement("div");
                menu.classList.add("friend-entry-menu");
                friend_entry.appendChild(menu);

                const remove_friend = document.createElement("button");
                remove_friend.innerText = "R";
                remove_friend.onclick = () => {
                    Client.unfriend(friend_id).then(() => {
                        NOTIFICATIONS.spawn_notification("green", "This guy is no longer your friend.");
                        friend_entry.remove();
                    }).catch(() => {
                        NOTIFICATIONS.spawn_notification("red", "Failed to remove your friend.");
                    });
                };
                menu.appendChild(remove_friend);

                const message = document.createElement("button");
                message.innerText = "M";
                menu.appendChild(message);

                const spectate = document.createElement("button");
                spectate.innerText = "S";
                spectate.onclick = () => {
                    GAME_BOARD.start_game(new SpectatingGame(friend_id));
                    History.push_state(GAME_BOARD);
                };
                menu.appendChild(spectate);

                const invite = document.createElement("button");
                invite.innerText = "I";
                invite.onclick = () => {
                    if (GLOBAL_GAME_SOCKET) {
                        NOTIFICATIONS.spawn_notification("red", "YOU ARE ALREADY IN QUEUE (dummass)");
                        return;
                    }

                    set_global_game_socket(new GameSocket(friend_id));
                    NOTIFICATIONS.spawn_notification("green", "I hope they let me win...");
                    MAIN_MENU.set_game_span(`Waiting...`);
                };
                menu.appendChild(invite);

                const update_data = (user: User) => {
                    if (user.status === "ingame") {
                        spectate.style.display = "block";
                    } else {
                        spectate.style.display = "none";
                    }

                    avatar.style.backgroundImage = `url(${Users.get_avatar(user.id)})`;

                    if (user.status !== "online") {
                        invite.style.display = "none";
                    } else {
                        invite.style.display = "block";
                    }

                    message.onclick = () => {
                        const elem = CHAT_ELEMENT.get_or_create_dm_channel(user);
                        CHAT_ELEMENT.set_selected_channel(elem);
                        History.go_back();
                    };

                    name.innerText = user.name;

                    stats.innerText = `${user.games_won_count} W / ${user.games_played_count - user.games_won_count} L / ${user.games_played_count === 0 ? 0 : Math.floor(100.0 * user.games_won_count / user.games_played_count)}%`;

                    if (user.status === "online") {
                        blank.innerText = "ONLINE";
                    } else if (user.status === "offline") {
                        blank.innerText = "OFFLINE";
                    } else if (user.status === "ingame") {
                        blank.innerText = "IN GAME";
                    } else if (user.status === "spectating") {
                        blank.innerText = "SPECTATING";
                    }
                };

                this.unsub.add(Users.subscribe(friend_id, update_data));

                update_data(await Users.get(friend_id));
            }
        })();

        super.on_entered(st);
    }

    public get root_html_element(): HTMLElement {
        return this.html;
    }

    public get location(): string {
        return "/friends";
    }
}

let FRIEND_OVERLAY = new FriendOverlay();
export default FRIEND_OVERLAY;
