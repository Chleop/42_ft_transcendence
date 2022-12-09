export const hitbox_vertex_shader_source =  `#version 300 es
precision highp float;

uniform vec2 model_position;
uniform mat2 model_transform;
uniform mat2 view_transform;

void main() {
    vec2 vertex;

    if (gl_VertexID == 0)
        vertex = vec2(0.0, 0.0);
    else if (gl_VertexID == 1)
        vertex = vec2(1.0, 0.0);
    else if (gl_VertexID == 2)
        vertex = vec2(1.0, 1.0);
    else if (gl_VertexID == 3)
        vertex = vec2(0.0, 1.0);
    else
        vertex = vec2(0.0, 0.0);

    vertex.x -= 0.5; vertex.y -= 0.5;
    vertex = model_position + model_transform * vertex;
    vertex = view_transform * vertex;

    gl_Position = vec4(vertex, 0.0, 1.0);
}

`;

export const hitbox_fragment_shader_source = `#version 300 es

precision highp float;

out vec4 fragment_color;

void main() {
    fragment_color = vec4(1.0, 0.0, 0.0, 1.0);
}

`;
