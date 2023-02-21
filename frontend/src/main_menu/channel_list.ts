import { Channel, Client, UnexpectedStatusCode, Users } from "../api";
import { NOTIFICATIONS } from "../notification";
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
				if (!password) return;
				promise = Client.join_channel(channel.id, password);
			} else {
				throw new Error("invalid channel type (this should never happen)");
			}

			promise
				.then(() => {
					const elem = CHAT_ELEMENT.add_channel(channel);
					Client.last_messages(channel.id, 50).then((messages) => {
						for (const msg of messages) {
							CHAT_ELEMENT.add_message(elem, msg);
						}
					});
					CHAT_ELEMENT.set_selected_channel(elem);
					CHANNEL_LIST.hide();
				})
				.catch(() => {
					NOTIFICATIONS.spawn_notification("red", "invalid password");
				});
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

	private channel_name: HTMLInputElement;
	private channel_password: HTMLInputElement;
	private create_channel: HTMLButtonElement;
	private priv_channel: HTMLButtonElement;

	public constructor() {
		const screen = document.createElement("div");
		screen.id = "create-channel-screen";
		screen.onclick = (ev) => {
			if (ev.target === screen) this.hide();
		};

		const container = document.createElement("div");
		container.id = "create-channel-container";
		screen.appendChild(container);

		const new_channel_container = document.createElement("div");
		new_channel_container.id = "new-channel-container";
		container.appendChild(new_channel_container);

		const new_channel_title = document.createElement("button");
		new_channel_title.id = "new-channel-title";
		new_channel_title.innerText = "Create Channel";
		new_channel_title.disabled = true;
		new_channel_container.appendChild(new_channel_title);

		const new_channel_edit_row = document.createElement("div");
		new_channel_edit_row.id = "new-channel-edit-row";
		new_channel_container.appendChild(new_channel_edit_row);

		const channel_name_container = document.createElement("div");
		channel_name_container.classList.add("editor-field-container");
		new_channel_edit_row.appendChild(channel_name_container);

		const channel_name = document.createElement("input");
		channel_name.type = "text";
		channel_name.classList.add("editor-field");
		channel_name.onkeydown = () => {
			if (channel_name.value === "") {
				new_channel_title.disabled = true;
				new_channel_title.classList.remove("ready");
			} else {
				new_channel_title.disabled = false;
				new_channel_title.classList.add("ready");
			}
		};
		channel_name_container.appendChild(channel_name);

		const channel_name_label = document.createElement("div");
		channel_name_label.classList.add("editor-field-label");
		channel_name_label.innerText = "Name";
		channel_name_container.appendChild(channel_name_label);

		const channel_password_container = document.createElement("div");
		channel_password_container.classList.add("editor-field-container");
		new_channel_edit_row.appendChild(channel_password_container);

		const channel_password = document.createElement("input");
		channel_password.type = "password";
		channel_password.classList.add("editor-field");
		channel_password_container.appendChild(channel_password);

		const channel_password_label = document.createElement("div");
		channel_password_label.innerText = "Password";
		channel_password_label.classList.add("editor-field-label");
		channel_password_container.appendChild(channel_password_label);

		const channel_private = document.createElement("button");
		channel_private.innerText = "PRIV";
		channel_private.id = "new-channel-private";
		channel_private.onclick = () => {
			channel_private.classList.toggle("active");

			if (channel_private.classList.contains("active")) {
				channel_password.value = "";
				channel_password.disabled = true;
			} else {
				channel_password.disabled = false;
			}
		};
		new_channel_edit_row.appendChild(channel_private);

		const channel_list = document.createElement("div");
		channel_list.id = "create-channel-list";
		container.appendChild(channel_list);

		const add_priv_channel_container = document.createElement("div");
		add_priv_channel_container.id = "add-priv-channel-container";
		container.appendChild(add_priv_channel_container);

		const add_priv_channel_label = document.createElement("div");
		add_priv_channel_label.innerText = "CODE: ";
		add_priv_channel_label.id = "add-priv-channel-label";
		add_priv_channel_container.appendChild(add_priv_channel_label);

		const add_priv_channel_input = document.createElement("input");
		add_priv_channel_input.type = "text";
		add_priv_channel_input.classList.add("editor-field");
		add_priv_channel_input.id = "add-priv-channel-id";
		add_priv_channel_container.appendChild(add_priv_channel_input);

		add_priv_channel_input.onkeydown = (ev) => {
			if (ev.key !== "Enter") return;

			Client.join_channel(add_priv_channel_input.value)
				.then((chan) => {
					const ch = CHAT_ELEMENT.add_channel(chan);
					CHAT_ELEMENT.set_selected_channel(ch);
					this.hide();

					// Clear the field.
					add_priv_channel_input.value = "";
				})
				.catch((err) => {
					if (err instanceof UnexpectedStatusCode)
						NOTIFICATIONS.spawn_notification("red", err.message || "Unknown error");
				});
		};

		new_channel_title.onclick = () => {
			const priv = channel_private.classList.contains("active");
			let password: string | undefined = undefined;
			if (!priv && channel_password.value !== "") password = channel_password.value;
			// TODO: Catch 409: confilct
			Client.create_channel(channel_name.value, priv, password)
				.then((channel) => {
					const ch = CHAT_ELEMENT.add_channel(channel);
					CHAT_ELEMENT.set_selected_channel(ch);
					Users.me().then((me) => me.channels_owned_ids.push(channel.id));
					this.hide();
				})
				.catch(() => {
					NOTIFICATIONS.spawn_notification("red", "channel name already taken");
				});
		};

		this.screen = screen;
		this.container = container;
		this.list = channel_list;
		this.channel_name = channel_name;
		this.channel_password = channel_password;
		this.create_channel = new_channel_title;
		this.priv_channel = channel_private;
	}

	public show(at: HTMLElement) {
		while (this.list.firstChild) this.list.firstChild.remove();

		this.create_channel.classList.remove("ready");
		this.channel_name.value = "";
		this.channel_password.disabled = false;
		this.channel_password.value = "";
		this.priv_channel.classList.remove("active");

		const rect = at.getBoundingClientRect();
		this.container.style.top = `${rect.bottom + 20}px`;
		this.container.style.left = `${rect.right - 400}px`;
		document.body.appendChild(this.screen);

		Client.get_all_channels().then((channels) => {
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
