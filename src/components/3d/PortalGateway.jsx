import { useRef, useState, useCallback, useEffect, useMemo, memo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import { sharedMouse } from '../../store/useStore';
import FloatingObject from './FloatingObject';

/* ── Ken Perlin's Smootherstep ── */
function smootherStep(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/* ── Radial Gradient Glow Disc (no hard border) ── */
const GlowDiscShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5);
      float r = length(vUv - center) * 2.0;
      // Smooth radial falloff: pow curve for ultra-soft edge
      float alpha = pow(max(0.0, 1.0 - r), 2.5) * uOpacity;
      // Slightly brighter toward center
      vec3 col = uColor * (1.0 + (1.0 - r) * 0.5);
      gl_FragColor = vec4(col, alpha);
    }
  `,
};

function GlowDisc({ color, radius = 3.0, opacity = 0.15, segments = 40, position = [0, 0, -0.1] }) {
  const matRef = useRef();

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
      },
      vertexShader: GlowDiscShader.vertexShader,
      fragmentShader: GlowDiscShader.fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }, [color]); // eslint-disable-line react-hooks/exhaustive-deps

  const geometry = useMemo(() => new THREE.CircleGeometry(radius, segments), [radius, segments]);

  // Update opacity uniform directly via ref
  useEffect(() => {
    if (matRef.current?.uniforms?.uOpacity) {
      matRef.current.uniforms.uOpacity.value = opacity;
    }
  }, [opacity]);

  // Dispose resources on unmount
  useEffect(() => {
    return () => {
      material.dispose();
      geometry.dispose();
    };
  }, [material, geometry]);

  return (
    <mesh position={position} geometry={geometry}>
      <primitive object={material} ref={matRef} attach="material" />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════
   ██  PREMIUM COSMIC VORTEX SHADER (Medium/High)
   ═══════════════════════════════════════════════════════════ */
const PortalVortexShaderFull = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColorCore;
    uniform vec3 uColorInner;
    uniform vec3 uColorMid;
    uniform vec3 uColorOuter;
    uniform float uSpeed;
    uniform float uIntensity;
    uniform float uExpansion;
    varying vec2 vUv;

    // ── Ultra-fast, numerically stable GPU hash (zero trigonometric float precision degradation) ──
    float hash(vec2 p) {
      vec2 q = fract(p * vec2(123.34, 456.21));
      q += dot(q, q + 45.32);
      return fract(q.x * q.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    // 2-octave FBM for smooth cosmic fluid turbulence
    float fbm(vec2 p) {
      return 0.65 * noise(p) + 0.35 * noise(p * 2.15 + 1.2);
    }

    void main() {
      vec2 center = vec2(0.5, 0.5);
      vec2 p = vUv - center;
      float r = length(p);

      // Safe cyclical time modulo (100 * 2*PI = 628.31853) to guarantee 30+ minute precision
      float t = mod(uTime, 628.31853);
      float rNorm = r * 2.0;
      float theta = atan(p.y, p.x);
      float spd = uSpeed;

      // ── Organic turbulence along closed periodic harmonic coordinates (zero coordinate drift / precision loss) ──
      float turbulence = fbm(vec2(theta * 2.0 + sin(t * 0.5 * spd) * 0.35, r * 5.5 + cos(t * 0.5 * spd) * 0.35)) * 0.32;
      float thetaDistorted = theta + turbulence;

      // ── Multi-frequency logarithmic spirals tuned to exact integer cycles over 628.31853 period ──
      float spiral1 = thetaDistorted * 2.5 + 4.6 * log(r + 0.018) - t * (1.1 * spd);
      float spiral2 = -thetaDistorted * 3.5 + 3.2 * log(r + 0.035) + t * (0.80 * spd);
      float spiral3 = thetaDistorted * 5.0 + 2.0 * log(r + 0.06) - t * (1.20 * spd);

      float wave1 = sin(spiral1 * 4.5) * 0.5 + 0.5; // 1.1 * 4.5 = 4.95 -> 495 cycles
      float wave2 = cos(spiral2 * 3.5) * 0.5 + 0.5; // 0.80 * 3.5 = 2.80 -> 280 cycles
      float wave3 = sin(spiral3 * 2.5) * 0.5 + 0.5; // 1.20 * 2.5 = 3.00 -> 300 cycles

      // Sharp filament contrast
      float armRaw = wave1 * 0.52 + wave2 * 0.30 + wave3 * 0.18;
      float arms = pow(armRaw, 1.75);

      // Energetic concentric shockwave ripples
      float ripple = sin(r * 36.0 - t * (4.2 * spd)) * 0.5 + 0.5;
      float ripple2 = sin(r * 20.0 + t * (2.6 * spd)) * 0.5 + 0.5;
      float energy = arms * 0.72 + ripple * 0.18 + ripple2 * 0.10;

      // Feather spiral arms towards the outer glowing margin
      float armFade = smoothstep(1.0, 0.52, rNorm);
      energy *= armFade;

      // Harmonic brightness pulse along spiral arms
      float pulse = sin(theta * 3.0 + r * 7.5 - t * 3.2 * spd) * 0.15 + 0.85;
      energy *= pulse;

      // Singularity core: deep cosmic void + luminous photon ring
      float voidEye = smoothstep(0.052, 0.012, r);
      float photonRing = smoothstep(0.03, 0.065, r) * smoothstep(0.12, 0.065, r);
      float photonBrightness = photonRing * (1.6 + sin(t * 5.5 * spd) * 0.3);
      float innerGlow = smoothstep(0.24, 0.035, r);

      // Outer accretion rim energy concentration
      float accretion = smoothstep(0.32, 0.44, r) * smoothstep(0.5, 0.44, r);
      float accretionEnergy = accretion * (0.7 + arms * 0.55);

      // Ultra-soft edge fade (continuous gradient falloff without hard circular seam or GPU discard penalty)
      float edgeFade = pow(smoothstep(1.0, 0.52, rNorm), 1.45);
      float outerGlow = smoothstep(1.0, 0.68, rNorm) * 0.16;
      float alpha = edgeFade * (0.84 + 0.16 * energy) + outerGlow;
      alpha *= smoothstep(0.5, 0.485, r);

      // 4-stage celestial radial color gradation
      vec3 col = uColorOuter;
      col = mix(col, uColorMid, smoothstep(0.48, 0.25, r));
      col = mix(col, uColorInner, smoothstep(0.30, 0.08, r));

      // Specular photon ring and core illumination
      col += uColorCore * (photonBrightness * 2.2 + innerGlow * 0.58);
      col = mix(col, uColorCore * 1.2, accretionEnergy * 0.5);
      col += uColorInner * energy * 0.55;

      // True abyssal void at singularity center
      col = mix(col, vec3(0.0, 0.0, 0.02), voidEye * 0.94);

      // Hover and warp intensity burst
      col *= (uIntensity + uExpansion * 3.5);
      alpha = clamp(alpha * (1.0 + uExpansion * 0.9), 0.0, 1.0);

      gl_FragColor = vec4(col, alpha);
    }
  `,
};

/* ── Streamlined High-Performance Vortex Shader for Low-Tier Devices ── */
const PortalVortexShaderLow = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColorCore;
    uniform vec3 uColorInner;
    uniform vec3 uColorMid;
    uniform vec3 uColorOuter;
    uniform float uSpeed;
    uniform float uIntensity;
    uniform float uExpansion;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5, 0.5);
      vec2 p = vUv - center;
      float r = length(p);

      // Time modulo for stable long-running continuity
      float t = mod(uTime, 628.31853);
      float rNorm = r * 2.0;
      float theta = atan(p.y, p.x);
      float spd = uSpeed;

      // Dual logarithmic spirals tuned to exact integer cycles
      float spiral1 = theta * 2.5 + 4.8 * log(r + 0.016) - t * (1.1 * spd);
      float spiral2 = -theta * 3.5 + 3.3 * log(r + 0.035) + t * (0.80 * spd);

      float wave1 = sin(spiral1 * 4.5) * 0.5 + 0.5;
      float wave2 = cos(spiral2 * 3.5) * 0.5 + 0.5;
      float energy = pow(wave1 * 0.6 + wave2 * 0.4, 1.6);

      float innerGlow = smoothstep(0.24, 0.04, r);
      float voidEye = smoothstep(0.052, 0.012, r);

      // Ultra-soft edge fade without GPU discard penalty
      energy *= smoothstep(1.0, 0.52, rNorm);
      float edgeFade = pow(smoothstep(1.0, 0.52, rNorm), 1.5);
      float outerGlow = smoothstep(1.0, 0.68, rNorm) * 0.15;
      float alpha = edgeFade * (0.84 + 0.16 * energy) + outerGlow;
      alpha *= smoothstep(0.5, 0.485, r);

      vec3 col = mix(uColorOuter, uColorMid, smoothstep(0.48, 0.22, r));
      col = mix(col, uColorInner, smoothstep(0.26, 0.07, r));
      col += uColorCore * innerGlow * 0.75;
      col += uColorInner * energy * 0.45;
      col = mix(col, vec3(0.0, 0.0, 0.02), voidEye * 0.90);

      col *= (uIntensity + uExpansion * 3.5);
      alpha = clamp(alpha * (1.0 + uExpansion * 0.9), 0.0, 1.0);

      gl_FragColor = vec4(col, alpha);
    }
  `,
};

function PortalVortex({ colorCore, colorInner, colorMid, colorOuter, matRef, deviceTier }) {
  const segments = deviceTier === 'low' ? 24 : 56;
  const shaderSource = deviceTier === 'low' ? PortalVortexShaderLow : PortalVortexShaderFull;

  const geometry = useMemo(() => new THREE.CircleGeometry(1.85, segments), [segments]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorCore: { value: new THREE.Color(colorCore) },
        uColorInner: { value: new THREE.Color(colorInner) },
        uColorMid: { value: new THREE.Color(colorMid) },
        uColorOuter: { value: new THREE.Color(colorOuter) },
        uSpeed: { value: 1.0 },
        uIntensity: { value: 1.0 },
        uExpansion: { value: 0.0 },
      },
      vertexShader: shaderSource.vertexShader,
      fragmentShader: shaderSource.fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorCore, colorInner, colorMid, colorOuter, deviceTier]);

  useEffect(() => {
    if (matRef) {
      matRef.current = material;
    }
  }, [material, matRef]);

  // Dispose resources on unmount to prevent GPU memory leaks
  useEffect(() => {
    return () => {
      material.dispose();
      geometry.dispose();
    };
  }, [material, geometry]);

  return (
    <mesh position={[0, 0, -0.04]} geometry={geometry}>
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════
   ██  PREMIUM MULTI-TIER GATEWAY RINGS
   ═══════════════════════════════════════════════════════════ */
function InstancedSparks({ count, hovered, isWarping }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const sparkData = useMemo(() => {
    if (count <= 0) return [];
    const data = [];
    let s = 123;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    for (let i = 0; i < count; i++) {
      data.push({
        angle: (i / count) * Math.PI * 2,
        speed: 0.7 + rnd() * 0.9,
        radius: 1.48 + (rnd() - 0.5) * 0.15,
        baseScale: 0.024 + rnd() * 0.016,
      });
    }
    return data;
  }, [count]);

  const anglesRef = useRef([]);
  useEffect(() => {
    anglesRef.current = sparkData.map((d) => d.angle);
  }, [sparkData]);

  useFrame((state, delta) => {
    if (!meshRef.current || sparkData.length === 0) return;
    const dt = Math.min(delta, 0.033);
    const time = state.clock.elapsedTime % 628.31853;
    const speedMultiplier = isWarping ? 5.0 : hovered ? 2.5 : 1.0;

    for (let i = 0; i < sparkData.length; i++) {
      const item = sparkData[i];
      const prevAngle = anglesRef.current[i] ?? item.angle;
      anglesRef.current[i] = (prevAngle + dt * item.speed * speedMultiplier) % (Math.PI * 2);
      const curAngle = anglesRef.current[i];
      const pulse = Math.sin(time * 5.0 + i * 1.7) * 0.35 + 0.9;

      dummy.position.set(Math.cos(curAngle) * item.radius, Math.sin(curAngle) * item.radius, 0.02);
      dummy.scale.setScalar(item.baseScale * pulse);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (count <= 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.95}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

function MultiTierPortalRing({ color, glowColor, hovered, isWarping, deviceTier }) {
  const mainRingRef = useRef();
  const innerGlowRingRef = useRef();
  const gyroRingRef = useRef();
  const outerRippleRef = useRef();

  const isLow = deviceTier === 'low';
  const isMed = deviceTier === 'medium';
  const sparkCount = isLow ? 6 : isMed ? 10 : 16;

  // Memoize geometries once so hover triggers ZERO WebGL buffer reallocations
  const innerTorusGeom = useMemo(() => new THREE.TorusGeometry(1.50, 0.018, 10, isLow ? 36 : 64), [isLow]);
  const mainTorusGeom = useMemo(() => new THREE.TorusGeometry(1.78, 0.018, 12, isLow ? 36 : 64), [isLow]);
  const gyroTorusGeom = useMemo(() => (!isLow ? new THREE.TorusGeometry(2.08, 0.016, 12, isMed ? 40 : 64) : null), [isLow, isMed]);
  const outerTorusGeom = useMemo(() => (!isLow && !isMed ? new THREE.TorusGeometry(2.14, 0.008, 10, 64) : null), [isLow, isMed]);

  useEffect(() => {
    return () => {
      innerTorusGeom.dispose();
      mainTorusGeom.dispose();
      if (gyroTorusGeom) gyroTorusGeom.dispose();
      if (outerTorusGeom) outerTorusGeom.dispose();
    };
  }, [innerTorusGeom, mainTorusGeom, gyroTorusGeom, outerTorusGeom]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.033);
    const time = state.clock.elapsedTime % 628.31853;

    // Main ring — smooth rotation + pulsing emissive
    if (mainRingRef.current) {
      mainRingRef.current.rotation.z = (mainRingRef.current.rotation.z + dt * (isWarping ? 3.2 : hovered ? 0.75 : 0.3)) % (Math.PI * 200);
      const targetScale = isWarping ? 1.15 : hovered ? 1.06 : 1.0;
      mainRingRef.current.scale.x = THREE.MathUtils.damp(mainRingRef.current.scale.x, targetScale, 6, dt);
      mainRingRef.current.scale.y = mainRingRef.current.scale.x;
      mainRingRef.current.scale.z = mainRingRef.current.scale.x;

      // Pulsing emissive on main ring material
      const mat = mainRingRef.current.material;
      if (mat) {
        const basePulse = Math.sin(time * 2.8) * 0.3 + 0.7;
        mat.emissiveIntensity = THREE.MathUtils.damp(
          mat.emissiveIntensity,
          isWarping ? 8.0 : hovered ? 4.5 * basePulse + 1.5 : 2.2 * basePulse + 0.5,
          5, dt
        );
      }
    }

    // Inner glow ring — close to vortex, fast spin
    if (innerGlowRingRef.current) {
      innerGlowRingRef.current.rotation.z = (innerGlowRingRef.current.rotation.z - dt * (isWarping ? 4.0 : hovered ? 1.2 : 0.6)) % (Math.PI * 200);
      const glowPulse = Math.sin(time * 3.5) * 0.15 + 1.0;
      const mat = innerGlowRingRef.current.material;
      if (mat) {
        mat.opacity = THREE.MathUtils.damp(mat.opacity, hovered ? 0.6 * glowPulse : 0.3 * glowPulse, 5, dt);
      }
    }

    // Counter-rotating gyro ring (skip on low)
    if (!isLow && gyroRingRef.current) {
      gyroRingRef.current.rotation.z = (gyroRingRef.current.rotation.z - dt * (isWarping ? 2.6 : hovered ? 0.6 : 0.2)) % (Math.PI * 200);
      const gyroScale = isWarping ? 1.2 : hovered ? 1.05 : 1.0;
      gyroRingRef.current.scale.x = THREE.MathUtils.damp(gyroRingRef.current.scale.x, gyroScale, 6, dt);
      gyroRingRef.current.scale.y = gyroRingRef.current.scale.x;
      gyroRingRef.current.scale.z = gyroRingRef.current.scale.x;
    }

    // Outer ethereal ring (high only)
    if (!isLow && !isMed && outerRippleRef.current) {
      outerRippleRef.current.rotation.z = (outerRippleRef.current.rotation.z + dt * 0.15) % (Math.PI * 200);
      const breath = Math.sin(time * 2.0) * 0.04 + (hovered ? 1.08 : 1.02);
      outerRippleRef.current.scale.x = THREE.MathUtils.damp(outerRippleRef.current.scale.x, breath, 5, dt);
      outerRippleRef.current.scale.y = outerRippleRef.current.scale.x;
      outerRippleRef.current.scale.z = outerRippleRef.current.scale.x;
    }
  });

  return (
    <group>
      {/* ── Volumetric Nebula Backglow (radial gradient, no hard border) ── */}
      <GlowDisc
        color={glowColor}
        radius={isLow ? 2.2 : 3.2}
        opacity={hovered ? 0.28 : 0.14}
        segments={isLow ? 24 : isMed ? 32 : 48}
        position={[0, 0, -0.12]}
      />

      {/* ── Inner Glow Ring (close to vortex edge) ── */}
      <mesh ref={innerGlowRingRef} geometry={innerTorusGeom}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.6 : 0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ── Main Mid Neon Torus Ring ── */}
      <mesh ref={mainRingRef} geometry={mainTorusGeom}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 3.5 : 2.0}
          metalness={0.9}
          roughness={0.1}
          toneMapped={false}
        />
      </mesh>

      {/* ── Outer Orbital Track Ring ── */}
      {!isLow && gyroTorusGeom && (
        <group ref={gyroRingRef}>
          <mesh geometry={gyroTorusGeom}>
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={hovered ? 3.2 : 1.6}
              metalness={0.88}
              roughness={0.15}
              toneMapped={false}
            />
          </mesh>
        </group>
      )}

      {/* ── Ethereal Outer Glow Ripple ── */}
      {!isLow && !isMed && outerTorusGeom && (
        <mesh ref={outerRippleRef} geometry={outerTorusGeom}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={hovered ? 0.5 : 0.25}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* ── Single-Pass Instanced Orbiting Energy Sparks ── */}
      <InstancedSparks count={sparkCount} hovered={hovered} isWarping={isWarping} />

      {/* Unified Accent Point Light */}
      <pointLight
        color={color}
        intensity={isWarping ? 25 : hovered ? 12 : 5}
        distance={7.5}
        decay={2}
        position={[0, 0, 0.45]}
      />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   ██  HYPERSPACE WARP STREAKS (100% GPU-Accelerated Shader)
   ═══════════════════════════════════════════════════════════ */
const WarpStreaksShader = {
  vertexShader: `
    uniform float uTime;
    uniform float uSpeedMultiplier;
    attribute float aSpeed;
    attribute vec2 aPolar; // x: radius, y: angle
    attribute float aOffsetZ;
    varying float vAlpha;

    void main() {
      float span = 26.0;
      // Cyclical tunnel streaming on GPU with zero CPU involvement
      float z = mod(aOffsetZ + uTime * aSpeed * uSpeedMultiplier + 16.0, span) - 16.0;

      vec3 pos = vec3(cos(aPolar.y) * aPolar.x, sin(aPolar.y) * aPolar.x, z);
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      gl_PointSize = clamp(260.0 / -mvPosition.z, 2.0, 36.0);
      // Fade out smoothly at near and far tunnel limits
      float depthFade = smoothstep(-16.0, -10.0, z) * smoothstep(9.5, 4.0, z);
      vAlpha = depthFade;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    varying float vAlpha;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float r = length(coord) * 2.0;
      if (r > 1.0) discard;
      float falloff = pow(1.0 - r, 1.6);
      gl_FragColor = vec4(uColor, falloff * vAlpha * 0.92);
    }
  `,
};

function WarpStreaks({ groupRef, color, deviceTier, isActive = false }) {
  const streakCount = deviceTier === 'low' ? 40 : deviceTier === 'medium' ? 100 : 220;
  const matRef = useRef();

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const polar = new Float32Array(streakCount * 2);
    const speeds = new Float32Array(streakCount);
    const offsetsZ = new Float32Array(streakCount);
    const positions = new Float32Array(streakCount * 3);

    let seed = 42;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < streakCount; i++) {
      const angle = rnd() * Math.PI * 2;
      const radius = 0.4 + rnd() * 4.5;
      polar[i * 2] = radius;
      polar[i * 2 + 1] = angle;
      speeds[i] = 22.0 + rnd() * 28.0;
      offsetsZ[i] = (rnd() - 0.5) * 26.0;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('aPolar', new THREE.BufferAttribute(polar, 2));
    geom.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geom.setAttribute('aOffsetZ', new THREE.BufferAttribute(offsetsZ, 1));
    return geom;
  }, [streakCount]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSpeedMultiplier: { value: 1.0 },
        uColor: { value: new THREE.Color(color || '#00f0ff') },
      },
      vertexShader: WarpStreaksShader.vertexShader,
      fragmentShader: WarpStreaksShader.fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [color]);

  useEffect(() => {
    if (matRef.current?.uniforms?.uColor) {
      matRef.current.uniforms.uColor.value.set(color || '#00f0ff');
    }
  }, [color]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((_, delta) => {
    if (!groupRef.current || !groupRef.current.visible) return;
    const dt = Math.min(delta, 0.033);
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += dt;
    }
  });

  return (
    <group ref={groupRef} visible={isActive}>
      <points geometry={geometry}>
        <primitive object={material} ref={matRef} attach="material" />
      </points>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   ██  STUDENT ORBITING OBJECTS (Tier-Adaptive Revolving)
   ═══════════════════════════════════════════════════════════ */
const StudentObjects = memo(function StudentObjects({ hovered, deviceTier }) {
  const speed = hovered ? 0.85 : 0.42;
  const isLow = deviceTier === 'low';
  const isMed = deviceTier === 'medium';

  return (
    <group position={[0, 0, 0.2]}>
      {/* Graduation Cap (Universal: Low, Medium, High) */}
      <FloatingObject orbitRadius={2.4} orbitSpeed={speed} delay={0} scale={0.42}>
        <group rotation={[0.08, 0, 0]}>
          <mesh position={[0, 0.08, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[1.2, 0.05, 1.2]} />
            <meshStandardMaterial
              color="#00f0ff"
              emissive="#00aaff"
              emissiveIntensity={0.65}
              metalness={0.5}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.38, 0.3, 0.32, isLow ? 10 : isMed ? 14 : 20]} />
            <meshStandardMaterial
              color="#0055bb"
              emissive="#003388"
              emissiveIntensity={0.4}
            />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.04, isLow ? 6 : 12]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#00f0ff"
              emissiveIntensity={1.3}
            />
          </mesh>
          <mesh position={[0.26, 0.1, 0.15]} rotation={[0, 0, -0.1]}>
            <boxGeometry args={[0.5, 0.02, 0.03]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00f0ff"
              emissiveIntensity={1.2}
            />
          </mesh>
          <mesh position={[0.52, -0.05, 0.15]}>
            <cylinderGeometry args={[0.03, 0.06, 0.28, isLow ? 6 : 10]} />
            <meshStandardMaterial
              color="#00f0ff"
              emissive="#00f0ff"
              emissiveIntensity={1.5}
            />
          </mesh>
        </group>
      </FloatingObject>

      {/* Code Brackets </> (Universal: Low, Medium, High) */}
      <FloatingObject orbitRadius={2.65} orbitSpeed={speed * 0.75} delay={0.25} scale={0.36}>
        <group>
          <group position={[-0.5, 0, 0]}>
            <mesh position={[0.08, 0.18, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.08, 0.45, 0.08]} />
              <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.2} />
            </mesh>
            <mesh position={[0.08, -0.18, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.08, 0.45, 0.08]} />
              <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.2} />
            </mesh>
          </group>
          <mesh position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 7]}>
            <boxGeometry args={[0.08, 0.95, 0.08]} />
            <meshStandardMaterial color="#00aaff" emissive="#0088ff" emissiveIntensity={1.0} />
          </mesh>
          <group position={[0.5, 0, 0]}>
            <mesh position={[-0.08, 0.18, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.08, 0.45, 0.08]} />
              <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.2} />
            </mesh>
            <mesh position={[-0.08, -0.18, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.08, 0.45, 0.08]} />
              <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.2} />
            </mesh>
          </group>
        </group>
      </FloatingObject>

      {/* Atom symbol (Medium and High tiers) */}
      {!isLow && (
        <FloatingObject orbitRadius={2.3} orbitSpeed={speed * 1.15} delay={0.5} scale={0.32}>
          <group>
            <mesh>
              <sphereGeometry args={[0.22, isMed ? 12 : 18, isMed ? 12 : 18]} />
              <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.8} />
            </mesh>
            <mesh rotation={[0.4, 0, 0]}>
              <torusGeometry args={[0.7, 0.025, 6, isMed ? 24 : 36]} />
              <meshStandardMaterial color="#0088ff" emissive="#0088ff" emissiveIntensity={0.8} />
            </mesh>
            <mesh rotation={[0.4, 0, Math.PI / 3]}>
              <torusGeometry args={[0.7, 0.025, 6, isMed ? 24 : 36]} />
              <meshStandardMaterial color="#0088ff" emissive="#0088ff" emissiveIntensity={0.8} />
            </mesh>
            <mesh rotation={[0.4, 0, -Math.PI / 3]}>
              <torusGeometry args={[0.7, 0.025, 6, isMed ? 24 : 36]} />
              <meshStandardMaterial color="#0088ff" emissive="#0088ff" emissiveIntensity={0.8} />
            </mesh>
            <mesh position={[0.7, 0, 0]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#ffffff" emissive="#00f0ff" emissiveIntensity={2.0} />
            </mesh>
            <mesh position={[-0.35, 0.6, 0.1]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#ffffff" emissive="#00f0ff" emissiveIntensity={2.0} />
            </mesh>
            <mesh position={[-0.35, -0.6, -0.1]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#ffffff" emissive="#00f0ff" emissiveIntensity={2.0} />
            </mesh>
          </group>
        </FloatingObject>
      )}

      {/* Book (Medium and High tiers) */}
      {!isLow && (
        <FloatingObject orbitRadius={2.55} orbitSpeed={speed * 0.85} delay={0.75} scale={0.36}>
          <group rotation={[0.22, 0.3, 0]}>
            <mesh position={[0.02, 0, 0.06]}>
              <boxGeometry args={[0.76, 1, 0.04]} />
              <meshStandardMaterial color="#00d4ff" emissive="#0088ff" emissiveIntensity={0.55} />
            </mesh>
            <mesh position={[0.02, 0, -0.06]}>
              <boxGeometry args={[0.76, 1, 0.04]} />
              <meshStandardMaterial color="#0066cc" emissive="#0044aa" emissiveIntensity={0.45} />
            </mesh>
            <mesh position={[0.04, 0, 0]}>
              <boxGeometry args={[0.7, 0.94, 0.08]} />
              <meshStandardMaterial color="#eef8ff" emissive="#aaddff" emissiveIntensity={0.2} roughness={0.8} />
            </mesh>
            <mesh position={[-0.38, 0, 0]}>
              <boxGeometry args={[0.06, 1.02, 0.16]} />
              <meshStandardMaterial color="#003388" emissive="#002266" emissiveIntensity={0.65} />
            </mesh>
            <mesh position={[0.1, -0.52, 0]}>
              <boxGeometry args={[0.08, 0.22, 0.01]} />
              <meshStandardMaterial color="#00ffff" emissive="#00f0ff" emissiveIntensity={1.3} />
            </mesh>
          </group>
        </FloatingObject>
      )}
    </group>
  );
});

const EntrepreneurObjects = memo(function EntrepreneurObjects({ hovered, deviceTier }) {
  const speed = hovered ? 0.85 : 0.42;
  const isLow = deviceTier === 'low';
  const isMed = deviceTier === 'medium';

  return (
    <group position={[0, 0, 0.2]}>
      {/* Rocket (Universal: Low, Medium, High) */}
      <FloatingObject orbitRadius={2.4} orbitSpeed={speed} delay={0} scale={0.36}>
        <group rotation={[0, 0, Math.PI / 10]}>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.2, 0.24, 0.72, isLow ? 10 : isMed ? 14 : 20]} />
            <meshStandardMaterial
              color="#ff8800"
              emissive="#ff6600"
              emissiveIntensity={0.65}
              metalness={0.7}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <coneGeometry args={[0.2, 0.44, isLow ? 10 : isMed ? 14 : 20]} />
            <meshStandardMaterial
              color="#ffb800"
              emissive="#ff8800"
              emissiveIntensity={0.85}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0, 0.15, 0.22]}>
            <torusGeometry args={[0.07, 0.018, 6, isLow ? 8 : 16]} />
            <meshStandardMaterial color="#ffcc00" emissive="#ff9900" emissiveIntensity={1.1} />
          </mesh>
          <mesh position={[0, 0.15, 0.21]}>
            <circleGeometry args={[0.065, isLow ? 8 : 16]} />
            <meshStandardMaterial color="#88ffff" emissive="#44ccff" emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[0.25, -0.22, 0]} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.16, 0.32, 0.03]} />
            <meshStandardMaterial color="#ff4400" emissive="#ff3300" emissiveIntensity={0.65} />
          </mesh>
          <mesh position={[-0.25, -0.22, 0]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[0.16, 0.32, 0.03]} />
            <meshStandardMaterial color="#ff4400" emissive="#ff3300" emissiveIntensity={0.65} />
          </mesh>
          {!isMed && !isLow && (
            <>
              <mesh position={[0, -0.22, 0.25]} rotation={[0.2, 0, 0]}>
                <boxGeometry args={[0.03, 0.32, 0.16]} />
                <meshStandardMaterial color="#ff4400" emissive="#ff3300" emissiveIntensity={0.65} />
              </mesh>
              <mesh position={[0, -0.22, -0.25]} rotation={[-0.2, 0, 0]}>
                <boxGeometry args={[0.03, 0.32, 0.16]} />
                <meshStandardMaterial color="#ff4400" emissive="#ff3300" emissiveIntensity={0.65} />
              </mesh>
            </>
          )}
          <mesh position={[0, -0.34, 0]}>
            <cylinderGeometry args={[0.12, 0.16, 0.1, isLow ? 8 : 14]} />
            <meshStandardMaterial color="#553311" emissive="#331100" emissiveIntensity={0.4} metalness={0.9} />
          </mesh>
          <mesh position={[0, -0.6, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.14, 0.44, isLow ? 8 : 14]} />
            <meshStandardMaterial
              color="#ff3300"
              emissive="#ff5500"
              emissiveIntensity={2.6}
              transparent
              opacity={0.88}
            />
          </mesh>
          <mesh position={[0, -0.52, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.07, 0.28, isLow ? 6 : 12]} />
            <meshStandardMaterial
              color="#ffff00"
              emissive="#ffea00"
              emissiveIntensity={3.2}
            />
          </mesh>
        </group>
      </FloatingObject>

      {/* Lightbulb (Universal: Low, Medium, High) */}
      <FloatingObject orbitRadius={2.65} orbitSpeed={speed * 0.75} delay={0.25} scale={0.36}>
        <group>
          <mesh position={[0, 0.22, 0]}>
            <sphereGeometry args={[0.36, isLow ? 10 : isMed ? 14 : 18, isLow ? 10 : isMed ? 14 : 18]} />
            <meshStandardMaterial
              color="#ffdd00"
              emissive="#ffbb00"
              emissiveIntensity={1.4}
              transparent
              opacity={0.85}
              roughness={0.1}
            />
          </mesh>
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.26, 0.15, 0.22, isLow ? 8 : 14]} />
            <meshStandardMaterial
              color="#ffcc00"
              emissive="#ff9900"
              emissiveIntensity={1.2}
              transparent
              opacity={0.8}
            />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <octahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffff88" emissiveIntensity={3.0} />
          </mesh>
          <mesh position={[0, -0.24, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.16, isLow ? 8 : 14]} />
            <meshStandardMaterial color="#cca43b" metalness={0.9} roughness={0.2} />
          </mesh>
          {!isMed && !isLow && (
            <>
              <mesh position={[0, -0.2, 0]}>
                <torusGeometry args={[0.152, 0.015, 6, 18]} />
                <meshStandardMaterial color="#eedd88" metalness={0.95} />
              </mesh>
              <mesh position={[0, -0.26, 0]}>
                <torusGeometry args={[0.152, 0.015, 6, 18]} />
                <meshStandardMaterial color="#eedd88" metalness={0.95} />
              </mesh>
            </>
          )}
          <mesh position={[0, -0.33, 0]}>
            <sphereGeometry args={[0.05, isLow ? 6 : 10, isLow ? 6 : 10]} />
            <meshStandardMaterial color="#222222" roughness={0.8} />
          </mesh>
        </group>
      </FloatingObject>

      {/* Growth Chart (Medium and High tiers) */}
      {!isLow && (
        <FloatingObject orbitRadius={2.3} orbitSpeed={speed * 1.15} delay={0.5} scale={0.35}>
          <group>
            <mesh position={[0, -0.38, 0]}>
              <boxGeometry args={[1.1, 0.04, 0.14]} />
              <meshStandardMaterial color="#ff8800" emissive="#ff6600" emissiveIntensity={0.55} />
            </mesh>
            <mesh position={[-0.32, -0.2, 0]}>
              <boxGeometry args={[0.18, 0.36, 0.14]} />
              <meshStandardMaterial color="#ff7700" emissive="#ff5500" emissiveIntensity={0.65} />
            </mesh>
            <mesh position={[-0.02, -0.04, 0]}>
              <boxGeometry args={[0.18, 0.68, 0.14]} />
              <meshStandardMaterial color="#ffaa00" emissive="#ff8800" emissiveIntensity={0.75} />
            </mesh>
            <mesh position={[0.28, 0.14, 0]}>
              <boxGeometry args={[0.18, 1.04, 0.14]} />
              <meshStandardMaterial color="#ffcc00" emissive="#ffaa00" emissiveIntensity={0.95} />
            </mesh>
            <mesh position={[0.02, 0.22, 0.1]} rotation={[0, 0, -Math.PI / 4.5]}>
              <boxGeometry args={[0.05, 1.05, 0.05]} />
              <meshStandardMaterial color="#ffea00" emissive="#ffaa00" emissiveIntensity={1.25} />
            </mesh>
            <mesh position={[0.42, 0.62, 0.1]} rotation={[0, 0, -Math.PI / 4.5]}>
              <coneGeometry args={[0.12, 0.26, 12]} />
              <meshStandardMaterial color="#ffea00" emissive="#ffcc00" emissiveIntensity={1.9} />
            </mesh>
          </group>
        </FloatingObject>
      )}

      {/* Diamond / Gem (Medium and High tiers) */}
      {!isLow && (
        <FloatingObject orbitRadius={2.55} orbitSpeed={speed * 0.85} delay={0.75} scale={0.34}>
          <group rotation={[0.2, 0, 0]}>
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.24, 0.44, 0.2, 8]} />
              <meshStandardMaterial
                color="#ffb800"
                emissive="#ff8800"
                emissiveIntensity={0.95}
                metalness={0.95}
                roughness={0.1}
              />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.45, 0.45, 0.04, 8]} />
              <meshStandardMaterial
                color="#ffcc00"
                emissive="#ffaa00"
                emissiveIntensity={1.15}
                metalness={0.98}
                roughness={0.1}
              />
            </mesh>
            <mesh position={[0, -0.22, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.44, 0.44, 8]} />
              <meshStandardMaterial
                color="#ff9900"
                emissive="#ff6600"
                emissiveIntensity={0.85}
                metalness={0.95}
                roughness={0.12}
              />
            </mesh>
          </group>
        </FloatingObject>
      )}
    </group>
  );
});

/* ═══════════════════════════════════════════════════════════
   ██  PROCEDURAL 3D FLOATING ASTEROID PEDESTAL
   ═══════════════════════════════════════════════════════════ */
function createAsteroidGeometry(seed, radiusTop = 1.7, radiusBottom = 1.15, height = 0.44, segments = 16, depthScale = 0.45) {
  const heightSegs = Math.max(6, Math.floor(segments / 2));
  const geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments, heightSegs);
  const pos = geom.attributes.position;

  // Seeded hash for spatially coherent noise
  const hash = (x, y) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + seed * 0.0137) * 43758.5453;
    return n - Math.floor(n);
  };

  // Smooth value noise with bilinear interpolation
  const noise2D = (px, py) => {
    const ix = Math.floor(px);
    const iy = Math.floor(py);
    const fx = px - ix;
    const fy = py - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    return (
      hash(ix, iy) * (1 - ux) * (1 - uy) +
      hash(ix + 1, iy) * ux * (1 - uy) +
      hash(ix, iy + 1) * (1 - ux) * uy +
      hash(ix + 1, iy + 1) * ux * uy
    );
  };

  // Ridge noise — sharp creases and peaks like real rock fractures
  const ridgeNoise = (px, py) => {
    const n = noise2D(px, py);
    return 1.0 - Math.abs(n * 2.0 - 1.0);
  };

  // 5-octave FBM mixing smooth + ridge noise for rough rocky detail
  const fbmRough = (px, py) => {
    let val = 0;
    val += 0.4 * ridgeNoise(px, py);
    val += 0.25 * ridgeNoise(px * 2.3 + 5.3, py * 2.3 + 2.7);
    val += 0.15 * noise2D(px * 4.7 + 1.7, py * 4.7 + 8.1);
    val += 0.12 * ridgeNoise(px * 9.1 + 3.2, py * 9.1 + 6.4);
    val += 0.08 * noise2D(px * 17.0 + 7.5, py * 17.0 + 2.1);
    return val;
  };

  // Seeded per-vertex jitter for micro-roughness
  let jitterSeed = seed;
  const jitter = () => {
    jitterSeed = (jitterSeed * 9301 + 49297) % 233280;
    return jitterSeed / 233280 - 0.5;
  };

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const radius = Math.sqrt(x * x + z * z);

    // Handle center cap vertices
    if (radius < 0.001) {
      const centerNoise = (hash(seed + i, seed - i) - 0.5) * 0.04;
      pos.setY(i, y + centerNoise);
      continue;
    }

    const angle = Math.atan2(z, x);
    const normalizedY = (y + height / 2) / height; // 0 = bottom, 1 = top

    // Large-scale angular bumps — mix of sharp and smooth to break circular silhouette
    const bigBump =
      Math.sin(angle * 3 + seed * 1.1) * 0.18 +
      Math.sin(angle * 5 + seed * 2.7) * 0.1 +
      Math.sin(angle * 8 + seed * 0.3) * 0.06 +
      Math.sin(angle * 13 + seed * 4.1) * 0.035;

    // Rough FBM noise for craggy rock surface
    const roughNoise = (fbmRough(angle * 2.2 + seed * 0.05, normalizedY * 4.0) - 0.4) * 0.4;

    // Top surface stays flatter (pedestal), bottom gets extra craggy
    const topDamping = normalizedY > 0.75 ? 1.0 - (normalizedY - 0.75) / 0.25 * 0.65 : 1.0;
    const bottomBoost = normalizedY < 0.35 ? 1.0 + (0.35 - normalizedY) / 0.35 * 0.7 : 1.0;

    // High-frequency per-vertex jitter for micro-roughness (sharp facets)
    const microJitter = jitter() * 0.06 * (1.0 - normalizedY * 0.4);

    const radialDisp = (bigBump + roughNoise + microJitter) * topDamping * bottomBoost;
    const newRadius = radius + radialDisp;

    // Vertical displacement — rougher with ridge noise
    const vertRough = (fbmRough(angle * 3.0 + 10, radius * 6.0 + seed * 0.03) - 0.4) * 0.1;
    const vertJitter = jitter() * 0.03;
    const vertDisp = (vertRough + vertJitter) * topDamping;

    pos.setXYZ(
      i,
      Math.cos(angle) * newRadius,
      y + vertDisp,
      Math.sin(angle) * newRadius * depthScale
    );
  }

  geom.computeVertexNormals();
  return geom;
}

const AsteroidPedestal = memo(function AsteroidPedestal({ deviceTier, seed = 42 }) {
  const groupRef = useRef();
  const isLow = deviceTier === 'low';
  const isMed = deviceTier === 'medium';
  const segments = isLow ? 12 : isMed ? 18 : 26;

  const mainRockGeom = useMemo(() => {
    return createAsteroidGeometry(seed, 1.65, 1.1, 0.7, segments);
  }, [seed, segments]);

  const subRockGeom = useMemo(() => {
    if (isLow) return null;
    return createAsteroidGeometry(seed + 100, 1.1, 0.55, 0.45, isMed ? 12 : 18);
  }, [seed, isLow, isMed]);

  // Clean up WebGL resources on unmount to prevent GPU leaks
  useEffect(() => {
    return () => {
      mainRockGeom.dispose();
      if (subRockGeom) subRockGeom.dispose();
    };
  }, [mainRockGeom, subRockGeom]);

  useFrame((state) => {
    const time = state.clock.elapsedTime % 628.31853;
    if (groupRef.current) {
      // Gentle floating levitation bob synchronized with portal
      const bob = Math.sin(time * 1.5 + (seed % 10)) * 0.035;
      groupRef.current.position.y = -1.62 + bob;
      groupRef.current.position.z = -0.85;
      groupRef.current.rotation.y = Math.sin(time * 0.4 + (seed % 10)) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.62, -0.85]}>
      {/* Upper faceted rock slab */}
      <mesh geometry={mainRockGeom}>
        <meshStandardMaterial
          color="#101222"
          roughness={0.78}
          metalness={0.22}
          flatShading={true}
        />
      </mesh>

      {/* Lower craggy under-slab (medium/high tiers) */}
      {subRockGeom && (
        <mesh geometry={subRockGeom} position={[0, -0.42, 0]}>
          <meshStandardMaterial
            color="#0b0d18"
            roughness={0.88}
            metalness={0.18}
            flatShading={true}
          />
        </mesh>
      )}

      {/* Floating mini rock debris motes (high tier only) */}
      {!isLow && !isMed && (
        <>
          <mesh position={[-1.7, -0.05, 0.1]} rotation={[0.4, 0.8, 0.3]}>
            <dodecahedronGeometry args={[0.1, 0]} />
            <meshStandardMaterial color="#141628" roughness={0.8} flatShading={true} />
          </mesh>
          <mesh position={[1.65, -0.15, 0.1]} rotation={[0.8, 0.3, 0.5]}>
            <dodecahedronGeometry args={[0.085, 0]} />
            <meshStandardMaterial color="#141628" roughness={0.8} flatShading={true} />
          </mesh>
          <mesh position={[-1.3, -0.45, -0.2]} rotation={[0.2, 0.5, 0.7]}>
            <dodecahedronGeometry args={[0.07, 0]} />
            <meshStandardMaterial color="#0e1020" roughness={0.8} flatShading={true} />
          </mesh>
          <mesh position={[0.9, -0.55, 0.1]} rotation={[1.1, 0.2, 0.4]}>
            <dodecahedronGeometry args={[0.06, 0]} />
            <meshStandardMaterial color="#121426" roughness={0.8} flatShading={true} />
          </mesh>
        </>
      )}
    </group>
  );
});

/* ═══════════════════════════════════════════════════════════
   ██  UNIFIED PORTAL UNIT
   ═══════════════════════════════════════════════════════════ */
function PortalUnit({
  groupRef,
  textGroupRef,
  vortexMatRef,
  title,
  _subtitle,
  color,
  glowColor,
  colorMid,
  colorOuter,
  position,
  scale = 1,
  hovered,
  isWarping = false,
  deviceTier,
  onClick,
  onPointerEnter,
  onPointerLeave,
  children,
}) {
  const hitGeom = useMemo(() => new THREE.CircleGeometry(2.0, 16), []);
  useEffect(() => () => hitGeom.dispose(), [hitGeom]);

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {/* Invisible Hit Disc */}
      <mesh position={[0, 0, 0]} geometry={hitGeom}>
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* ── Multi-Tier Containment Rings ── */}
      <MultiTierPortalRing
        color={color}
        glowColor={glowColor}
        hovered={hovered}
        isWarping={isWarping}
        deviceTier={deviceTier}
      />

      {/* ── Cosmic Swirling Vortex ── */}
      <PortalVortex
        matRef={vortexMatRef}
        colorCore="#ffffff"
        colorInner={color}
        colorMid={colorMid}
        colorOuter={colorOuter}
        deviceTier={deviceTier}
      />

      {/* Orbiting Objects */}
      {children}

      {/* ── Procedural Floating Asteroid Pedestal ── */}
      <AsteroidPedestal
        deviceTier={deviceTier}
        seed={title === 'STUDENT' ? 1234 : 5678}
      />

      {/* ── Premium Text Labels ── */}
      <group ref={textGroupRef} renderOrder={10}>
        <Text
          position={[0, -2.18, 0.35]}
          fontSize={0.36}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.022}
          outlineColor={color}
          outlineOpacity={hovered ? 0.85 : 0.35}
          letterSpacing={0.22}
          fillOpacity={hovered ? 1 : 0.95}
          toneMapped={false}
        >
          {title}
        </Text>
      </group>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   ██  MAIN PORTAL GATEWAY CONTROLLER
   ═══════════════════════════════════════════════════════════ */
export default function PortalGateway() {
  const [hoveredPortal, setHoveredPortal] = useState(null);
  const setSelectedRole = useStore((s) => s.setSelectedRole);
  const setTransitioning = useStore((s) => s.setTransitioning);
  const isTransitioning = useStore((s) => s.isTransitioning);
  const transitionRole = useStore((s) => s.transitionRole);
  const recentSwitchRole = useStore((s) => s.recentSwitchRole);
  const deviceTier = useStore((s) => s.deviceTier);
  const camera = useThree((s) => s.camera);
  const viewport = useThree((s) => s.viewport);
  const size = useThree((s) => s.size);

  const mainSceneGroupRef = useRef();
  const studentGroupRef = useRef();
  const entrepreneurGroupRef = useRef();
  const studentTextRef = useRef();
  const entrepreneurTextRef = useRef();
  const studentVortexMatRef = useRef();
  const entrepreneurVortexMatRef = useRef();
  const warpStreaksGroupRef = useRef();
  const arrivalDampRef = useRef(recentSwitchRole ? 0.0 : 1.0);

  // ── Portal Entrance Animation State ──
  // Skip entrance if user is arriving from a role switch (hyperspace veil handles that)
  const entranceRef = useRef({
    active: !recentSwitchRole,
    startTime: -1, // set on first frame
    duration: deviceTier === 'low' ? 1000 : 1400,
    studentDelay: 0,
    entrepreneurDelay: 180,
    textRevealed: false,
  });

  const transitionRef = useRef({
    active: false,
    role: null,
    startTime: 0,
    duration: 1300,
    targetPos: [0, 0, 0],
    startCamPos: new THREE.Vector3(0, 0, 8),
    startFov: 60,
  });

  // Responsive layout — unified side-by-side dual portal architecture for both mobile & desktop
  const isMobile =
    size.width < 768 ||
    viewport.aspect < 1.08 ||
    viewport.width < 8.2;

  const isMedium = !isMobile && (size.width < 1024 || viewport.width < 12);

  // Unified side-by-side layout: Student on left, Entrepreneur on right
  // Use both width and height to ensure portals fill the screen well
  const portalScale = isMobile
    ? Math.min(0.55, Math.max(0.42, viewport.width * 0.115))
    : isMedium
      ? Math.min(0.82, Math.max(0.60, viewport.width / 18.0))
      : Math.min(1.0, Math.max(0.70, viewport.width / 16.0));

  const portalSpacing = isMobile
    ? Math.min(viewport.width * 0.24, 1.65)
    : isMedium
      ? Math.min(3.0, Math.max(2.2, viewport.width * 0.20))
      : Math.min(3.5, Math.max(2.6, viewport.width * 0.22));

  const portalY = isMobile ? 1.65 : isMedium ? 1.2 : 1.05;

  const studentPos = useMemo(
    () => [-portalSpacing, portalY, 0],
    [portalSpacing, portalY]
  );
  const entrepreneurPos = useMemo(
    () => [portalSpacing, portalY, 0],
    [portalSpacing, portalY]
  );

  const transitionDuration = deviceTier === 'low' ? 900 : 1100;

  const handlePortalClick = useCallback(
    (role) => {
      if (transitionRef.current.active || entranceRef.current.active) return;
      document.body.style.cursor = 'default';

      const targetX = role === 'student' ? studentPos[0] : entrepreneurPos[0];
      const targetY = role === 'student' ? studentPos[1] : entrepreneurPos[1];
      const target = [targetX, targetY, 0];

      transitionRef.current = {
        active: true,
        role,
        startTime: performance.now(),
        duration: transitionDuration,
        targetPos: target,
        startCamPos: camera.position.clone(),
        startFov: camera.fov,
      };

      if (deviceTier !== 'low' && warpStreaksGroupRef.current) {
        warpStreaksGroupRef.current.position.set(targetX, targetY, 0);
      }

      if (studentTextRef.current) studentTextRef.current.visible = false;
      if (entrepreneurTextRef.current) entrepreneurTextRef.current.visible = false;

      setTransitioning(true, role);
    },
    [camera, studentPos, entrepreneurPos, setTransitioning, transitionDuration, deviceTier]
  );

  const handlePointerEnter = useCallback((role) => {
    if (transitionRef.current.active || entranceRef.current.active) return;
    setHoveredPortal(role);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (transitionRef.current.active) return;
    setHoveredPortal(null);
    document.body.style.cursor = 'default';
  }, []);

  // Reset cursor on unmount to prevent stuck pointer
  useEffect(() => {
    return () => { document.body.style.cursor = 'default'; };
  }, []);

  // ── Frame Animation Loop ──
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.033);
    const isTransitioning = transitionRef.current.active;
    const isLow = deviceTier === 'low';

    // Safe cyclical time modulo (628.31853 = 100 * 2*PI) guarantees 30+ minute precision
    const TIME_WRAP = 628.31853;
    if (studentVortexMatRef.current) {
      studentVortexMatRef.current.uniforms.uTime.value =
        (studentVortexMatRef.current.uniforms.uTime.value + dt) % TIME_WRAP;
    }
    if (entrepreneurVortexMatRef.current) {
      entrepreneurVortexMatRef.current.uniforms.uTime.value =
        (entrepreneurVortexMatRef.current.uniforms.uTime.value + dt) % TIME_WRAP;
    }

    // ── 0a. Portal Entrance Animation (fly-in from deep space on page load) ──
    const entrance = entranceRef.current;
    if (entrance.active) {
      // Record start time on very first frame
      if (entrance.startTime === -1) {
        entrance.startTime = performance.now();
        // Initially hide text and set portals to scale 0
        if (studentTextRef.current) studentTextRef.current.visible = false;
        if (entrepreneurTextRef.current) entrepreneurTextRef.current.visible = false;
      }

      const now = performance.now();
      const baseElapsed = now - entrance.startTime;

      // Per-portal entrance progress with stagger delay
      const studentElapsed = Math.max(0, baseElapsed - entrance.studentDelay);
      const entrepreneurElapsed = Math.max(0, baseElapsed - entrance.entrepreneurDelay);
      const tStudent = Math.min(1.0, studentElapsed / entrance.duration);
      const tEntrepreneur = Math.min(1.0, entrepreneurElapsed / entrance.duration);

      // Smooth ease with elastic overshoot
      const entranceEase = (t) => {
        const s = smootherStep(t);
        // Elastic overshoot: overshoots to ~1.06 then settles
        const elastic = s < 0.85
          ? s / 0.85
          : 1.0 + Math.sin((s - 0.85) / 0.15 * Math.PI) * 0.06;
        return Math.min(elastic, 1.06);
      };

      const eStudent = entranceEase(tStudent);
      const eEntrepreneur = entranceEase(tEntrepreneur);

      // Start positions — portals arrive from far away, spread wider, deep Z
      const studentStartX = studentPos[0] - 5.0;
      const studentStartY = studentPos[1] + 2.5;
      const studentStartZ = -14;
      const entrepreneurStartX = entrepreneurPos[0] + 5.0;
      const entrepreneurStartY = entrepreneurPos[1] + 2.5;
      const entrepreneurStartZ = -14;

      // Interpolate Student portal
      if (studentGroupRef.current) {
        const clampedE = Math.min(eStudent, 1.0);
        studentGroupRef.current.position.x = THREE.MathUtils.lerp(studentStartX, studentPos[0], clampedE);
        studentGroupRef.current.position.y = THREE.MathUtils.lerp(studentStartY, studentPos[1], clampedE);
        studentGroupRef.current.position.z = THREE.MathUtils.lerp(studentStartZ, studentPos[2] || 0, clampedE);

        // Scale with elastic overshoot
        const s = portalScale * Math.min(eStudent, 1.0);
        const overshoot = eStudent > 1.0 ? eStudent : 1.0;
        const finalS = s * (tStudent < 1.0 ? overshoot : 1.0);
        studentGroupRef.current.scale.set(finalS, finalS, finalS);

        // Subtle tumble rotation that settles to 0
        if (!isLow) {
          studentGroupRef.current.rotation.z = THREE.MathUtils.lerp(0.3, 0, smootherStep(tStudent));
        }
      }

      // Interpolate Entrepreneur portal
      if (entrepreneurGroupRef.current) {
        const clampedE = Math.min(eEntrepreneur, 1.0);
        entrepreneurGroupRef.current.position.x = THREE.MathUtils.lerp(entrepreneurStartX, entrepreneurPos[0], clampedE);
        entrepreneurGroupRef.current.position.y = THREE.MathUtils.lerp(entrepreneurStartY, entrepreneurPos[1], clampedE);
        entrepreneurGroupRef.current.position.z = THREE.MathUtils.lerp(entrepreneurStartZ, entrepreneurPos[2] || 0, clampedE);

        const s = portalScale * Math.min(eEntrepreneur, 1.0);
        const overshoot = eEntrepreneur > 1.0 ? eEntrepreneur : 1.0;
        const finalS = s * (tEntrepreneur < 1.0 ? overshoot : 1.0);
        entrepreneurGroupRef.current.scale.set(finalS, finalS, finalS);

        if (!isLow) {
          entrepreneurGroupRef.current.rotation.z = THREE.MathUtils.lerp(-0.3, 0, smootherStep(tEntrepreneur));
        }
      }

      // Vortex spin-up during entrance — faster spinning that decays to idle
      if (studentVortexMatRef.current) {
        const spinUp = THREE.MathUtils.lerp(3.5, 1.0, smootherStep(tStudent));
        studentVortexMatRef.current.uniforms.uSpeed.value = spinUp;
        studentVortexMatRef.current.uniforms.uIntensity.value = THREE.MathUtils.lerp(1.8, 1.0, smootherStep(tStudent));
      }
      if (entrepreneurVortexMatRef.current) {
        const spinUp = THREE.MathUtils.lerp(3.5, 1.0, smootherStep(tEntrepreneur));
        entrepreneurVortexMatRef.current.uniforms.uSpeed.value = spinUp;
        entrepreneurVortexMatRef.current.uniforms.uIntensity.value = THREE.MathUtils.lerp(1.8, 1.0, smootherStep(tEntrepreneur));
      }

      // Check if both portals have finished arriving
      if (tStudent >= 1.0 && tEntrepreneur >= 1.0) {
        entrance.active = false;

        // Reveal text labels with a slight delay for polish
        if (!entrance.textRevealed) {
          entrance.textRevealed = true;
          if (studentTextRef.current) studentTextRef.current.visible = true;
          if (entrepreneurTextRef.current) entrepreneurTextRef.current.visible = true;
        }

        // Snap final transforms to clean values
        if (studentGroupRef.current) {
          studentGroupRef.current.position.set(studentPos[0], studentPos[1], studentPos[2] || 0);
          studentGroupRef.current.scale.set(portalScale, portalScale, portalScale);
          studentGroupRef.current.rotation.z = 0;
        }
        if (entrepreneurGroupRef.current) {
          entrepreneurGroupRef.current.position.set(entrepreneurPos[0], entrepreneurPos[1], entrepreneurPos[2] || 0);
          entrepreneurGroupRef.current.scale.set(portalScale, portalScale, portalScale);
          entrepreneurGroupRef.current.rotation.z = 0;
        }
      }
    }

    // 0b. Smooth Hyperspace Arrival Glide (when returning from switch path)
    if (arrivalDampRef.current < 1.0) {
      arrivalDampRef.current = THREE.MathUtils.damp(arrivalDampRef.current, 1.0, 4.2, dt);
      if (mainSceneGroupRef.current) {
        const arrivalProgress = arrivalDampRef.current;
        const arrivalScale = THREE.MathUtils.lerp(0.92, 1.0, arrivalProgress);
        mainSceneGroupRef.current.scale.set(arrivalScale, arrivalScale, arrivalScale);
      }
    }

    // 1. Mouse Parallax Tilt
    if (!isTransitioning && !entrance.active && mainSceneGroupRef.current) {
      const targetRotY = sharedMouse.x * 0.07;
      const targetRotX = -sharedMouse.y * 0.05;
      mainSceneGroupRef.current.rotation.y = THREE.MathUtils.damp(
        mainSceneGroupRef.current.rotation.y, targetRotY, 4, dt
      );
      mainSceneGroupRef.current.rotation.x = THREE.MathUtils.damp(
        mainSceneGroupRef.current.rotation.x, targetRotX, 4, dt
      );
    }

    // 2. Portal Vortex Speed/Intensity Updates (only when entrance is not driving them)
    if (!entrance.active && studentVortexMatRef.current) {
      const isHov = hoveredPortal === 'student';
      studentVortexMatRef.current.uniforms.uSpeed.value = THREE.MathUtils.damp(
        studentVortexMatRef.current.uniforms.uSpeed.value, isHov ? 2.2 : 1.0, 5, dt
      );
      studentVortexMatRef.current.uniforms.uIntensity.value = THREE.MathUtils.damp(
        studentVortexMatRef.current.uniforms.uIntensity.value, isHov ? 1.45 : 1.0, 5, dt
      );
    }

    if (!entrance.active && entrepreneurVortexMatRef.current) {
      const isHov = hoveredPortal === 'entrepreneur';
      entrepreneurVortexMatRef.current.uniforms.uSpeed.value = THREE.MathUtils.damp(
        entrepreneurVortexMatRef.current.uniforms.uSpeed.value, isHov ? 2.2 : 1.0, 5, dt
      );
      entrepreneurVortexMatRef.current.uniforms.uIntensity.value = THREE.MathUtils.damp(
        entrepreneurVortexMatRef.current.uniforms.uIntensity.value, isHov ? 1.45 : 1.0, 5, dt
      );
    }

    // 3. Smooth Hover Scale (skip while entrance is driving scale)
    if (!isTransitioning && !entrance.active) {
      if (studentGroupRef.current) {
        const ts = portalScale * (hoveredPortal === 'student' ? 1.05 : 1.0);
        studentGroupRef.current.scale.x = THREE.MathUtils.damp(studentGroupRef.current.scale.x, ts, 6, dt);
        studentGroupRef.current.scale.y = studentGroupRef.current.scale.x;
        studentGroupRef.current.scale.z = studentGroupRef.current.scale.x;
      }
      if (entrepreneurGroupRef.current) {
        const ts = portalScale * (hoveredPortal === 'entrepreneur' ? 1.05 : 1.0);
        entrepreneurGroupRef.current.scale.x = THREE.MathUtils.damp(entrepreneurGroupRef.current.scale.x, ts, 6, dt);
        entrepreneurGroupRef.current.scale.y = entrepreneurGroupRef.current.scale.x;
        entrepreneurGroupRef.current.scale.z = entrepreneurGroupRef.current.scale.x;
      }
    }

    // 4. Fly-Through Warp Transition
    if (isTransitioning) {
      const { startTime, duration, targetPos, startCamPos, startFov, role } =
        transitionRef.current;
      const elapsed = performance.now() - startTime;
      const t = Math.min(1.0, elapsed / duration);

      const smoothEase = smootherStep(t);
      const tPlunge = Math.pow(smoothEase, 1.8);

      const alignProgress = Math.min(1.0, smoothEase * 1.6);
      const cam = state.camera;
      cam.position.x = THREE.MathUtils.lerp(startCamPos.x, targetPos[0], alignProgress);
      cam.position.y = THREE.MathUtils.lerp(startCamPos.y, targetPos[1], alignProgress);
      cam.position.z = THREE.MathUtils.lerp(startCamPos.z, -6.5, tPlunge);

      // Subtle camera shake during acceleration
      if (!isLow && smoothEase > 0.3 && smoothEase < 0.7) {
        const shakeIntensity = Math.sin((smoothEase - 0.3) / 0.4 * Math.PI) * 0.04;
        const shakeTime = state.clock.elapsedTime * 35;
        cam.position.x += Math.sin(shakeTime) * shakeIntensity;
        cam.position.y += Math.cos(shakeTime * 1.3) * shakeIntensity * 0.7;
      }

      const fovProgress = Math.pow(smoothEase, 1.5);
      cam.fov = THREE.MathUtils.lerp(startFov, 96, fovProgress);
      cam.updateProjectionMatrix();
      cam.lookAt(targetPos[0], targetPos[1], -25);

      const isStudent = role === 'student';
      const selectedGroup = isStudent ? studentGroupRef.current : entrepreneurGroupRef.current;
      const unselectedGroup = isStudent ? entrepreneurGroupRef.current : studentGroupRef.current;
      const selectedVortex = isStudent ? studentVortexMatRef.current : entrepreneurVortexMatRef.current;

      if (unselectedGroup) {
        const fadeScale = Math.max(0, 1.0 - smoothEase * 2.8) * portalScale;
        unselectedGroup.scale.set(fadeScale, fadeScale, fadeScale);
        unselectedGroup.visible = fadeScale > 0.001;
      }

      if (selectedVortex) {
        selectedVortex.uniforms.uSpeed.value = 1.0 + smoothEase * 6.5;
        selectedVortex.uniforms.uIntensity.value = 1.0 + smoothEase * 3.8;
        if (smoothEase > 0.6) {
          const breach = Math.pow((smoothEase - 0.6) / 0.4, 2.0);
          selectedVortex.uniforms.uExpansion.value = breach * 7.5;
        }
      }

      if (selectedGroup) {
        let expandMultiplier = 1.0;
        if (smoothEase > 0.62) {
          expandMultiplier = 1.0 + Math.pow((smoothEase - 0.62) / 0.38, 1.6) * 8.0;
        }
        const s = portalScale * expandMultiplier;
        selectedGroup.scale.set(s, s, s);
      }

      if (t >= 1.0) {
        transitionRef.current.active = false;
        cam.position.set(0, 0, 8);
        cam.fov = 60;
        cam.updateProjectionMatrix();
        cam.lookAt(0, 0, 0); // Reset camera rotation to prevent crooked view on return
        // Restore text visibility for when user returns to role selection
        if (studentTextRef.current) studentTextRef.current.visible = true;
        if (entrepreneurTextRef.current) entrepreneurTextRef.current.visible = true;
        setSelectedRole(role);
        setTransitioning(false, null);
      }
    }
  });

  return (
    <group ref={mainSceneGroupRef}>
      {/* ── Student Portal ── */}
      <PortalUnit
        groupRef={studentGroupRef}
        textGroupRef={studentTextRef}
        vortexMatRef={studentVortexMatRef}
        title="STUDENT"
        subtitle="ACADEMIC JOURNEY"
        color="#00e8ff"
        glowColor="#0066dd"
        colorMid="#0044cc"
        colorOuter="#020018"
        position={studentPos}
        scale={portalScale}
        hovered={hoveredPortal === 'student'}
        isWarping={isTransitioning && transitionRole === 'student'}
        deviceTier={deviceTier}
        onClick={() => handlePortalClick('student')}
        onPointerEnter={() => handlePointerEnter('student')}
        onPointerLeave={handlePointerLeave}
      >
        <StudentObjects hovered={hoveredPortal === 'student'} deviceTier={deviceTier} />
      </PortalUnit>

      {/* ── Entrepreneur Portal ── */}
      <PortalUnit
        groupRef={entrepreneurGroupRef}
        textGroupRef={entrepreneurTextRef}
        vortexMatRef={entrepreneurVortexMatRef}
        title="ENTREPRENEUR"
        subtitle="BUSINESS VENTURES"
        color="#ffba00"
        glowColor="#cc5500"
        colorMid="#cc4400"
        colorOuter="#0a0014"
        position={entrepreneurPos}
        scale={portalScale}
        hovered={hoveredPortal === 'entrepreneur'}
        isWarping={isTransitioning && transitionRole === 'entrepreneur'}
        deviceTier={deviceTier}
        onClick={() => handlePortalClick('entrepreneur')}
        onPointerEnter={() => handlePointerEnter('entrepreneur')}
        onPointerLeave={handlePointerLeave}
      >
        <EntrepreneurObjects hovered={hoveredPortal === 'entrepreneur'} deviceTier={deviceTier} />
      </PortalUnit>

      {/* ── Warp Streaks ── */}
      <WarpStreaks
        groupRef={warpStreaksGroupRef}
        color={transitionRole === 'entrepreneur' ? '#ffba00' : '#00e8ff'}
        deviceTier={deviceTier}
        isActive={isTransitioning}
      />

      {/* ── Scene Lighting ── */}
      <ambientLight intensity={deviceTier === 'low' ? 0.35 : 0.2} />
      <directionalLight position={[5, 5, 6]} intensity={0.4} />
    </group>
  );
}
