precision highp float;
precision highp int;

attribute vec3 position;
attribute vec3 normal;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;

varying vec3 worldNormal;
varying vec3 eyeVector;

void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vec4 mvPosition = viewMatrix * worldPos;

    gl_Position = projectionMatrix * mvPosition;

    // 法線ベクトルの生成
    vec3 transformedNormal = normalMatrix * normal;
    worldNormal = normalize(transformedNormal);

    // 入射ベクトルの生成
    eyeVector = normalize(worldPos.xyz - cameraPosition);
}
