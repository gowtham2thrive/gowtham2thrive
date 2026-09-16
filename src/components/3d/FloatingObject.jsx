import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const DEFAULT_POSITION = [0, 0, 0];
const TWO_PI = Math.PI * 2;
const WRAP_PERIOD = TWO_PI * 100; // Safe periodic modulo to guarantee 30+ minute float precision

export default function FloatingObject({
  children,
  position = DEFAULT_POSITION,
  orbitRadius = 2,
  orbitSpeed = 0.5,
  floatIntensity = 1,
  rotationIntensity = 0.5,
  bobSpeed = 1,
  scale = 1,
  delay = 0,
}) {
  const groupRef = useRef();
  const angleRef = useRef(delay * TWO_PI);
  const currentSpeedRef = useRef(orbitSpeed);

  useFrame((state, delta) => {
    // Clamp delta time to avoid large jumps when returning from background tabs
    const dt = Math.min(delta, 0.033);
    if (!groupRef.current) return;

    // Smooth inertia: smoothly damp current speed to target orbit speed
    currentSpeedRef.current = THREE.MathUtils.damp(currentSpeedRef.current, orbitSpeed, 3.8, dt);
    const effectiveSpeed = currentSpeedRef.current;

    // Smooth angle update with safe periodic wrapping for endless continuity
    angleRef.current = (angleRef.current + dt * effectiveSpeed) % WRAP_PERIOD;
    const angle = angleRef.current;
    const t = state.clock.elapsedTime % WRAP_PERIOD;

    // Compound organic micro-oscillation
    const microBob = Math.sin(t * 1.8 + delay * 4.2) * (0.06 * floatIntensity);
    const microSway = Math.cos(t * 1.3 + delay * 3.1) * (0.04 * floatIntensity);

    // Compound orbital trajectory around the portal center
    groupRef.current.position.x = position[0] + Math.cos(angle) * orbitRadius + microSway;
    groupRef.current.position.z = position[2] + Math.sin(angle) * orbitRadius;
    groupRef.current.position.y =
      position[1] +
      Math.sin(angle * bobSpeed * 2) * 0.16 +
      Math.sin(angle) * 0.20 +
      microBob;

    // Upright attitude: smooth yaw rotation combined with harmonic pitch/roll banking into orbital arc
    groupRef.current.rotation.y = (groupRef.current.rotation.y + dt * rotationIntensity * 0.8) % WRAP_PERIOD;
    groupRef.current.rotation.x = Math.sin(angle * 1.5 + t * 0.6) * 0.10;
    // Aerodynamic centrifugal banking into the turn based on current speed
    groupRef.current.rotation.z = Math.cos(angle * 1.2 + t * 0.5) * 0.07 - Math.sin(angle) * (effectiveSpeed * 0.09);
  });

  return (
    <group ref={groupRef} scale={scale}>
      {children}
    </group>
  );
}
