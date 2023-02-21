export const warp_vertex_shader_source = `#version 300 es
precision highp float;

out vec2 tex_coords;

void main() {
    vec2 vertex = vec2(float(gl_VertexID % 2), float(gl_VertexID >> 1));
    tex_coords = vec2(vertex.x, vertex.y);
    vertex = vertex * 2.0f - 1.0f;
    gl_Position = vec4(vertex, 0.0f, 1.0f);
}
`;

export const warp_fragment_shader_source = `#version 300 es
precision highp float;

in vec2 tex_coords;

uniform vec2 screen;
uniform sampler2D target;

out vec4 fragment_color;

float luminance(vec3 base) {
    return 0.2126 * base.x + 0.7152 * base.y + 0.0722 * base.z;
}

void main() {
    vec2 coords = tex_coords;
    coords = coords * 2.0f - 1.0f;

    // Warp Effect.
    vec2 offset = abs(coords.yx) / 3.0f;
    coords = coords + offset * offset * coords;

    if (coords.x < -1.0f || coords.x > 1.0f || coords.y < -1.0f || coords.y > 1.0f)
        fragment_color = vec4(0.0f, 0.0f, 0.0f, 1.0f);
    else {
        fragment_color = vec4(
            texture(target, (coords * 1.0f) * 0.5f + 0.5f).x,
            texture(target, (coords * 1.005f) * 0.5f + 0.5f).y,
            texture(target, (coords * 1.01f) * 0.5f + 0.5f).z,
            1.0f
        );

        vec4 base = texture(target, (coords * 0.95f) * 0.5f + 0.5f);
        float lum = luminance(base.xyz);
        fragment_color.xyz += lum * lum * 0.3;
    }

    // Vignette.
    vec2 vignette = 100.0f / screen;
    vignette = smoothstep(vec2(0.0f, 0.0f), vignette, 1.0f - abs(coords));
    vignette = clamp(vignette, 0.0f, 1.0f);

    // Cool Lines.
    fragment_color.y *= (sin(coords.y * screen.y * 0.5f) + 1.0f) * 0.15f + 0.8f;
    fragment_color.xz *= (cos(coords.y * screen.y * 0.5f) + 1.0f) * 0.135f + 0.8f;

    fragment_color.xyz = clamp(fragment_color.xyz, 0.0f, 1.0f) * vignette.x * vignette.y;
}
`;
