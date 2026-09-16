import { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import ParticleField from '../3d/ParticleField';
import {
  HeroStudent,
  ProjectsStudent,
  ExperienceStudent,
  EventsStudent,
  EducationStudent,
  ContactStudent,
} from '../sections/student';
import Navbar from '../layout/Navbar';
import ScrollProgress from '../layout/ScrollProgress';
import useStore from '../../store/useStore';
import './Portfolio.css';

export default function StudentPortfolio() {
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
    // Apply student accent colors
    const root = document.documentElement;
    root.style.setProperty('--color-accent-primary', '#00f0ff');
    root.style.setProperty('--color-accent-secondary', '#0088ff');
    root.style.setProperty('--color-accent-glow', 'rgba(0, 240, 255, 0.4)');
    root.style.setProperty('--color-accent-gradient', 'linear-gradient(135deg, #00f0ff, #0088ff)');
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
      className={`portfolio student-portfolio ${isEntering ? 'entrance-hyperspace' : ''} ${isSwitchingPath ? 'switching-out' : ''}`}
      ref={containerRef}
    >
      {/* Background 3D canvas */}
      <div className="portfolio-canvas">
        <Canvas
          camera={{ position: [0, 0, 15], fov: 60 }}
          dpr={dpr}
          frameloop={isTabHidden ? 'never' : 'always'}
          flat
          style={{ width: '100%', height: '100%', display: 'block' }}
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: 'low-power',
            stencil: false,
            depth: false,
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
          </Suspense>
        </Canvas>
      </div>

      <ScrollProgress />
      <Navbar />

      <main className="portfolio-main">
        <HeroStudent />
        <ProjectsStudent />
        <ExperienceStudent />
        <EventsStudent />
        <EducationStudent />
        <ContactStudent />
      </main>

      {/* Outcoming Switch Path Transition Overlay */}
      {isSwitchingPath && <div className="switch-exit-overlay student" />}
    </div>
  );
}
