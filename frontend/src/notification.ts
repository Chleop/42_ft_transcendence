import { GameSocket, set_global_game_socket, Users } from "./api";

class Notification {
    public root: HTMLDivElement;

    public constructor(color: string, message: string) {
        this.root = document.createElement("div");
        this.root.classList.add("notification-block");
        this.root.style.setProperty("--notif-color", color);
        this.root.innerText = message;
    }
}

class UserInvite {
    public root: HTMLDivElement;

    public constructor(color: string, user_id: string) {
        this.root = document.createElement("div");
        this.root.classList.add("notification-block");
        this.root.classList.add("notification-invite");
        this.root.style.setProperty("--notif-color", color);

        const avatar = document.createElement("img");
        avatar.src = Users.get_avatar(user_id);
        avatar.classList.add("notification-avatar");
        this.root.appendChild(avatar);

        const text = document.createElement("span");
        this.root.appendChild(text)

        Users.get(user_id).then(user => {
            text.innerText = `${user.name} has invited you to play`;

            this.root.onclick = () => {
                set_global_game_socket(new GameSocket(user.id));
                this.root.remove();
            };
        });
    }
}

export class Notifications {
    public html: HTMLDivElement;

    public constructor() {
        this.html = document.createElement("div");
        this.html.id = "notification-container";
    }

    public spawn_notification(color: string, message: string) {
        const notif = new Notification(color, message);
        this.html.appendChild(notif.root);

        setTimeout(() => {
            notif.root.remove();
        }, 5000);
    }

    public spawn_invite(color: string, user_id: string) {
        const notif = new UserInvite(color, user_id);
        this.html.appendChild(notif.root);

        setTimeout(() => {
            notif.root.remove();
        }, 20000);

    }
}

export const NOTIFICATIONS: Notifications = new Notifications();

(function() {
    document.body.appendChild(NOTIFICATIONS.html);
})();
