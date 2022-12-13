
/**
 * Contains the callbacks that should be called when a key is pressed.
 */
const KEY_PRESSED_CALLBACKS: ((key: string) => void)[] = (function() {
    const callbacks: ((key: string) => void)[] = [];
    window.onkeydown = (ev: KeyboardEvent) => callbacks.forEach(callback => callback(ev.key));
    return callbacks;
})();

/**
 * Contains the callbacks that should be called when a key is released.
 */
const KEY_RELEASED_CALLBACKS: ((key: string) => void)[] = (function() {
    const callbacks: ((key: string) => void)[] = [];
    window.onkeyup = (ev: KeyboardEvent) => callbacks.forEach(callback => callback(ev.key));
    return callbacks;
})();

/**
 * Registers a specific callback to be called when the user presses a keyboard key.
 */
export function on_key_pressed(callback: (key: string) => void) {
    KEY_PRESSED_CALLBACKS.push(callback);
}

/**
 * Registers a specific callback to be called when the user releases a keyboard key.
 */
export function on_key_released(callback: (key: string) => void) {
    KEY_RELEASED_CALLBACKS.push(callback);
}
