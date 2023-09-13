precision highp float;
precision highp int;

uniform float uChromaticAberration;
uniform float uRefractPower;
uniform float uFresnelPower;
uniform float uShininess;
uniform float uDiffuseness;
uniform vec3 uLight;
uniform float uGamma;
uniform float uLightOpacity;
uniform float uFresnelOpacity;

uniform vec2 winResolution;
uniform sampler2D uTexture;

varying vec3 worldNormal;
varying vec3 eyeVector;

float specular(vec3 light, float shininess, float diffuseness) {
    vec3 normal = worldNormal;
    vec3 lightVector = normalize(-light);
    vec3 halfVector = normalize(eyeVector + lightVector);

    float NdotL = dot(normal, lightVector);
    float NdotH = dot(normal, halfVector);
    float kDiffuse = max(0.0, NdotL);
    float NdotH2 = NdotH * NdotH;

    float kSpecular = pow(NdotH2, shininess);
    return kSpecular + kDiffuse * diffuseness;
}

float fresnel(vec3 eyeVector, vec3 worldNormal, float power) {
    float fresnelFactor = abs(dot(eyeVector, worldNormal));
    float inversefresnelFactor = 1.0 - fresnelFactor;

    return pow(inversefresnelFactor, power);
}

void main() {
    float iorRatio = 1.0 / 1.333;
    vec2 uv = gl_FragCoord.xy / winResolution.xy;
    vec3 normal = worldNormal;
    vec3 refractVec = refract(eyeVector, normal, iorRatio);
    vec4 color = texture2D(uTexture, uv + refractVec.xy * uRefractPower * uChromaticAberration);
    color.rgb = pow(color.rgb, vec3(uGamma));

    // ライトの反射光と拡散光(下記を消すとライトがなくなります)
    float specularLight = specular(uLight, uShininess, uDiffuseness);
    color += specularLight * uLightOpacity;

    // フレネル効果の付与(下記を消すとフレネル効果がなくなります)
    float f = fresnel(eyeVector, normal, uFresnelPower);
    color.rgb += f * vec3(0.4471, 0.4471, 0.4471) * uFresnelOpacity;

    gl_FragColor = color;
}