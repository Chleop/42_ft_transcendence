import { Constants, OngoingGame, Paddle, SkinUrls, } from ".";

import { BallStateUpdate, Client, GameSocket, PlayerStateUpdate, ScoreStateUpdate, User, Users } from "../api";
import { History } from "../strawberry";
import { rank_to_image, ratio_to_rank } from "../utility";

function create_overlay(user: User): HTMLDivElement {
    const result = document.createElement("div");
    result.classList.add("playing-game-player-container");

    const avatar_container = document.createElement("div");
    avatar_container.classList.add("playing-game-overlay-avatar-container");
    result.appendChild(avatar_container);

    const avatar = document.createElement("div");
    avatar.style.backgroundImage = `url('${Users.get_avatar(user.id)}')`;
    avatar.classList.add("playing-game-overlay-avatar");
    avatar_container.appendChild(avatar);

    const rank = document.createElement("div");
    rank.style.backgroundImage = `url('${rank_to_image(ratio_to_rank(user.games_won_count, user.games_played_count - user.games_won_count))}')`;
    rank.classList.add("playing-game-overlay-rank");
    avatar_container.appendChild(rank);

    const name = document.createElement("div");
    name.innerText = user.name;
    name.classList.add("playing-game-overlay-name");
    result.appendChild(name);

    const winrate = document.createElement("div");
    winrate.classList.add("playing-game-overlay-rate");
    const left_rate = user.games_played_count === 0 ? 0 : Math.round(100.0 * user.games_won_count / user.games_played_count);
    winrate.innerText = `${left_rate}%`;
    result.appendChild(winrate);

    return result;
}

/** An onging game that we are playing in. */
export class PlayingGame extends OngoingGame {
    /**
     * Indicates whether the game has actually started or not.
     *
     * Before the server sent us the `gameStart` even, nothing moves on the board. This boolean
     * indicates that the even has been received and that we should start simulating.
     */
    private game_started: boolean;

    /** Wether the player is pressing a certain direction. */
    private buttons: { up: boolean, down: boolean };

    public readonly overlay: HTMLDivElement;

    /**
     * The socket that's being used to play.
     */
    private socket: GameSocket;

    /** Becomes `true` when the player left by himself. */
    private has_left: boolean;

    private left: User;
    private right: User;

    public constructor(socket: GameSocket, me: User, other: User) {
        super();

        socket.on_ball_updated = st => this.on_ball_updated(st);
        socket.on_opponent_updated = st => this.on_opponent_updated(st);
        socket.on_game_start = () => this.on_game_started();
        socket.on_disconnected = () => this.on_disconnected();
        socket.on_score_updated = st => this.on_score_updated(st);
        window.onkeydown = key => this.on_key(key.key, true);
        window.onkeyup = key => this.on_key(key.key, false);

        this.game_started = false;
        this.buttons = { up: false, down: false };
        this.socket = socket;
        this.has_left = false;
        this.left = me;
        this.right = other;

        this.overlay = document.createElement("div");
        this.overlay.id = "playing-game-overlay";

        const left_player = create_overlay(me);
        const right_player = create_overlay(other);
        right_player.classList.add("is-right-player");

        this.overlay.appendChild(left_player);
        this.overlay.appendChild(right_player);
    }

    private on_ball_updated(state: BallStateUpdate) {
        this.state.ball.x = state.x;
        this.state.ball.y = state.y;
        this.state.ball.vx = state.vx;
        this.state.ball.vy = state.vy;
    }

    private on_score_updated(state: ScoreStateUpdate) {
        this.state.left_paddle.score = state.you;
        this.state.right_paddle.score = state.opponent;
    }

    private on_key(key: string, pressed: boolean) {
        if (key === "ArrowUp" || key === "w" || key == "W") {
            this.buttons.up = pressed;
        }
        if (key === "ArrowDown" || key === "s" || key == "S") {
            this.buttons.down = pressed;
        }
    }

    private on_opponent_updated(state: PlayerStateUpdate) {
        this.game_state.right_paddle.position = state.position;
        this.game_state.right_paddle.velocity = state.velocity;
    }

    private on_game_started() {
        console.log("game started!");
        this.game_started = true;

        this.overlay.classList.add("started-game");
    }

    private on_disconnected() {
        console.log("disconnected!");

        this.flow = "break";

        if (!this.has_left)
            History.go_back();
    }

    public tick(delta_time: number): void {
        if (!this.game_started)
            return; // The game has not started yet.

        // Use the input gathered for the player and move the left paddle accordingly.
        let movement_input = 0;
        if (this.buttons.up)
            movement_input += 1;
        if (this.buttons.down)
            movement_input -= 1;
        this.state.left_paddle.velocity = movement_input * Constants.paddle_speed;

        // Actually move the players.
        move_paddle(delta_time, this.state.left_paddle);
        move_paddle(delta_time, this.state.right_paddle);

        // Notify the server that we moved.
        this.socket.update({
            position: this.state.left_paddle.position,
            velocity: this.state.left_paddle.velocity,
        });
    }

    public on_left(): void {
        console.log("disconnecting!");
        this.socket.disconnect();
        this.has_left = true;
    }

    public get location(): string {
        return "/game";
    }

    public get_skins(): SkinUrls {
        return {
            left_background: Client.get_background(this.left.skin_id),
            right_background: Client.get_background(this.right.skin_id),
            left_paddle: Client.get_paddle(this.left.skin_id),
            right_paddle: Client.get_paddle(this.right.skin_id),
            left_ball: Client.get_ball(this.left.skin_id),
            right_ball: Client.get_ball(this.right.skin_id),
        };
    }
}

function move_paddle(dt: number, paddle: Paddle) {
    paddle.position += dt * paddle.velocity;

    if (paddle.position - Constants.paddle_height / 2 < -Constants.board_height / 2) {
        paddle.position = -Constants.board_height / 2 + Constants.paddle_height / 2;
    }
    if (paddle.position + Constants.paddle_height / 2 >= Constants.board_height / 2) {
        paddle.position = Constants.board_height / 2 - Constants.paddle_height / 2;
    }
}
