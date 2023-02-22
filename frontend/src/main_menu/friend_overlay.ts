import { Client, GameSocket, GLOBAL_GAME_SOCKET, set_global_game_socket, User, Users } from "../api";
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
            Users.invalidate_me();
            const me = await Users.me();

            if (me.friends_ids.length === 0) {
                this.container.innerText = "D:";
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
                    Users.get_avatar(user.id).then((url) => {
                        avatar.style.backgroundImage = `url(${url})`;
                    });

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

                    stats.innerText = `${user.games_won_count} W / ${user.games_played_count - user.games_won_count} L / ${Math.floor(100.0 * user.games_won_count / user.games_played_count)}%`;

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
