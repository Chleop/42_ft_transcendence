class Notification {
    public root: HTMLDivElement;

    public constructor(color: string, message: string) {
        this.root = document.createElement("div");
        this.root.classList.add("notification-block");
        this.root.style.setProperty("--notif-color", color);
        this.root.innerText = message;
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
}

export const NOTIFICATIONS: Notifications = new Notifications();

(function() {
    document.body.appendChild(NOTIFICATIONS.html);
})();
