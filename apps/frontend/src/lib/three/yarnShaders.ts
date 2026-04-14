/**
 * yarnShaders — GLSL shader utilities for yarn ball visual effects.
 *
 * FresnelGlowMaterial: a ShaderMaterial that renders an additive rim-glow
 * (fresnel term) around a sphere. Place it as a slightly larger sphere
 * wrapping the yarn ball core.
 */

import * as THREE from 'three';

/** Creates a fresnel rim-glow ShaderMaterial for a given hex colour. */
export function createFresnelGlowMaterial(hexColor: string): THREE.ShaderMaterial {
  const color = new THREE.Color(hexColor);

  return new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: color },
      fresnelPower: { value: 2.8 },
      intensity: { value: 1.0 },
      opacity: { value: 1.0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 glowColor;
      uniform float fresnelPower;
      uniform float intensity;
      uniform float opacity;

      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
        fresnel = pow(fresnel, fresnelPower);
        float alpha = fresnel * intensity * opacity;
        gl_FragColor = vec4(glowColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
}

/** Creates a sparkle/shimmer ShaderMaterial for collected yarn ball highlights. */
export function createSparkleRingMaterial(hexColor: string): THREE.ShaderMaterial {
  const color = new THREE.Color(hexColor);

  return new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: color },
      time: { value: 0 },
      progress: { value: 0 },
      opacity: { value: 1.0 },
    },
    vertexShader: /* glsl */ `
      uniform float time;
      uniform float progress;
      varying vec2 vUv;
      varying vec3 vNormal;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        // Pulse scale outward during collection
        float pulse = 1.0 + progress * 0.6;
        vec3 pos = position * pulse;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 glowColor;
      uniform float time;
      uniform float progress;
      uniform float opacity;
      varying vec2 vUv;
      varying vec3 vNormal;

      // Simple noise
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      void main() {
        // Scanline sparkles
        float sparkle = hash(vUv * 18.0 + vec2(time * 3.0, 0.0));
        sparkle = step(0.88, sparkle) * (1.0 - progress);

        float alpha = (sparkle * 0.9 + 0.1 * (1.0 - progress)) * opacity;
        gl_FragColor = vec4(glowColor + vec3(0.4), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
}
