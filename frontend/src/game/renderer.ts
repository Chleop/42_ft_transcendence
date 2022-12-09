import { sprite_fragment_shader_source, sprite_vertex_shader_source } from "./sprite_shader";

/**
 * An exception which indicates that the WebGL2 renderer could not be initialized.
 */
export class RendererInitError {
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
    if (!shader) throw new RendererInitError("failed to create a shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success)
        throw new RendererInitError(gl.getShaderInfoLog(shader) || "");

    return shader;
}

/**
 * Creates a new shader program, properly handling errors.
 */
function create_program(gl: WebGL2RenderingContext, vertex_source: string, fragment_source: string): WebGLProgram {
    const vertex_shader = create_shader(gl, vertex_source, gl.VERTEX_SHADER);
    const fragment_shader = create_shader(gl, fragment_source, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    if (!program) throw new RendererInitError("failed to create a shader program");
    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success)
        throw new RendererInitError(gl.getProgramInfoLog(program) || "");

    return program;
}

/**
 * Gets the location of a uniform.
 */
function get_uniform_location(gl: WebGL2RenderingContext, program: WebGLProgram, name: string) {
    const location = gl.getUniformLocation(program, name);
    if (!location)
        throw new RendererInitError(`could not find uniform '${name}' in shader program`);
    return location;
}

/**
 * The renderer wraps functions to draw on the canvas.
 */
export class Renderer {
    /**
     * The rendering context, probably tied to an existing canvas.
     */
    gl: WebGL2RenderingContext;

    /**
     * The shader program used to render sprites.
     */
    sprite_program: WebGLProgram;

    /**
     * The location of `uniform vec2 model_position` in the vertex shader.
     */
    sprite_uniform_model_position: WebGLUniformLocation;
    /**
     * The location of `uniform mat2 model_transform` in the vertex shader.
     */
    sprite_uniform_model_transform: WebGLUniformLocation;
    /**
     * The location of `uniform mat2 view_transform` in the vertex shader.
     */
    sprite_uniform_view_transform: WebGLUniformLocation;

    /**
     * The view matrix.
     */
    view_matrix: number[];

    /**
     * Creates a new renderer.
     */
    constructor(gl: WebGL2RenderingContext) {
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
     * Clears the screen with a specific color.
     */
    public clear(red: number, green: number, blue: number) {
        this.gl.clearColor(red, green, blue, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    /**
     * Draws a sprite.
     */
    public draw_sprite(x: number, y: number, w: number, h: number, angle: number) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        this.gl.useProgram(this.sprite_program);
        this.gl.uniform2f(this.sprite_uniform_model_position, x, y);
        this.gl.uniformMatrix2fv(this.sprite_uniform_model_transform, false, [w * cos, -h * sin, w * sin, h * cos]);
        this.gl.uniformMatrix2fv(this.sprite_uniform_view_transform, false, this.view_matrix);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
}
