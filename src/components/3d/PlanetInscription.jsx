import { useRef, useMemo, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';

/**
 * Utility: Linear RGB interpolation
 */
function lerpRGB(c1, c2, t) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ];
}

/**
 * Color ramp: Electric Cyan (left) -> Crisp White/Silver (center) -> Golden Amber (right)
 */
function getInscriptionColor(t) {
  const stops = [
    { t: 0.00, c: [0, 232, 255] },    // Pure electric cyan
    { t: 0.22, c: [72, 218, 255] },   // Sky cyan
    { t: 0.42, c: [214, 240, 255] },  // Pale ice
    { t: 0.50, c: [255, 255, 255] },  // Pure white center
    { t: 0.58, c: [255, 240, 208] },  // Warm ivory
    { t: 0.78, c: [255, 194, 60] },   // Radiant gold
    { t: 1.00, c: [255, 150, 0] },    // Rich golden amber
  ];

  const clampedT = Math.max(0, Math.min(1, t));
  let idx = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    if (clampedT >= stops[i].t && clampedT <= stops[i + 1].t) {
      idx = i;
      break;
    }
  }
  const s0 = stops[idx];
  const s1 = stops[idx + 1];
  const factor = (clampedT - s0.t) / (s1.t - s0.t);
  return lerpRGB(s0.c, s1.c, factor);
}

/**
 * PlanetInscription
 * Renders the monumental two-line Roman engraved inscription:
 * "Explore the Two Sides"
 * "of My Journey"
 * curved concentrically into the lunar basalt rock face.
 * Features:
 * - Authentic two-line concentric spherical curvature hugging the planet
 * - Monumental Roman serif typography in Cormorant Garamond
 * - Multi-pass chiseled V-carve relief with ambient occlusion depth, cavity shadow & bevel rim
 * - Subtly chiseled architectural baseline groove in the stone beneath Line 2
 * - Dual split lighting: electric cyan on the left, warm golden amber on the right
 * - Conformal 3D geometry hugging the lunar terrain surface
 */
export default function PlanetInscription({ crestY, planetRadius, zPos = -2.6, terrainHeight = 16.0 }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const viewport = useThree((s) => s.viewport);
  const size = useThree((s) => s.size);
  const isTransitioning = useStore((s) => s.isTransitioning);
  const [fontsLoaded, setFontsLoaded] = useState(() => {
    return typeof document !== 'undefined' && (!document.fonts || document.fonts.status === 'loaded');
  });

  // Responsive device check
  const isMobile =
    size.width < 768 ||
    viewport.aspect < 1.08 ||
    viewport.width < 8.2;

  // Ensure canvas re-renders when web fonts finish downloading
  useEffect(() => {
    let active = true;
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        if (active) setFontsLoaded(true);
      });
      document.fonts.load('700 114px "Cormorant Garamond"').then(() => {
        if (active) setFontsLoaded(true);
      }).catch(() => {});
      document.fonts.load('700 114px "Cinzel"').then(() => {
        if (active) setFontsLoaded(true);
      }).catch(() => {});
    }
    return () => {
      active = false;
    };
  }, []);

  // Create crisp offscreen canvas texture with authentic chiseled stone relief
  const texture = useMemo(() => {
    if (!fontsLoaded) {
      // Recomputes on font resolve
    }

    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 280;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 1;
      fallbackCanvas.height = 1;
      return new THREE.CanvasTexture(fallbackCanvas);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const cx = w / 2;

    // ── Helper: Draw Chiseled Roman Characters Along an Arc ──
    const drawChiseledLine = (text, charWidths, R, cyCenter, startAngle, totalAngle, font, gradHeight) => {
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let curAngle = startAngle;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const halfCw = charWidths[i] / 2;
        const charAngle = curAngle + halfCw / R;
        curAngle += charWidths[i] / R;

        if (char === ' ') continue;

        const charX = cx + R * Math.sin(charAngle);
        const charY = cyCenter - R * Math.cos(charAngle);

        // Smooth normalized coordinate from 0 (leftmost letter) to 1 (rightmost letter)
        const t = Math.max(0, Math.min(1, (charAngle - startAngle) / totalAngle));
        const rgb = getInscriptionColor(t);
        const colStr = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

        const specRgb = lerpRGB(rgb, [255, 255, 255], 0.70);
        const specStr = `rgba(${specRgb[0]}, ${specRgb[1]}, ${specRgb[2]}, 0.88)`;

        ctx.save();
        ctx.translate(charX, charY);
        ctx.rotate(charAngle);

        // Vertical facet gradient catching light from the portals above
        const charGrad = ctx.createLinearGradient(0, -gradHeight, 0, gradHeight);
        const topRgb = lerpRGB(rgb, [255, 255, 255], 0.50);
        const botRgb = lerpRGB(rgb, [0, 0, 0], 0.35);
        charGrad.addColorStop(0.00, `rgb(${topRgb[0]}, ${topRgb[1]}, ${topRgb[2]})`);
        charGrad.addColorStop(0.48, colStr);
        charGrad.addColorStop(1.00, `rgb(${botRgb[0]}, ${botRgb[1]}, ${botRgb[2]})`);

        // Pass 1: Deep cavity shadow (ambient occlusion cast downward into the basalt)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.98)';
        ctx.fillText(char, 2.8, 5.2);

        // Pass 2: Secondary ambient cavity occlusion
        ctx.shadowColor = 'rgba(0, 0, 0, 0.90)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillText(char, 1.4, 3.0);

        // Pass 3: Ambient cavity glow reflecting portal light inside the cut
        const glowColor = t < 0.45 ? 'rgba(0, 232, 255, 0.55)' : t > 0.55 ? 'rgba(255, 160, 0, 0.55)' : 'rgba(240, 248, 255, 0.45)';
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 14;
        ctx.fillStyle = charGrad;
        ctx.fillText(char, 0, 0);

        // Pass 4: Core crystalline metallic body of the letter
        ctx.shadowBlur = 0;
        ctx.fillStyle = charGrad;
        ctx.fillText(char, 0, 0);

        // Pass 5: Crisp knife-edge specular bevel highlight along top/left edge
        ctx.strokeStyle = specStr;
        ctx.lineWidth = 1.45;
        ctx.strokeText(char, -0.6, -1.0);

        ctx.restore();
      }
    };

    // ── Single Majestic Sweeping Arc Spanning Across the Planet ──
    const R_arc = 6400;
    const cy_center = 105 + R_arc;

    const text = 'Explore the Two Sides of My Journey';
    const font = '700 114px "Cormorant Garamond", "Cinzel", Georgia, serif';
    ctx.font = font;

    const charWidths = [];
    let totalWidth = 0;
    const charSpacing = 4.0;
    for (let i = 0; i < text.length; i++) {
      const cw = ctx.measureText(text[i]).width + charSpacing;
      charWidths.push(cw);
      totalWidth += cw;
    }

    const totalAngle = totalWidth / R_arc;
    const startAngle = -totalAngle / 2;

    drawChiseledLine(text, charWidths, R_arc, cy_center, startAngle, totalAngle, font, 58);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    tex.generateMipmaps = true;
    tex.anisotropy = 4;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [fontsLoaded]);

  useEffect(() => {
    return () => {
      if (texture) texture.dispose();
    };
  }, [texture]);

  // Grand ribbon dimensions spanning gracefully across the planet
  const ribbonWidth = isMobile
    ? Math.min(viewport.width * 0.96, 12.0)
    : Math.min(viewport.width * 0.75, 11.2);

  // Height calibrated with optimal vertical presence for mobile & desktop
  const heightFactor = isMobile ? 1.35 : 1.15;
  const ribbonHeight = ribbonWidth * (280 / 2048) * heightFactor;

  // Center Y position in the expansive sweet spot of the planet slope
  const screenBottomY = -viewport.height / 2;
  const visiblePlanetMidY = (crestY + screenBottomY) * 0.5;
  const posY = isMobile ? visiblePlanetMidY + 0.15 : visiblePlanetMidY - 0.04;

  // Geometry conforming precisely to the 3D terrain slope at every vertex
  const geometry = useMemo(() => {
    const segmentsX = isMobile ? 48 : 72;
    const segmentsY = isMobile ? 16 : 24;
    const geom = new THREE.PlaneGeometry(ribbonWidth, ribbonHeight, segmentsX, segmentsY);
    const pos = geom.attributes.position;

    const terrainH = terrainHeight || 16.0;
    const radius = Math.max(planetRadius, 14);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const rawY = pos.getY(i);

      // World-space Y coordinate of this vertex
      const worldY = posY + rawY;

      // Exact terrain horizon curvature and depth matching PlanetHorizon.jsx
      const curveY = - (x * x) / (2.0 * radius);
      const curveZ = - (x * x) / (4.0 * radius);

      // Distance below crest at this X coordinate
      const crestAtX = crestY + curveY;
      const distBelowCrest = crestAtX - worldY;

      let terrainZ;
      if (distBelowCrest < 0.0) {
        // Over crest: curve backwards
        const backFraction = Math.min(1.0, (-distBelowCrest) / 0.5);
        terrainZ = zPos + curveZ - backFraction * 1.2;
      } else {
        // Front slope: tilt forward towards camera
        const v = distBelowCrest / (terrainH * 0.75);
        terrainZ = zPos + curveZ + v * 3.2;
      }

      // Hug terrain surface with offset to prevent z-fighting
      pos.setZ(i, terrainZ + 0.038);
    }

    geom.computeVertexNormals();
    return geom;
  }, [ribbonWidth, ribbonHeight, planetRadius, posY, crestY, zPos, terrainHeight, isMobile]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  // Shader material with NormalBlending so chiseled shadows genuinely darken basalt
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uTime: { value: 0 },
        uOpacity: { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uOpacity;
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        void main() {
          vec4 texColor = texture2D(uTexture, vUv);

          // Moving subtle starlight sheen across metallic letter bevels
          float shimmer = sin(vWorldPosition.x * 1.5 - uTime * 1.2) * 0.10 + 0.95;
          vec3 col = texColor.rgb * shimmer;

          gl_FragColor = vec4(col, texColor.a * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -2,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
    });
  }, [texture]);

  useEffect(() => {
    return () => shaderMaterial.dispose();
  }, [shaderMaterial]);

  useFrame((state, delta) => {
    if (materialRef.current?.uniforms?.uTime) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime % 628.31853;
      const targetOpacity = isTransitioning ? 0.0 : 1.0;
      materialRef.current.uniforms.uOpacity.value = THREE.MathUtils.damp(
        materialRef.current.uniforms.uOpacity.value,
        targetOpacity,
        8,
        delta
      );
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[0, posY, 0]}
      renderOrder={5}
    >
      <primitive key={shaderMaterial.uuid} object={shaderMaterial} ref={materialRef} attach="material" />
    </mesh>
  );
}
