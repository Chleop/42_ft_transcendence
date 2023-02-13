import { Client, User, Users } from "../api";
import { Rank, rank_to_image, ratio_to_rank } from "../utility";

class UserCardElement {
    private screen: HTMLDivElement;
    private card: HTMLDivElement;
    private banner: HTMLDivElement;
    private avatar: HTMLDivElement;
    private name: HTMLDivElement;
    private wins: HTMLDivElement;
    private rank: HTMLDivElement;
    private status: HTMLDivElement;
    private friend_button: HTMLButtonElement;
    private blocked_button: HTMLButtonElement;
    private send_message_button: HTMLButtonElement;

    public constructor() {
        const screen = document.createElement("div");
        screen.id = "user-card-screen";
        screen.onclick = ev => {
            if (ev.target === screen)
                this.screen.remove();
        };

        const card = document.createElement("div");
        card.id = "user-card";
        screen.appendChild(card);

        const banner = document.createElement("div");
        banner.id = "user-card-banner";
        card.appendChild(banner);

        const content_container = document.createElement("div");
        content_container.id = "user-card-content-container";
        card.appendChild(content_container);

        const header = document.createElement("div");
        header.id = "user-card-header";
        content_container.appendChild(header);

        const avatar = document.createElement("div");
        avatar.id = "user-card-avatar";
        header.appendChild(avatar);

        const name = document.createElement("div");
        name.id = "user-card-name";
        header.appendChild(name);

        const status = document.createElement("div");
        status.id = "user-card-status";
        content_container.appendChild(status);

        const stats = document.createElement("div");
        stats.id = "user-card-stats";
        content_container.appendChild(stats);

        const wins = document.createElement("div");
        wins.id = "user-card-wins";
        stats.appendChild(wins);

        const rank = document.createElement("div");
        rank.id = "user-card-stats-rank";
        stats.appendChild(rank);

        const menu = document.createElement("div");
        menu.id = "user-card-menu";
        content_container.appendChild(menu);

        const friend_button = document.createElement("button");
        friend_button.classList.add("user-card-menu-button");
        menu.appendChild(friend_button);

        const blocked_button = document.createElement("button");
        blocked_button.classList.add("user-card-menu-button");
        menu.appendChild(blocked_button);

        const send_message_button = document.createElement("button");
        send_message_button.classList.add("user-card-menu-button");
        send_message_button.innerText = "Send Message";
        menu.appendChild(send_message_button);

        this.screen = screen;
        this.card = card;
        this.banner = banner;
        this.avatar = avatar;
        this.name = name;
        this.wins = wins;
        this.rank = rank;
        this.status = status;
        this.friend_button = friend_button;
        this.blocked_button = blocked_button;
        this.send_message_button = send_message_button;
    }

    public show(elem: HTMLElement|null, user: User) {
        Users.me().then(me => {
            this.name.innerText = user.name;

            // TODO: use the status of the user when it is sent by the backend.
            this.status.innerText = "STATUS HERE";

            const wins = user.games_won_ids.length;
            const losses = user.games_played_ids.length - wins;
            let percent_f = 0;
            if (wins + losses !== 0) {
                const percent = (wins / (wins + losses)) * 100.0;
                percent_f = Math.floor(percent * 10) / 10;
            }
            const rank: Rank = ratio_to_rank(wins, losses);
            const url = rank_to_image(rank);

            this.rank.style.backgroundImage = `url('${url}')`;
            this.wins.innerText = `${wins} W / ${losses} L / ${percent_f}%`;

            if (user.id === me.id) {
                this.friend_button.style.display = "none";
                this.blocked_button.style.display = "none";
                this.send_message_button.style.display = "none";
                return;
            } else {
                this.friend_button.style.display = "block";
                this.blocked_button.style.display = "block";
                this.send_message_button.style.display = "block";
            }

            const friend = !!me.friends_ids.find(id => user.id === id);
            const pending = !!me.pending_friends_ids.find(id => user.id === id);
            const blocked = !!me.blocked_ids.find(id => user.id === id);

            if (friend) {
                this.friend_button.innerText = "Remove Friend";
                this.friend_button.onclick = () => Client.unfriend(user.id).then(() => {
                    const index = me.friends_ids.indexOf(user.id);
                    if (index !== -1)
                        me.friends_ids.splice(index, 1);
                    this.show(null, user);
                });
            } else if (pending) {
                this.friend_button.innerText = "Accept Friend";
                this.friend_button.onclick = () => Client.accept_friend(user.id).then(() => {
                    me.friends_ids.push(user.id);
                    this.show(null, user);
                });
            } else {
                this.friend_button.innerText = "Add Friend";
                this.friend_button.onclick = () => Client.request_friend(user.id).then(() => {
                    this.show(null, user);
                });
            }

            if (blocked) {
                this.blocked_button.innerText = "Unblock User";
                this.blocked_button.onclick = () => Client.unblock(user.id).then(() => {
                    const index = me.blocked_ids.indexOf(user.id);
                    if (index !== -1)
                        me.blocked_ids.splice(index, 1);
                    this.show(null, user);
                });
                this.friend_button.style.display = "none";
            } else {
                this.blocked_button.innerText = "Block User";
                this.blocked_button.onclick = () => Client.block(user.id).then(() => {
                    me.blocked_ids.push(user.id);
                    this.show(null, user);
                });
                this.friend_button.style.display = "display";
            }
        });
        Users.get_avatar(user.id).then(url => {
            // TODO: use the skin here.
            this.avatar.style.backgroundImage = `url(\"${url}\")`;
        });
        Client.get_background(user.id).then(url => {
            this.banner.style.backgroundImage = `url(\"${url}\")`;
        });

        if (elem) {
            const box = elem.getBoundingClientRect();
            const top = box.top;
            const left = box.left - 10;

            this.card.style.top = `${top}px`;
            this.card.style.left = `${left}px`;
            document.body.appendChild(this.screen);
        }

        setTimeout(() => {
            const box2 = this.card.getBoundingClientRect();
            if (box2.bottom >= window.innerHeight - 20)
                this.card.style.top = `${window.innerHeight - 20 - box2.height}px`;
        });
    }
}

const USER_CARD = new UserCardElement();
export default USER_CARD;