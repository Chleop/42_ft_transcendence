import { Socket, io } from "socket.io-client";

/**
 * Stores information about the game.
 *
 * An event of this type is received every ~20ms.
 */
export interface GameStateUpdate {
    /** The current state of the ball. */
    updated_ball: { x: number, y: number, vx: number, vy: number },
    /** The scores. */
    scores: { player1_score: number, player2_score: number },
}

/** The state that we need to send to the server. */
export interface PlayerStateUpdate {
    /** The position of the paddle. */
    position: number,
    /** The current velocity of the paddle. */
    velocity: number,
}

function noop(): void {}

export class GameSocket {
    /** The inner socket. */
    private socket: Socket;

    /**
     * Indicates that the socket has successfully connected to the server.
     */
    public on_connected: () => void = noop;

    /**
     * Indicates that an opponent has been selected.
     */
    public on_match_found: () => void = noop;

    /**
     * Indicates that the opponent accepted the match.
     */
    public on_game_ready: () => void = noop;

    /**
     * Indicates that the game is starting.
     */
    public on_game_start: () => void = noop;

    /**
     * Indicates that the opponent has moved.
     */
    public on_opponent_updated: (state: PlayerStateUpdate) => void = noop;

    /**
     * Indicates that the game has been updated.
     */
    public on_game_updated: (state: GameStateUpdate) => void = noop;

    /**
     * Creates a new GameSocket.
     */
    public constructor() {
        this.socket = io("/game");

        this.socket.on("connected", () => this.on_connected());
        this.socket.on("matchFound", () => this.on_match_found());
        this.socket.on("gameReady", () => this.on_game_ready());
        this.socket.on("gameStart", () => this.on_game_start());
        this.socket.on("updateOpponent", (state: PlayerStateUpdate) => this.on_opponent_updated(state));
        this.socket.on("updateGame", (state: GameStateUpdate) => this.on_game_updated(state));
    }

    /** Initiates the connection with the server. */
    public connect() {
        this.socket.connect();
    }

    /** Dropes the connection with the server. */
    public disconnect() {
        this.socket.disconnect();
    }

    /** Indicate to the server that we are ready to start the match. */
    public ok() {
        this.socket.emit("ok");
    }

    /** Notify the server of what we are doing. */
    public update(state: PlayerStateUpdate) {
        this.socket.emit("update", state);
    }
}
