/**
 * An interface for objects which can be sent through the network.
 */
export interface Body {
    /**
     * The data that will be sent.
     */
    data: BodyInit,
    /**
     * The MIME type of the data.
     */
    content_type: string,
}

/**
 * Some JSON data.
 */
export class JsonBody {
    /**
     * The JSON data.
     */
    readonly data: string;
    /**
     * The content type for `JsonBody`.
     */
    readonly content_type: string;

    /**
     * Creates a new `JsonBody` instance.
     *
     * @param data The data that will be turned into JSON.
     */
    constructor(data: any) {
        this.data = JSON.stringify(data);
        this.content_type = "application/json";
    }
}
