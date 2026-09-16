import { useMemo, useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import PlanetInscription from './PlanetInscription';

// ── Ultra-Fast, High-Performance Procedural Lunar Noise GLSL ──
// Zero loops, zero cell stepping, C1 continuous smooth lunar surface
const noiseGLSL = `
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // Smooth multi-scale lunar crater terrain without expensive Voronoi loops
  float lunarTerrain(vec2 p) {
    // Broad lunar maria plains
    float maria = smoothNoise(p * 0.15);

    // Primary impact crater rims (inverted ridge profile)
    float n1 = smoothNoise(p * 0.55 + vec2(1.7, 9.2));
    float rim1 = pow(1.0 - abs(n1 * 2.0 - 1.0), 3.0);

    // Secondary medium impacts
    float n2 = smoothNoise(p * 1.35 + vec2(6.1, 3.4));
    float rim2 = pow(1.0 - abs(n2 * 2.0 - 1.0), 2.2) * 0.45;

    // Fine regolith roughness
    float n3 = smoothNoise(p * 3.5 + vec2(2.8, 8.5));
    float fine = (1.0 - abs(n3 * 2.0 - 1.0)) * 0.20;

    return (rim1 + rim2 + fine) * (0.4 + 0.6 * maria);
  }
`;

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = `
  uniform vec3 uStudentLightPos;
  uniform vec3 uEntrepreneurLightPos;
  uniform vec3 uStudentColor;
  uniform vec3 uEntrepreneurColor;
  uniform float uCrestY;
  uniform float uRadius;
  uniform float uIsLow;
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  ${noiseGLSL}

  void main() {
    vec3 normal = normalize(vWorldNormal);
    if (!gl_FrontFacing) normal = -normal;
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    vec2 p = vWorldPosition.xy;
    // Scroll noise coordinates to simulate planetary rotation (like a tire spinning in place)
    p.x += uTime;

    // 1. Single-pass procedural lunar terrain with tier-adaptive ALU
    float h0 = 0.0;
    vec3 bumpNormal;
    if (uIsLow > 0.5) {
      // 5x faster ALU for low-end hardware: 1 noise octave and zero dFdx/dFdy
      h0 = smoothNoise(p * 0.45);
      bumpNormal = normal;
    } else {
      h0 = lunarTerrain(p);
      bumpNormal = normalize(normal - vec3(dFdx(h0) * 10.0, dFdy(h0) * 10.0, 0.0));
    }

    // 2. Ultra-deep obsidian basalt rock base (rich, nocturnal, almost black)
    vec3 basaltDark = vec3(0.006, 0.007, 0.010);
    vec3 basaltMid  = vec3(0.014, 0.017, 0.022);
    vec3 surfaceBase = mix(basaltDark, basaltMid, h0 * 0.45);

    // Deep shadowed floors inside crater depressions
    float craterFloor = smoothstep(0.40, 0.08, h0);
    surfaceBase = mix(surfaceBase, vec3(0.002, 0.003, 0.005), craterFloor * 0.50);

    // 3. Exact distance relative to the curved planetary crest
    float expectedCrestY = uCrestY - (vWorldPosition.x * vWorldPosition.x) / (2.0 * uRadius);
    float dy = vWorldPosition.y - expectedCrestY; // dy <= 0 on the front slope; dy > 0 behind crest

    // 4. Dynamic light from Student Portal (left)
    vec3 toS = uStudentLightPos - vWorldPosition;
    float distS = length(toS);
    vec3 dirS = toS / distS;
    float attenS = 1.0 / (1.0 + 0.038 * distS * distS);
    vec3 halfS = normalize(dirS + viewDir);
    float diffS = max(0.0, dot(bumpNormal, dirS));
    float specS = pow(max(0.0, dot(bumpNormal, halfS)), 22.0);

    // 5. Dynamic light from Entrepreneur Portal (right)
    vec3 toE = uEntrepreneurLightPos - vWorldPosition;
    float distE = length(toE);
    vec3 dirE = toE / distE;
    float attenE = 1.0 / (1.0 + 0.038 * distE * distE);
    vec3 halfE = normalize(dirE + viewDir);
    float diffE = max(0.0, dot(bumpNormal, dirE));
    float specE = pow(max(0.0, dot(bumpNormal, halfE)), 22.0);

    // 6. Horizon Crest Grazing Rim Reflection:
    // Tight, crisp celestial rim arc concentrated directly along the knife-edge crest
    float NdotV = clamp(dot(bumpNormal, viewDir), 0.0, 1.0);
    float fresnel = pow(1.0 - NdotV, 3.5);

    // Crest proximity factor: concentrated tightly along the crest curve
    float crestBand = exp(-abs(dy) * 5.2);

    // Dynamic grazing rim light directly reflecting the portal colors (ZERO fixed color ramps)
    vec3 rimLight = (uStudentColor * attenS * 1.85 + uEntrepreneurColor * attenE * 1.85) * (crestBand * 0.92 + fresnel * 0.18);

    // 7. Subtle surface reflection: tight, faint portal sheen on the dark rock face
    float slopeDepth = max(0.0, -dy);
    float depthGrad = 1.0 / (1.0 + 0.20 * slopeDepth);
    vec3 surfaceReflection = (uStudentColor * (diffS * 0.10 + specS * 0.18) * attenS +
                              uEntrepreneurColor * (diffE * 0.10 + specE * 0.18) * attenE) * depthGrad;

    // 8. Dark celestial body tone gently fading with depth into deep space shadow
    vec3 body = surfaceBase * (0.30 + 0.15 * (attenS + attenE)) * (0.25 + 0.75 * depthGrad);

    // 9. Total surface composition: dark obsidian basalt + subtle sheen + crisp horizon crest rim
    vec3 col = body + surfaceReflection + rimLight;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function PlanetHorizon() {
  const viewport = useThree((s) => s.viewport);
  const size = useThree((s) => s.size);
  const selectedRole = useStore((s) => s.selectedRole);
  const deviceTier = useStore((s) => s.deviceTier);
  const materialRef = useRef();

  const isMobile = size.width < 768 || viewport.width < 8.2;
  const isLow = deviceTier === 'low';

  // Single unified planet for ALL devices (desktop, tablet, mobile)
  const crestY = -1.65;
  const radius = 38;
  const zPos = -2.6;
  const width = Math.max(viewport.width * 1.6, 68);
  const height = 16.0;

  // Generate smooth curved terrain mesh with rounded crest
  const terrainGeometry = useMemo(() => {
    const segmentsX = isLow ? 48 : isMobile ? 64 : 96;
    const segmentsY = isLow ? 24 : isMobile ? 36 : 54;
    const geom = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
    const pos = geom.attributes.position;
    const crestV = 0.05;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const rawY = pos.getY(i);
      const v = (height / 2 - rawY) / height;

      const curveY = - (x * x) / (2.0 * radius);
      const curveZ = - (x * x) / (4.0 * radius);

      let y;
      let z;

      if (v < crestV) {
        const backFraction = (crestV - v) / crestV;
        y = crestY + curveY - backFraction * backFraction * 0.35;
        z = zPos + curveZ - backFraction * 1.2;
      } else {
        const frontV = (v - crestV) / (1.0 - crestV);
        y = crestY + curveY - frontV * (height * 0.75);
        z = zPos + curveZ + frontV * 3.2;
      }

      pos.setX(i, x);
      pos.setY(i, y);
      pos.setZ(i, z);
    }
    geom.computeVertexNormals();
    return geom;
  }, [width, height, crestY, radius, zPos, isMobile, isLow]);

  useEffect(() => {
    return () => terrainGeometry.dispose();
  }, [terrainGeometry]);

  // Unified side-by-side light positions matching the side-by-side portals
  const isMedium = !isMobile && (size.width < 1024 || viewport.width < 12);
  const portalSpacing = isMobile
    ? Math.min(viewport.width * 0.24, 1.65)
    : isMedium
      ? Math.min(3.0, Math.max(2.2, viewport.width * 0.20))
      : Math.min(3.5, Math.max(2.6, viewport.width * 0.22));
  const portalY = isMobile ? 1.65 : isMedium ? 1.2 : 1.05;

  const studentLightPos = useMemo(
    () => new THREE.Vector3(-portalSpacing, portalY, 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const entrepreneurLightPos = useMemo(
    () => new THREE.Vector3(portalSpacing, portalY, 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const studentColor = useMemo(() => new THREE.Color('#00e8ff'), []);
  const entrepreneurColor = useMemo(() => new THREE.Color('#ffba00'), []);

  // Update uniforms directly without recompiling shader material on resize or tier change
  useEffect(() => {
    studentLightPos.set(-portalSpacing, portalY, 0.5);
    entrepreneurLightPos.set(portalSpacing, portalY, 0.5);
    if (materialRef.current?.uniforms) {
      materialRef.current.uniforms.uStudentLightPos.value.copy(studentLightPos);
      materialRef.current.uniforms.uEntrepreneurLightPos.value.copy(entrepreneurLightPos);
      materialRef.current.uniforms.uIsLow.value = isLow ? 1.0 : 0.0;
    }
  }, [portalSpacing, portalY, studentLightPos, entrepreneurLightPos, isLow]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uStudentLightPos: { value: studentLightPos },
        uEntrepreneurLightPos: { value: entrepreneurLightPos },
        uStudentColor: { value: studentColor },
        uEntrepreneurColor: { value: entrepreneurColor },
        uCrestY: { value: crestY },
        uRadius: { value: radius },
        uIsLow: { value: isLow ? 1.0 : 0.0 },
        uTime: { value: 0.0 },
      },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  if (selectedRole) return null;

  return (
    <PlanetScene
      terrainGeometry={terrainGeometry}
      material={material}
      materialRef={materialRef}
      crestY={crestY}
      planetRadius={radius}
      zPos={zPos}
    />
  );
}

/* Separated into its own component so useFrame can run inside PlanetHorizon's render tree */
function PlanetScene({ terrainGeometry, material, materialRef, crestY, planetRadius, zPos }) {
  // Simulate planetary rotation by scrolling surface noise in the shader
  useFrame((_, delta) => {
    if (materialRef.current?.uniforms?.uTime) {
      materialRef.current.uniforms.uTime.value += Math.min(delta, 0.033) * 0.12;
    }
  });

  return (
    <group>
      {/* ── Single Unified Planet for Desktop and Mobile ── */}
      <mesh
        geometry={terrainGeometry}
        position={[0, 0, 0]}
        renderOrder={1}
      >
        <primitive object={material} ref={materialRef} attach="material" />
      </mesh>

      {/* ── Classical Roman Inscription Engraved on the Planet Slope ── */}
      <PlanetInscription
        crestY={crestY}
        planetRadius={planetRadius}
        zPos={zPos}
      />
    </group>
  );
}
