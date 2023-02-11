

class ChannelSettings {
    private screen: HTMLDivElement;
    private container: HTMLDivElement;
    private when_owner: HTMLDivElement;
    private when_not_owner: HTMLDivElement;

    public constructor() {
        const screen = document.createElement("div");
        screen.id = "channel-settings-screen";
        screen.onclick = e => {
            if (e.target === screen) {
                this.hide();
            }
        }

        const container = document.createElement("div");
        container.id = "channel-settings-container";
        screen.appendChild(container);

        const owner_container = document.createElement("div");

        const password_container = document.createElement("div");
        password_container.classList.add("editor-field-container");
        password_container.id = "channel-settings-password-container";
        owner_container.appendChild(password_container);
        
        const password = document.createElement("input");
        password.type = "password";
        password.classList.add("editor-field");
        password_container.appendChild(password);

        const password_label = document.createElement("div");
        password_label.classList.add("editor-field-label");
        password_label.innerText = "Change Password";
        password_container.appendChild(password_label);

        const not_owner_container = document.createElement("div");
        not_owner_container.innerText = "You are not the owner of this channel.";

        this.screen = screen;
        this.container = container;
        this.when_owner = owner_container;
        this.when_not_owner = not_owner_container;
    }

    public show(at: HTMLElement, owner: boolean) {
        const rect = at.getBoundingClientRect();

        this.container.style.top = `${rect.top - 20}px`;
        this.container.style.left = `${rect.left + rect.width / 2}px`;
        this.container.style.transform = "translate(-50%, -100%)";

        while (this.container.firstChild)
            this.container.firstChild.remove();
        if (owner) this.container.appendChild(this.when_owner);
        else this.container.appendChild(this.when_not_owner);
        document.body.appendChild(this.screen);
    }

    public hide() {
        this.screen.remove();
    }
}

const CHANNEL_SETTINGS = new ChannelSettings();
export default CHANNEL_SETTINGS;
