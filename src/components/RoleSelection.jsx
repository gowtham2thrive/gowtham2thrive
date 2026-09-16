import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, lazy, useEffect, useState, useRef } from 'react';
import { AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import PortalGateway from './3d/PortalGateway';
import ParticleField from './3d/ParticleField';
import PlanetHorizon from './3d/PlanetHorizon';
import useStore from '../store/useStore';
import animatedLogo from '../assets/logo-animated.svg';
import './RoleSelection.css';

const PostProcessingEffects = lazy(() => import('./3d/PostProcessing'));

// Real-Time FPS Watchdog: dynamically steps down quality if device struggles
function FpsAdaptiveController() {
  const { performance: r3fPerformance } = useThree();
  const setDeviceTier = useStore((s) => s.setDeviceTier);
  const deviceTier = useStore((s) => s.deviceTier);
  const frameTimesRef = useRef([]);
  const consecutiveLowFpsCount = useRef(0);
  const consecutiveHighFpsCount = useRef(0);
  const mountTimeRef = useRef(null);
  const lastTierChangeRef = useRef(0);

  useFrame((_, delta) => {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (mountTimeRef.current === null) {
      mountTimeRef.current = now;
    }
    // Skip FPS measurement during the first 4 seconds to allow shader compilation & scene setup
    if (now - mountTimeRef.current < 4000) return;

    // Ignore frames caused by tab switching or background freezes (> 150ms)
    if (delta > 0.15) return;

    frameTimesRef.current.push(delta);
    if (frameTimesRef.current.length >= 60) {
      let sum = 0;
      for (let i = 0; i < frameTimesRef.current.length; i++) {
        sum += frameTimesRef.current[i];
      }
      const avgFps = 60 / sum;
      frameTimesRef.current = [];

      // Cooldown: wait 6 seconds after a tier change before evaluating again
      if (now - lastTierChangeRef.current < 6000) return;

      // Only downgrade if FPS is genuinely struggling (< 28 FPS) for 4 consecutive batches (~8-10s)
      if (avgFps < 28) {
        consecutiveLowFpsCount.current++;
        consecutiveHighFpsCount.current = 0;
        if (consecutiveLowFpsCount.current >= 4) {
          r3fPerformance.regress();
          if (deviceTier === 'high') {
            setDeviceTier('medium');
          } else if (deviceTier === 'medium') {
            setDeviceTier('low');
          }
          consecutiveLowFpsCount.current = 0;
          lastTierChangeRef.current = now;
        }
      } else if (avgFps > 50) {
        consecutiveLowFpsCount.current = 0;
        // Recovery: if FPS stays smooth (> 50 FPS) for 3 consecutive batches, upgrade tier back
        consecutiveHighFpsCount.current++;
        if (consecutiveHighFpsCount.current >= 3) {
          if (deviceTier === 'low') {
            setDeviceTier('medium');
          } else if (deviceTier === 'medium') {
            setDeviceTier('high');
          }
          consecutiveHighFpsCount.current = 0;
          lastTierChangeRef.current = now;
        }
      } else {
        consecutiveLowFpsCount.current = 0;
        consecutiveHighFpsCount.current = 0;
      }
    }
  });

  return null;
}

export default function RoleSelection() {
  const isTransitioning = useStore((s) => s.isTransitioning);
  const transitionRole = useStore((s) => s.transitionRole);
  const recentSwitchRole = useStore((s) => s.recentSwitchRole);
  const deviceTier = useStore((s) => s.deviceTier);
  const setSelectedRole = useStore((s) => s.setSelectedRole);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [hasWebGlError, setHasWebGlError] = useState(false);
  const canvasElRef = useRef(null);
  const contextHandlersRef = useRef(null);
  const isMountedRef = useRef(true);

  // Tab visibility listener — pause rendering when tab is hidden to save GPU/battery
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Lock html and body scrolling on home page so no browser scrollbar appears
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Dispatch resize so Three.js and R3F measure clean bounds without scrollbar gutter
    window.dispatchEvent(new Event('resize'));

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  // Clean up WebGL context lost/restored event listeners on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (canvasElRef.current && contextHandlersRef.current) {
        const { onLost, onRestored } = contextHandlersRef.current;
        canvasElRef.current.removeEventListener('webglcontextlost', onLost, false);
        canvasElRef.current.removeEventListener('webglcontextrestored', onRestored, false);
      }
    };
  }, []);

  // Tier-adaptive DPR: clamp aggressively on weak devices
  const dpr = deviceTier === 'low' ? 1 : deviceTier === 'medium' ? [1, 1.5] : [1, 2];

  return (
    <div className={`role-selection ${isTransitioning ? 'transitioning' : 'entrance-fade'}`}>
      {/* 3D Canvas */}
      {!hasWebGlError ? (
        <div className="role-selection-canvas">
          <Canvas
            camera={{ position: [0, 0, 8], fov: 60 }}
            dpr={dpr}
            frameloop={isTabHidden ? 'never' : 'always'}
            flat={deviceTier === 'low'}
            performance={{ min: 0.5 }}
            style={{ width: '100%', height: '100%', display: 'block' }}
            gl={{
              antialias: deviceTier !== 'low',
              alpha: true,
              powerPreference: 'high-performance',
              stencil: false,
              depth: true,
            }}
            onCreated={({ gl }) => {
              const canvasEl = gl.domElement;
              canvasElRef.current = canvasEl;
              const onLost = (e) => {
                e.preventDefault();
                if (isMountedRef.current) {
                  setHasWebGlError(true);
                }
              };
              const onRestored = () => {
                if (isMountedRef.current) {
                  setHasWebGlError(false);
                  window.dispatchEvent(new Event('resize'));
                }
              };
              contextHandlersRef.current = { onLost, onRestored };
              canvasEl.addEventListener('webglcontextlost', onLost, false);
              canvasEl.addEventListener('webglcontextrestored', onRestored, false);
            }}
          >
            <AdaptiveDpr pixelated={false} />
            <AdaptiveEvents />
            <FpsAdaptiveController />
            <Suspense fallback={null}>
              <ParticleField />
              <PlanetHorizon />
              <PortalGateway />
              {deviceTier !== 'low' && <PostProcessingEffects />}
            </Suspense>
          </Canvas>
        </div>
      ) : (
        /* Accessible High-Performance HTML/CSS Fallback for Devices Without WebGL */
        <div className="role-selection-fallback">
          <div className="fallback-header">
            <h1 className="fallback-title">Explore My Journey</h1>
            <p className="fallback-subtitle">Select a perspective to begin</p>
          </div>
          <div className="fallback-cards">
            <button
              className="fallback-card student-card"
              onClick={() => setSelectedRole('student')}
            >
              <span className="card-badge">Academic</span>
              <h2>STUDENT</h2>
              <p>Explore engineering projects, coursework, and technical skills</p>
              <span className="card-action">Enter Portal →</span>
            </button>
            <button
              className="fallback-card entrepreneur-card"
              onClick={() => setSelectedRole('entrepreneur')}
            >
              <span className="card-badge">Leadership</span>
              <h2>ENTREPRENEUR</h2>
              <p>Discover startups, venture building, leadership, and vision</p>
              <span className="card-action">Enter Portal →</span>
            </button>
          </div>
        </div>
      )}

      {/* HTML Overlay for Header Branding */}
      <div className={`role-selection-overlay ${isTransitioning ? 'fade-out' : ''}`}>
        <header className="role-selection-header">
          <div className="role-selection-logo-wrap" title="Gowtham Kondapalli | Portfolio">
            <img
              src={animatedLogo}
              alt="Gowtham Kondapalli Animated Logo"
              className="role-selection-logo"
            />
          </div>
        </header>
      </div>

      {/* Hyperspace arrival veil when returning from switch path */}
      {recentSwitchRole && (
        <div className={`switch-arrival-overlay ${recentSwitchRole}`} />
      )}

      {/* Warp chromatic burst overlay for transition */}
      {isTransitioning && (
        <div
          className={`warp-burst-overlay warp-${transitionRole || 'student'}`}
        />
      )}
    </div>
  );
}
