import { Channel, Client, PrivateUser } from "../api";
import { NOTIFICATIONS } from "../notification";
import { ChannelElement } from "./chat";

class ChannelSettings {
	private screen: HTMLDivElement;
	private container: HTMLDivElement;
	private when_owner: HTMLDivElement;
	private when_not_owner: HTMLDivElement;
	private owner_priv: HTMLDivElement;
	private password: HTMLInputElement;
	private name: HTMLInputElement;

	public constructor() {
		const screen = document.createElement("div");
		screen.id = "channel-settings-screen";
		screen.onclick = (e) => {
			if (e.target === screen) {
				this.hide();
			}
		};

		const container = document.createElement("div");
		container.id = "channel-settings-container";
		screen.appendChild(container);

		const owner_container = document.createElement("div");

		const name_container = document.createElement("div");
		name_container.classList.add("editor-field-container");
		name_container.classList.add("channel-settings-field-container");
		owner_container.appendChild(name_container);

		const name = document.createElement("input");
		name.type = "text";
		name.classList.add("editor-field");
		name_container.appendChild(name);

		const name_label = document.createElement("div");
		name_label.classList.add("editor-field-label");
		name_label.innerText = "Name";
		name_container.appendChild(name_label);

		const password_container = document.createElement("div");
		password_container.classList.add("editor-field-container");
		password_container.classList.add("channel-settings-field-container");
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
		not_owner_container.id = "channel-settings-not-owner";
		not_owner_container.innerText = "You are not the owner of this channel.";

		const owner_priv_container = document.createElement("div");
		owner_priv_container.id = "channel-settings-owner-priv";
		owner_priv_container.innerText = "You are not the owner of this channel.";

		this.screen = screen;
		this.container = container;
		this.when_owner = owner_container;
		this.when_not_owner = not_owner_container;
		this.owner_priv = owner_priv_container;
		this.name = name;
		this.password = password;
	}

	public show(at: HTMLElement, me: PrivateUser, channel: ChannelElement) {
		const rect = at.getBoundingClientRect();

		this.container.style.top = `${rect.top - 20}px`;
		this.container.style.left = `${rect.left + rect.width / 2}px`;
		this.container.style.transform = "translate(-50%, -100%)";

		const model = channel.model;
		if (!model) return;

		const owner = channel.model?.owner_id === me.id;

		while (this.container.firstChild) this.container.firstChild.remove();
		if (owner) {
			if (model.type === "PRIVATE") {
				this.owner_priv.innerText = model.id;
				this.container.appendChild(this.owner_priv);
			} else {
				this.container.appendChild(this.when_owner);

				this.name.value = model.name;
				this.name.onchange = () => {
					if (this.name.value === "") return;
					Client.patch_channel(model.id, {
						name: this.name.value,
						password: undefined,
					}).catch(() => {
						NOTIFICATIONS.spawn_notification("red", "Failed to change channel's name.");
					}).then(() => {
						model.name = this.name.value;
						channel.tab.innerText = this.name.value;
						NOTIFICATIONS.spawn_notification("green", "Name changed!");
					});
				};

				this.password.placeholder = "...........";
				this.password.onchange = () => {
					if (this.password.value === "")
						Client.patch_channel(model.id, {
							type: "PUBLIC",
							password: null,
						}).then(() => {
							model.type = "PUBLIC";
							NOTIFICATIONS.spawn_notification("green", "Password removed!")
						}).catch(() => {
							NOTIFICATIONS.spawn_notification("red", "Failed remove the channel's password.");
						});
					else {
						Client.patch_channel(model.id, {
							type: "PROTECTED",
							password: this.password.value,
						}).then(() => {
							model.type = "PROTECTED";
							NOTIFICATIONS.spawn_notification("green", "Password changed!");
						}).catch(() => {
							NOTIFICATIONS.spawn_notification("red", "Failed to change the passwod.");
						});
					}
				};
			}
		} else this.container.appendChild(this.when_not_owner);
		document.body.appendChild(this.screen);
	}

	public hide() {
		this.screen.remove();
	}
}

const CHANNEL_SETTINGS = new ChannelSettings();
export default CHANNEL_SETTINGS;
