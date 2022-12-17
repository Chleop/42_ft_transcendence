
/**
 * Wraps global input callbacks.
 */
export const Input = (function () {
    class InputClass {
        /**
         * Contains the callbacks that should be called when a key is pressed.
         */
        private key_pressed_callbacks: ((key: string) => void)[];

        /**
         * Contains the callbacks that should be called when a key is released.
         */
        private key_released_callbacks: ((key: string) => void)[];

        public constructor() {
            this.key_pressed_callbacks = [];
            this.key_released_callbacks = [];
            window.onkeydown = (ev: KeyboardEvent) => this.key_released_callbacks.forEach(callback => callback(ev.key));
            window.onkeyup = (ev: KeyboardEvent) => this.key_released_callbacks.forEach(callback => callback(ev.key));
        }

        /**
         * Registers a specific callback to be called when the user presses a keyboard key.
         */
        public on_key_pressed(callback: (key: string) => void) {
            this.key_pressed_callbacks.push(callback);
        }

        /**
         * Registers a specific callback to be called when the user releases a keyboard key.
         */
        public on_key_released(callback: (key: string) => void) {
            this.key_released_callbacks.push(callback);
        }
    }

    return new InputClass();
})();
