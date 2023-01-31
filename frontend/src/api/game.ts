import { Socket, io } from "socket.io-client";

/**
 * The payload of the `updateBall` event.
 */
export interface BallStateUpdate {
    /** The X coordinate of the ball. */
    x: number,
    /** The Y coordinate of the ball. */
    y: number,
    /** The horizontal velocity of the ball. */
    vx: number,
    /** The vertical velocity of the ball. */
    vy: number,
}

/**
 * The payload of the `updateOpponent` and `update` events.
 */
export interface PlayerStateUpdate {
    /** The position of the paddle. */
    position: number,
    /** The current velocity of the paddle. */
    velocity: number,
}

/**
 * The payload of the `updateScore` event.
 */
export interface ScoreStateUpdate {
    /** The score of the opponent. */
    opponent: number,
    /** The score of the local player. */
    you: number,
    /** The person that just scored. */
    just_scored: "you"|"opponent",
}

function noop(): void { }

export class GameSocket {
    /** The inner socket. */
    private socket: Socket;

    /**
     * Indicates that the socket has successfully connected to the server.
     */
    public on_connected: () => void = noop;

    /**
     * Indicates that the socket is not currently connected to the server.
     */
    public on_disconnected: () => void = noop;

    /**
     * Indicates that an opponent has been selected.
     */
    public on_match_found: () => void = noop;

    /**
     * Indicates that the game is starting.
     */
    public on_game_start: () => void = noop;

    /**
     * Indicates that the opponent has moved.
     */
    public on_opponent_updated: (state: PlayerStateUpdate) => void = noop;

    /**
     * Indicates that the ball has moved has been updated.
     */
    public on_ball_updated: (state: BallStateUpdate) => void = noop;

    /**
     * Indicates that the score has changed.
     */
    public on_score_updated: (scores: ScoreStateUpdate) => void = noop;

    /**
     * Creates a new GameSocket.
     */
    public constructor() {
        this.socket = io("/game", {
            extraHeaders: {
                socket_id: 'xyz',
            }
        });

        this.socket.on("connect", () => this.on_connected());
        this.socket.on("disconnect", () => this.on_disconnected());
        this.socket.on("matchFound", () => this.on_match_found());
        this.socket.on("gameStart", () => this.on_game_start());
        this.socket.on("updateOpponent", (state: PlayerStateUpdate) => this.on_opponent_updated(state));
        this.socket.on("updateBall", (state: BallStateUpdate) => this.on_ball_updated(state));
        this.socket.on("updateScore", (state: ScoreStateUpdate) => this.on_score_updated(state));
    }

    /** Initiates the connection with the server. */
    public connect() {
        this.socket.connect();
    }

    /** Dropes the connection with the server. */
    public disconnect() {
        this.socket.disconnect();
    }

    /** Notify the server of what we are doing. */
    public update(state: PlayerStateUpdate) {
        this.socket.emit("update", state);
    }
}

/* Wraps a Socket.IO socket to handle spectator-specific events. */
export class SpecSocket {
    /** The inner socket. */
    private socket: Socket;

    /**
     * Indicates that the socket has successfully connected to the server.
     */
    public on_connected: () => void = noop;

    /**
     * Indicates that the socket is not currently connected to the server.
     */
    public on_disconnected: () => void = noop;

    /**
     * Indicates that the ball has moved.
     */
    public on_ball_update: (state: BallStateUpdate) => void = noop;

    /**
     * Creates a new GameSocket.
     */
    public constructor() {
        this.socket = io("/game", {
            extraHeaders: {
                socket_id: 'xyz',
            }
        });

        this.socket.on("connect", () => this.on_connected());
        this.socket.on("disconnect", () => this.on_disconnected());
        this.socket.on("updateBallSpectator", st => this.on_ball_update(st));
    }

    /** Initiates the connection with the server. */
    public connect() {
        this.socket.connect();
    }

    /** Dropes the connection with the server. */
    public disconnect() {
        this.socket.disconnect();
    }

    /** Notify the server of what we are doing. */
    public update(state: PlayerStateUpdate) {
        this.socket.emit("update", state);
    }
}