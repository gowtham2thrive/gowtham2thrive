import { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import ParticleField from '../3d/ParticleField';
import AsteroidObject from '../3d/AsteroidObject';
import EntrepreneurPlaceholder from '../sections/entrepreneur/EntrepreneurPlaceholder';
import Navbar from '../layout/Navbar';
import useStore from '../../store/useStore';
import './Portfolio.css';

export default function EntrepreneurPortfolio() {
  const containerRef = useRef(null);
  const deviceTier = useStore((s) => s.deviceTier);
  const isSwitchingPath = useStore((s) => s.isSwitchingPath);
  const [isEntering, setIsEntering] = useState(true);
  const [isTabHidden, setIsTabHidden] = useState(false);

  const dpr = deviceTier === 'low' ? 1 : deviceTier === 'medium' ? [1, 1.5] : [1, 2];

  // Hyperspace arrival deceleration settle
  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 700);
    return () => clearTimeout(timer);
  }, []);

  // Pause rendering when tab is hidden to save GPU and battery
  useEffect(() => {
    const handleVisibilityChange = () => setIsTabHidden(document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    // Apply entrepreneur accent colors
    const root = document.documentElement;
    root.style.setProperty('--color-accent-primary', '#ffb800');
    root.style.setProperty('--color-accent-secondary', '#ff6b00');
    root.style.setProperty('--color-accent-glow', 'rgba(255, 184, 0, 0.4)');
    root.style.setProperty('--color-accent-gradient', 'linear-gradient(135deg, #ffb800, #ff6b00)');
  }, []);

  const canvasElRef = useRef(null);
  const contextLostHandlerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (canvasElRef.current && contextLostHandlerRef.current) {
        canvasElRef.current.removeEventListener('webglcontextlost', contextLostHandlerRef.current, false);
      }
    };
  }, []);

  return (
    <div
      className={`portfolio entrepreneur-portfolio ${isEntering ? 'entrance-hyperspace' : ''} ${isSwitchingPath ? 'switching-out' : ''}`}
      ref={containerRef}
    >
      {/* Background 3D canvas */}
      <div className="portfolio-canvas">
        <Canvas
          camera={{ position: [0, 0, 7.2], fov: 50 }}
          dpr={dpr}
          frameloop={isTabHidden ? 'never' : 'always'}
          flat={deviceTier === 'low'}
          style={{ width: '100%', height: '100%', display: 'block' }}
          gl={{
            antialias: deviceTier !== 'low',
            alpha: true,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true,
          }}
          onCreated={({ gl }) => {
            const onLost = (e) => e.preventDefault();
            const canvasEl = gl.domElement;
            canvasElRef.current = canvasEl;
            contextLostHandlerRef.current = onLost;
            canvasEl.addEventListener('webglcontextlost', onLost, false);
          }}
        >
          <Suspense fallback={null}>
            <ParticleField />
            <AsteroidObject deviceTier={deviceTier} seed={5678} position={[0, 0.75, 0]} />
          </Suspense>
        </Canvas>
      </div>

      <Navbar />

      <main className="portfolio-main">
        <EntrepreneurPlaceholder />
      </main>

      {/* Outcoming Switch Path Transition Overlay */}
      {isSwitchingPath && <div className="switch-exit-overlay entrepreneur" />}
    </div>
  );
}
