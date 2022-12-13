export const sprite_vertex_shader_source = `#version 300 es
precision highp float;

uniform vec2 model_position;
uniform mat2 model_transform;
uniform mat2 view_transform;

out vec2 tex_coords;

void main() {
    vec2 vertex = vec2(float(gl_VertexID % 2), float(gl_VertexID >> 1));
    tex_coords = vec2(vertex.x, 1.0 - vertex.y);

    vertex.x -= 0.5; vertex.y -= 0.5;
    vertex = model_position + model_transform * vertex;
    vertex = view_transform * vertex;

    gl_Position = vec4(vertex, 0.0, 1.0);
}

`;

export const sprite_fragment_shader_source = `#version 300 es

precision highp float;

in vec2 tex_coords;

uniform sampler2D albedo;

out vec4 fragment_color;

void main() {
    fragment_color = texture(albedo, tex_coords);
}

`;
