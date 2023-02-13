import { Channel, Client } from "../api";
import CHAT_ELEMENT from "./chat";

/** Information about a channel to be added. */
export class ChannelResultElement {
    public readonly root: HTMLDivElement;

    public constructor(channel: Channel) {
        const root = document.createElement("div");
        root.classList.add("create-channel-result");

        const header = document.createElement("div");
        header.classList.add("create-channel-result-header");
        header.onclick = () => {
            let promise;
            if (channel.type === "PUBLIC") {
                promise = Client.join_channel(channel.id);
            } else if (channel.type === "PROTECTED") {
                const password = prompt("c koi le mdp??");
                if (!password)
                    return;
                promise = Client.join_channel(channel.id, password);
            } else { return; }

            promise.then(() => {
                const elem = CHAT_ELEMENT.add_channel(channel);
                Client.last_messages(channel.id, 50).then(messages => {
                    for (const msg of messages) {
                        CHAT_ELEMENT.add_message(elem, msg);
                    }
                });
                CHAT_ELEMENT.set_selected_channel(elem);
                CHANNEL_LIST.hide();
            }).catch(() => { })
        };
        root.appendChild(header);

        const name = document.createElement("div");
        name.classList.add("create-channel-result-name");
        name.innerText = channel.name;
        header.appendChild(name);

        if (channel.type === "PROTECTED") {
            const lock = document.createElement("div");
            lock.classList.add("create-channel-result-lock");
            header.appendChild(lock);
        }

        const member_count = document.createElement("div");
        member_count.classList.add("create-channel-result-members");
        member_count.innerText = `${channel.members_count} members`;
        header.appendChild(member_count);

        this.root = root;
    }
}

/** The element displayed when looking for a new channel to join. */
export class ChannelListElement {
    private screen: HTMLDivElement;
    private container: HTMLDivElement;
    private list: HTMLDivElement;

    public constructor() {
        const screen = document.createElement("div");
        screen.id = "create-channel-screen";
        screen.onclick = ev => {
            if (ev.target === screen)
                this.hide();
        };

        const container = document.createElement("div");
        container.id = "create-channel-container";
        screen.appendChild(container);

        const channel_list = document.createElement("div");
        channel_list.id = "create-channel-list";
        container.appendChild(channel_list);

        this.screen = screen;
        this.container = container;
        this.list = channel_list;
    }

    public show(at: HTMLElement) {
        while (this.list.firstChild)
            this.list.firstChild.remove();

        const rect = at.getBoundingClientRect();
        this.container.style.top = `${rect.bottom + 20}px`;
        this.container.style.left = `${rect.right - 400}px`;
        document.body.appendChild(this.screen);

        Client.get_all_channels().then(channels => {
            for (const chan of channels) {
                this.list.appendChild(new ChannelResultElement(chan).root);
            }
        });
    }

    public hide() {
        this.screen.remove();
    }
}

const CHANNEL_LIST = new ChannelListElement();
export default CHANNEL_LIST;
