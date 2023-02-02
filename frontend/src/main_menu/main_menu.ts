import { ChatElement } from "./chat";
import { Overlay, Scene, State, History } from "../strawberry";
import { Client, GameSocket, User, Users } from "../api";
import { GameBoard, PlayingGame } from "../game";

class ProfileOverlay extends Overlay {
  private html: HTMLDivElement;

  public constructor(parent_state: State) {
    super(parent_state);

    this.html = document.createElement("div");
    this.html.id = "profile";
    this.html.onclick = () => History.go_back();

    const container = document.createElement("div");
    container.id = "profile-container";

    const card = document.createElement("div");
    card.id = "profile-card";

    const header = document.createElement("div");
    header.id = "profile-header";

    const avatar = document.createElement("div");
    avatar.id = "profile-avatar";

    const name = document.createElement("div");
    name.id = "profile-name";

    Users.me().then((me) => {
      Client.user_avatar(me.id).then((url) => {
        avatar.style.backgroundImage = `url(\"${url}\")`;
      });
      name.innerText = me.name;
    });
    header.appendChild(avatar);
    header.appendChild(name);

    const edit_button = document.createElement("button");
    edit_button.id = "profile-edit-button";
    header.appendChild(edit_button);
    card.appendChild(header);

    const stats = document.createElement("ul");
    stats.id = "profile-stats";

    const rank = document.createElement("li");
    rank.innerText = "Rank: Bronze";
    stats.appendChild(rank);

    const wins = document.createElement("li");
    wins.style.color = "green";
    wins.innerText = "Wins: 0";
    stats.appendChild(wins);

    const losses = document.createElement("li");
    losses.style.color = "red";
    losses.innerText = "Losses: 0";
    stats.appendChild(losses);
    card.appendChild(stats);

    const game_history = document.createElement("ul");
    game_history.id = "profile-game-history";

    const game_one = document.createElement("li");
    game_one.innerText = "Game 1";
    game_history.appendChild(game_one);

    const game_two = document.createElement("li");
    game_two.innerText = "Game 2";
    game_history.appendChild(game_two);

    const game_three = document.createElement("li");
    game_three.innerText = "Game 3";
    game_history.appendChild(game_three);
    card.appendChild(game_history);

    container.appendChild(card);
    this.html.appendChild(container);
  }

  public get root_html_element(): HTMLElement {
    return this.html;
  }

  public get location(): string {
    return "/profile";
  }
}

/**
 * The scene that contains the main menu.
 */
class MainMenuScene extends Scene {
  /**
   * The state of the chat.
   */
  private chat_element: ChatElement;

  public profile_overlay: ProfileOverlay;

  /**
   * The root HTML element of the main menu.
   */
  private container: HTMLDivElement;

  /**
   * When the user is looking for a game, the matchmaking socket is stored here.
   */
  private game_socket: GameSocket | null;

  /**
   * Creatse a new `MainMenuElement` instance.
   */
  public constructor() {
    super();

    this.container = document.createElement("div");
    this.container.id = "main-menu-container";

    const title = document.createElement("div");
    title.id = "main-menu-title";
    title.innerText = "Pong";
    this.container.appendChild(title);

    const rank = document.createElement("div");
    rank.id = "main-menu-rank";
    this.container.appendChild(rank);

    const find_game = document.createElement("button");
    find_game.id = "main-menu-find-game";
    find_game.classList.add("main-menu-button");
    const find_game_span = document.createElement("div");
    find_game_span.innerText = "Find Game";
    find_game.appendChild(find_game_span);
    find_game.onclick = () => {
      if (this.game_socket) {
        console.log("Cancelled matchmaking.");
        this.game_socket.disconnect();
      } else {
        console.log("Looking for a game.");
        find_game_span.innerText = "Searching...";

        // Start looking for a game.
        this.game_socket = new GameSocket();

        this.game_socket.on_connected = () => {
          console.log("Connected to the server!");
        };

        this.game_socket.on_disconnected = () => {
          console.log("Disconnected!");

          this.game_socket = null;
          find_game_span.innerText = "Find Game";
        };

        this.game_socket.on_match_found = () => {
          console.log("Match found!");

          const s = <GameSocket>this.game_socket;
          GameBoard.start_game(new PlayingGame(s));
          History.push_state(GameBoard);
          this.game_socket = null;
          find_game_span.innerText = "Find Game";
        };
      }
    };
    this.container.appendChild(find_game);

    const profile = document.createElement("button");
    profile.id = "main-menu-profile";
    profile.classList.add("main-menu-button");
    const profile_span = document.createElement("div");
    profile_span.innerText = "Profile";
    profile.appendChild(profile_span);
    profile.onclick = () => History.push_state(this.profile_overlay);
    this.container.appendChild(profile);

    this.chat_element = new ChatElement();
    this.container.appendChild(this.chat_element.html);

    this.profile_overlay = new ProfileOverlay(this);
    this.container.appendChild(this.profile_overlay.root_html_element);

    Users.me().then((me) => {
      console.info(`connected as '${me.name}'`);
      console.log(`user ID: '${me.id}'`);

      // Initialize the stuff that's related to the user.
      let first: boolean = true;
      for (const channel of me.channels) {
        console.log(`adding channel '${channel.name}'`);

        const element = this.chat_element.add_channel(channel);

        if (first) {
          first = false;
          this.chat_element.set_selected_channel(element);
        }
      }
    });

    this.game_socket = null;
  }

  public get location(): string {
    return "/";
  }

  public get root_html_element(): HTMLElement {
    return this.container;
  }
}

export const MainMenu = new MainMenuScene();
