import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { sharedMouse } from '../../store/useStore';

/* ═══════════════════════════════════════════════════════════
   RADIAL GRADIENT GLOW DISC (Same as Portal Aura)
   ═══════════════════════════════════════════════════════════ */
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
      float alpha = pow(max(0.0, 1.0 - r), 2.5) * uOpacity;
      vec3 col = uColor * (1.0 + (1.0 - r) * 0.5);
      gl_FragColor = vec4(col, alpha);
    }
  `,
};

function GlowDisc({ color = '#ffb800', radius = 2.8, opacity = 0.28, segments = 36, position = [0, 0, -0.4] }) {
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

  useEffect(() => {
    if (matRef.current?.uniforms?.uOpacity) {
      matRef.current.uniforms.uOpacity.value = opacity;
    }
  }, [opacity]);

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
   PROCEDURAL 3D FLOATING ASTEROID (Same as Portal Pedestal)
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

export default function AsteroidObject({ deviceTier = 'high', seed = 5678, position = [0, 0.75, 0] }) {
  const groupRef = useRef();
  const { size } = useThree();
  const isMobile = size.width < 768;

  const isLow = deviceTier === 'low';
  const isMed = deviceTier === 'medium';
  const segments = isLow ? 14 : isMed ? 20 : 28;

  // Main rock body — identical proportions to portal pedestal
  const mainRockGeom = useMemo(() => {
    return createAsteroidGeometry(seed, 1.65, 1.1, 0.75, segments, 0.55);
  }, [seed, segments]);

  // Secondary sub-crag attached to the underside
  const subRockGeom = useMemo(() => {
    if (isLow) return null;
    return createAsteroidGeometry(seed + 100, 1.15, 0.6, 0.5, isMed ? 12 : 18, 0.5);
  }, [seed, isLow, isMed]);

  // Clean up WebGL resources on unmount
  useEffect(() => {
    return () => {
      mainRockGeom.dispose();
      if (subRockGeom) subRockGeom.dispose();
    };
  }, [mainRockGeom, subRockGeom]);

  const targetScale = isMobile ? 1.15 : 1.45;
  const targetPosY = isMobile ? (position[1] + 0.2) : position[1];

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    if (groupRef.current) {
      // Gentle floating levitation bob
      const bob = Math.sin(time * 1.4) * 0.08;
      groupRef.current.position.y = targetPosY + bob - sharedMouse.y * 0.15;
      groupRef.current.position.x = position[0] + sharedMouse.x * 0.2;
      groupRef.current.position.z = position[2] || 0;

      // Organic tumbling rotation with subtle mouse tilt
      groupRef.current.rotation.y += delta * 0.28;
      groupRef.current.rotation.x = Math.sin(time * 0.45) * 0.12 + sharedMouse.y * 0.1;
      groupRef.current.rotation.z = Math.cos(time * 0.35) * 0.08 - sharedMouse.x * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[position[0], targetPosY, position[2] || 0]} scale={targetScale}>
      {/* ── Scene Lights around Asteroid ── */}
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} color="#ffffff" />
      {/* Warm golden key light reflecting on the rocky facets */}
      <pointLight position={[-2.2, 1.2, 2.0]} intensity={4.2} color="#ffb800" distance={10} />
      {/* Amber rim light from below */}
      <pointLight position={[2.2, -1.2, 1.5]} intensity={3.0} color="#ff6b00" distance={9} />
      {/* Soft back rim light for cosmic rim definition */}
      <pointLight position={[0, 0.5, -2.0]} intensity={2.5} color="#ff9900" distance={8} />

      {/* ── Soft Warm Backdrop Aura Disc ── */}
      <GlowDisc color="#ffb800" radius={2.7} opacity={0.25} position={[0, 0, -0.45]} />

      {/* ── Main Rock Slab ── */}
      <mesh geometry={mainRockGeom}>
        <meshStandardMaterial
          color="#1b1e33"
          roughness={0.72}
          metalness={0.28}
          flatShading={true}
        />
      </mesh>

      {/* ── Lower Craggy Under-slab ── */}
      {subRockGeom && (
        <mesh geometry={subRockGeom} position={[0, -0.45, 0]}>
          <meshStandardMaterial
            color="#111322"
            roughness={0.85}
            metalness={0.22}
            flatShading={true}
          />
        </mesh>
      )}

      {/* ── Orbiting Floating Mini Asteroids / Debris ── */}
      {!isLow && (
        <>
          <mesh position={[-1.85, 0.1, 0.25]} rotation={[0.4, 0.8, 0.3]}>
            <dodecahedronGeometry args={[0.13, 0]} />
            <meshStandardMaterial color="#1f233d" roughness={0.75} metalness={0.25} flatShading={true} />
          </mesh>
          <mesh position={[1.8, -0.2, 0.2]} rotation={[0.8, 0.3, 0.5]}>
            <dodecahedronGeometry args={[0.11, 0]} />
            <meshStandardMaterial color="#1d2139" roughness={0.75} metalness={0.25} flatShading={true} />
          </mesh>
          <mesh position={[-1.4, -0.55, -0.3]} rotation={[0.2, 0.5, 0.7]}>
            <dodecahedronGeometry args={[0.09, 0]} />
            <meshStandardMaterial color="#16192c" roughness={0.8} metalness={0.2} flatShading={true} />
          </mesh>
          <mesh position={[1.1, -0.7, 0.25]} rotation={[1.1, 0.2, 0.4]}>
            <dodecahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial color="#16192c" roughness={0.8} metalness={0.2} flatShading={true} />
          </mesh>
          <mesh position={[0.2, 0.7, -0.6]} rotation={[0.5, 0.9, 0.1]}>
            <dodecahedronGeometry args={[0.07, 0]} />
            <meshStandardMaterial color="#1e223a" roughness={0.78} metalness={0.25} flatShading={true} />
          </mesh>
        </>
      )}
    </group>
  );
}
