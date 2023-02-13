import { State } from "./history";

/**
 * A scene which may be added to the document.
 */
export abstract class Scene extends State {
    /**
     * Adds the root HTML element of the scene to the document.
     */
    public on_entered(prev: State): void {
        if (prev instanceof Overlay) {
            // We are getting back from an overlay.
            // Let's not duplicate ourselves.
            return;
        }

        window.document.body.appendChild(this.root_html_element);
    }

    /**
     * Removes the HTML elements of this scene.
     */
    public on_left(next: State): void {
        if (next instanceof Overlay) {
            // We are being replaced by an overlay.
            // Let's not delete ourselves.
            return;
        }

        this.root_html_element.remove();
    }

    /**
     * Returns the root HTML element of the scene.
     */
    public abstract get root_html_element(): HTMLElement;
}

/**
 * A sub-scene, which prevents the scene it replaces from being completely removed when inserted.
 */
export abstract class Overlay extends State {
    public on_entered(_prev: State) {
        this.root_html_element.classList.add("active");
    }

    public on_left(next: State) {
        if (next === this.parent_state) {
            this.root_html_element.classList.remove("active");
        }
    }

    public abstract get parent_state(): State;
    
    /**
     * Returns the root HTML element of the scene.
     */
    public abstract get root_html_element(): HTMLElement;
}
