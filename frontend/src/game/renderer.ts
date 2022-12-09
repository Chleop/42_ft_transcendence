import { sprite_fragment_shader_source, sprite_vertex_shader_source } from "./sprite_shader";

/**
 * An exception which indicates that the WebGL2 renderer produced an error.
 */
export class RendererError {
    /**
     * Some additional information about the error.
     */
    context: string;

    /**
     * Creates a new `RendererInitError` exception.
     */
    constructor(context: string) {
        this.context = context;
    }
}

/**
 * Creates a new shader, properly handling errors.
 */
function create_shader(gl: WebGL2RenderingContext, source: string, type: GLenum): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new RendererError("failed to create a shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success)
        throw new RendererError(gl.getShaderInfoLog(shader) || "");

    return shader;
}

/**
 * Creates a new shader program, properly handling errors.
 */
function create_program(gl: WebGL2RenderingContext, vertex_source: string, fragment_source: string): WebGLProgram {
    const vertex_shader = create_shader(gl, vertex_source, gl.VERTEX_SHADER);
    const fragment_shader = create_shader(gl, fragment_source, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    if (!program) throw new RendererError("failed to create a shader program");
    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success)
        throw new RendererError(gl.getProgramInfoLog(program) || "");

    return program;
}

/**
 * Gets the location of a uniform.
 */
function get_uniform_location(gl: WebGL2RenderingContext, program: WebGLProgram, name: string) {
    const location = gl.getUniformLocation(program, name);
    if (!location)
        throw new RendererError(`could not find uniform '${name}' in shader program`);
    return location;
}

/**
 * Internal information about a sprite.
 */
class SpriteInternal {
    /**
     * The texture.
     */
    public texture: WebGLTexture;

    /**
     * The width of the sprite.
     */
    public width: number;
    /**
     * The height of the sprite.
     */
    public height: number;

    constructor(gl: WebGL2RenderingContext, albedo: string) {
        const texture = gl.createTexture();
        if (!texture)
            throw new RendererError(`failed to create texture for '${albedo}'`);

        // Temporarily use a white pixel for the image and start loading the true image.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

        const image = new Image();
        image.src = albedo;
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
            this.width = image.width;
            this.height = image.height;
        };

        this.texture = texture;
        this.width = 1;
        this.height = 1;
    }
}

/**
 * A sprite which may be rendered.
*/
export interface Sprite {
    /**
     * The width of the sprite.
     */
    readonly width: number;
    /**
     * The height of the sprite.
     */
    readonly height: number;
}

/**
 * The renderer wraps functions to draw on the canvas.
 */
export class Renderer {
    /**
     * The rendering context, probably tied to an existing canvas.
     */
    private gl: WebGL2RenderingContext;

    /**
     * The shader program used to render sprites.
     */
    private sprite_program: WebGLProgram;

    /**
     * The location of `uniform vec2 model_position` in the vertex shader.
     */
    private sprite_uniform_model_position: WebGLUniformLocation;
    /**
     * The location of `uniform mat2 model_transform` in the vertex shader.
     */
    private sprite_uniform_model_transform: WebGLUniformLocation;
    /**
     * The location of `uniform mat2 view_transform` in the vertex shader.
     */
    private sprite_uniform_view_transform: WebGLUniformLocation;

    /**
     * The view matrix.
     */
    private view_matrix: number[];

    /**
     * Creates a new renderer.
     */
    public constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.gl.clearColor(0, 0, 0, 0);

        console.log("Loading shader programs...");
        this.sprite_program = create_program(this.gl, sprite_vertex_shader_source, sprite_fragment_shader_source);
        this.sprite_uniform_model_position = get_uniform_location(this.gl, this.sprite_program, "model_position");
        this.sprite_uniform_model_transform = get_uniform_location(this.gl, this.sprite_program, "model_transform");
        this.sprite_uniform_view_transform = get_uniform_location(this.gl, this.sprite_program, "view_transform");

        this.view_matrix = [1, 0, 0, 1];
    }

    /**
     * Notifies the renderer that the size of the canvas changed.
     *
     * @param width The new width of the canvas.
     * @param height The new height of the canvas.
     */
    public notify_size_changed(width: number, height: number) {
        this.gl.viewport(0, 0, width, height);
        this.view_matrix = [ 1/8, 0, 0, (width/height)/8 ];
    }

    /**
     * Creates a new `Sprite` for this renderer.
     */
    public create_sprite(albedo: string): Sprite {
        return new SpriteInternal(this.gl, albedo);
    }

    /**
     * Clears the screen with a specific color.
     */
    public clear(red: number, green: number, blue: number) {
        this.gl.clearColor(red, green, blue, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    /**
     * Draws a sprite.
     */
    public draw_sprite(sprite: Sprite, x: number, y: number, w: number, h: number) {
        const sprite_ = sprite as SpriteInternal;

        this.gl.useProgram(this.sprite_program);
        this.gl.uniform2f(this.sprite_uniform_model_position, x, y);
        this.gl.uniformMatrix2fv(this.sprite_uniform_model_transform, false, [w, 0, 0, h]);
        this.gl.uniformMatrix2fv(this.sprite_uniform_view_transform, false, this.view_matrix);
        this.gl.activeTexture(this.gl.TEXTURE0 + 0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, sprite_.texture);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
}
