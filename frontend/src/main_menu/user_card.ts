import {
	Channel,
	Client,
	GameSocket,
	GLOBAL_GAME_SOCKET,
	set_global_game_socket,
	User,
	Users,
} from "../api";
import GAME_BOARD from "../game/game_board";
import { SpectatingGame } from "../game/spectating_game";
import { NOTIFICATIONS } from "../notification";
import { History } from "../strawberry";
import { Rank, rank_to_image, ratio_to_rank } from "../utility";
import CHAT_ELEMENT from "./chat";
import MAIN_MENU from "./main_menu";

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
	private promote_button: HTMLButtonElement;
	private mute_button: HTMLButtonElement;
	private ban_button: HTMLButtonElement;
	private play_button: HTMLButtonElement;

	public constructor() {
		const screen = document.createElement("div");
		screen.id = "user-card-screen";
		screen.onclick = (ev) => {
			if (ev.target === screen) this.hide();
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

		const play_button = document.createElement("button");
		play_button.classList.add("user-card-menu-button");
		play_button.innerText = "Invite To Play";
		menu.appendChild(play_button);

		const blocked_button = document.createElement("button");
		blocked_button.classList.add("user-card-menu-button");
		menu.appendChild(blocked_button);

		const send_message_button = document.createElement("button");
		send_message_button.classList.add("user-card-menu-button");
		send_message_button.innerText = "Send Message";
		menu.appendChild(send_message_button);

		const promote_button = document.createElement("button");
		promote_button.classList.add("user-card-menu-button");
		promote_button.innerText = "Promote";
		menu.appendChild(promote_button);

		const mute_button = document.createElement("button");
		mute_button.classList.add("user-card-menu-button");
		mute_button.innerText = "Mute";
		menu.appendChild(mute_button);

		const ban_button = document.createElement("button");
		ban_button.classList.add("user-card-menu-button");
		ban_button.innerText = "Ban";
		menu.appendChild(ban_button);

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
		this.promote_button = promote_button;
		this.mute_button = mute_button;
		this.ban_button = ban_button;
		this.play_button = play_button;
	}

	private unsub: (() => void) | undefined;

	public show(elem: HTMLElement | null, user: User, channel: Channel | null) {
		const re_draw = (user: User) => {
			this.name.innerText = user.name;

			this.status.onclick = () => { };
			this.status.style.cursor = "normal";

			if (user.status === "online") {
				this.status.innerText = "ONLINE";
			} else if (user.status === "offline") {
				this.status.innerText = "OFFLINE";
			} else if (user.status === "ingame") {
				this.status.innerText = "IN GAME";
				this.status.style.cursor = "pointer";
				this.status.onclick = () => {
					GAME_BOARD.start_game(new SpectatingGame(user.id));
					History.push_state(GAME_BOARD);
				};
				this.status.style.cursor = "pointer";
			} else if (user.status === "spectating") {
				this.status.innerText = "SPECTATING";
				if (user.spectating) {
					const spec = user.spectating;
					this.status.style.cursor = "pointer";
					this.status.onclick = () => {
						GAME_BOARD.start_game(new SpectatingGame(spec));
						History.push_state(GAME_BOARD);
					};
				}
			}

			const wins = user.games_won_count;
			const losses = user.games_played_count - wins;
			let percent_f = 0;
			if (wins + losses !== 0)
				percent_f = Math.floor((wins / user.games_played_count) * 100.0);
			const rank: Rank = ratio_to_rank(wins, losses);
			const url = rank_to_image(rank);

			this.rank.style.backgroundImage = `url('${url}')`;
			this.wins.innerText = `${wins} W / ${losses} L / ${percent_f}%`;
		};

		Users.me().then((me) => {
			// If the user we are inspecting is ourselves, there is nothing more to see.
			if (user.id === me.id) {
				this.friend_button.style.display = "none";
				this.blocked_button.style.display = "none";
				this.send_message_button.style.display = "none";
				this.mute_button.style.display = "none";
				this.promote_button.style.display = "none";
				this.ban_button.style.display = "none";
				this.play_button.style.display = "none";
				return;
			}

			const friend = !!me.friends_ids.find((id) => user.id === id);
			const pending = !!me.pending_friends_ids.find((id) => user.id === id);
			const blocked = !!me.blocked_ids.find((id) => user.id === id);
			const i_am_owner = channel?.owner_id === me.id;
			const i_am_admin = i_am_owner || channel?.operators_ids?.indexOf(me.id) !== -1;
			const is_admin =
				channel?.owner_id === user.id || channel?.operators_ids?.indexOf(user.id) !== -1;

			// Otherwise, at least those three buttons will appear.
			this.friend_button.style.display = "block";
			this.blocked_button.style.display = "block";
			this.send_message_button.style.display = "block";
			this.play_button.style.display = "block";

			this.play_button.onclick = () => {
				if (GLOBAL_GAME_SOCKET) {
					NOTIFICATIONS.spawn_notification("red", "YOU ARE ALREADY IN QUEUE (dummass)");
					return;
				}

				set_global_game_socket(new GameSocket(user.id));
				NOTIFICATIONS.spawn_notification("green", "I hope they let me win...");
				MAIN_MENU.set_game_span(`Waiting...`);
			};
			this.send_message_button.onclick = () => {
				const ch = CHAT_ELEMENT.get_or_create_dm_channel(user);
				CHAT_ELEMENT.set_selected_channel(ch);
				this.hide();
			};

			if (friend) {
				this.friend_button.innerText = "Remove Friend";
				this.friend_button.onclick = () =>
					Client.unfriend(user.id)
						.then(() => {
							const index = me.friends_ids.indexOf(user.id);
							if (index !== -1) me.friends_ids.splice(index, 1);
							this.show(null, user, channel);
							NOTIFICATIONS.spawn_notification(
								"green",
								"You're not my friend anymore.",
							);
						})
						.catch(() => {
							NOTIFICATIONS.spawn_notification("red", "failed to remove this friend");
						});
			} else if (pending) {
				this.friend_button.innerText = "Accept Friend";
				this.friend_button.onclick = () =>
					Client.accept_friend(user.id)
						.then(() => {
							me.friends_ids.push(user.id);
							this.show(null, user, channel);
							NOTIFICATIONS.spawn_notification("green", "Friend request accepted.");
						})
						.catch(() => {
							NOTIFICATIONS.spawn_notification(
								"red",
								"failed to accept the friend request",
							);
						});
			} else {
				this.friend_button.innerText = "Add Friend";
				this.friend_button.onclick = () =>
					Client.request_friend(user.id)
						.then(() => {
							this.show(null, user, channel);
							NOTIFICATIONS.spawn_notification("green", "I hope they respond...");
						})
						.catch(() => {
							NOTIFICATIONS.spawn_notification(
								"orange",
								"I already asked them out...",
							);
						});
			}

			if (blocked) {
				this.blocked_button.innerText = "Unblock User";
				this.blocked_button.onclick = () =>
					Client.unblock(user.id)
						.then(() => {
							const index = me.blocked_ids.indexOf(user.id);
							if (index !== -1) me.blocked_ids.splice(index, 1);
							this.show(null, user, channel);
							NOTIFICATIONS.spawn_notification("green", "are you guys cool now?");
						})
						.catch(() => {
							NOTIFICATIONS.spawn_notification("red", "failed to block this user");
						});
				this.friend_button.style.display = "none";
			} else {
				this.blocked_button.innerText = "Block User";
				this.blocked_button.onclick = () =>
					Client.block(user.id)
						.then(() => {
							me.blocked_ids.push(user.id);
							this.show(null, user, channel);
							NOTIFICATIONS.spawn_notification(
								"green",
								"this user won't bother you no more",
							);
						})
						.catch(() => {
							NOTIFICATIONS.spawn_notification("red", "failed to block the user");
						});
				this.friend_button.style.display = "block";
			}

			// As the owner, we can promote or ban people from the current channel.
			if (i_am_owner) {
				this.promote_button.style.display = "block";

				// If the user is already an admin, we can promote them.
				if (!is_admin) {
					this.promote_button.innerText = "Promote";
					this.promote_button.onclick = () => {
						Client.promote(user.id, channel.id)
							.then(() => {
								channel.operators_ids.push(user.id);
								this.show(null, user, channel);
								NOTIFICATIONS.spawn_notification(
									"green",
									"User promoted to channel operator.",
								);
							})
							.catch(() => {
								NOTIFICATIONS.spawn_notification(
									"orange",
									"this user is no longer present in this channel",
								);
							});
					};
				} else {
					this.promote_button.innerText = "Demote";
					this.promote_button.onclick = () => {
						Client.demote(user.id, channel.id)
							.then(() => {
								const idx = channel.operators_ids.indexOf(user.id);
								if (idx !== -1) channel.operators_ids.splice(idx, 1);
								else
									console.error(
										"tried to demote a user that wasn't an operator - and it worked?",
									);
								this.show(null, user, channel);
								NOTIFICATIONS.spawn_notification(
									"green",
									"User demoted from channel operators.",
								);
							})
							.catch(() => {
								NOTIFICATIONS.spawn_notification(
									"orange",
									"this user is no longer present in this channel",
								);
							});
					};
				}
			} else {
				this.promote_button.style.display = "none";
			}

			if (i_am_admin && !is_admin) {
				this.mute_button.style.display = "block";
				this.ban_button.style.display = "block";
				this.mute_button.onclick = () => {
					let time = 0;
					while (true) {
						const input = prompt("cb 2 tmp?");
						if (!input) return;
						time = parseFloat(input);
						if (!isNaN(time) && time !== 0) break;
					}
					Client.mute(user.id, channel.id, time)
						.then(() => {
							NOTIFICATIONS.spawn_notification("green", "user muted.");
						})
						.catch(() => {
							NOTIFICATIONS.spawn_notification(
								"orange",
								"this user is no longer present in this channel",
							);
						});
				};
				this.ban_button.onclick = () => {
					Client.ban(channel.id, user.id)
						.then(() => {
							NOTIFICATIONS.spawn_notification("green", "user banned.");
						})
						.catch(() => {
							NOTIFICATIONS.spawn_notification(
								"orange",
								"this user is no longer present in this channel",
							);
						});
				};
			} else {
				this.mute_button.style.display = "none";
				this.ban_button.style.display = "none";
			}
		});
		Users.get_avatar(user.id).then((url) => {
			this.avatar.style.backgroundImage = `url(\"${url}\")`;
		});
		Client.get_background(user.skin_id).then((url) => {
			this.banner.style.backgroundImage = `url(\"${url}\")`;
		});

		if (this.unsub) {
			this.unsub();
			delete this.unsub;
		}

		this.unsub = Users.subscribe(user.id, re_draw);
		re_draw(user);

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
		}, 1);
	}

	public hide() {
		if (this.unsub) {
			this.unsub();
			delete this.unsub;
		}

		this.screen.remove();
	}
}

const USER_CARD = new UserCardElement();
export default USER_CARD;
