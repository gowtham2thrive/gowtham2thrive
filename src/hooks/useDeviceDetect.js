import { useEffect, useState } from 'react';
import useStore from '../store/useStore';

export default function useDeviceDetect() {
  const setDeviceTier = useStore((s) => s.setDeviceTier);
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    tier: 'high',
  });

  useEffect(() => {
    // Detect hardware capability tier once based on physical device specs
    const hardwareConcurrency = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    const deviceMemory = typeof navigator !== 'undefined' ? navigator.deviceMemory || 4 : 4; // GB
    const isLowEndHardware = hardwareConcurrency <= 2 || deviceMemory <= 2;
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isPhysicalMobile = typeof navigator !== 'undefined' && (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && window.screen.width < 768)
    );

    let isSoftwareRenderer = false;
    let isBudgetGpu = false;
    let hasWebGl = true;
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '').toLowerCase();
          if (/swiftshader|llvmpipe|software|mesa/i.test(renderer)) {
            isSoftwareRenderer = true;
          } else if (
            /intel.*(hd|uhd)\s*(graphics)?\s*(2000|3000|4000|500|505|510|515|520|530|600|605|610|615|620)/i.test(renderer) ||
            /mali-(400|450|t6|t7|t8|g31|g51|g52)/i.test(renderer) ||
            /adreno\s*(2|3|4|505|506|508|509|610|612|616)/i.test(renderer) ||
            /powervr/i.test(renderer)
          ) {
            isBudgetGpu = true;
          }
        }
        // Free the temporary context immediately to avoid exhausting WebGL context quota
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
          loseContext.loseContext();
        }
      } else {
        hasWebGl = false;
      }
    } catch {
      hasWebGl = false;
    }

    let detectedTier = 'high';
    if (!hasWebGl || prefersReducedMotion || isLowEndHardware || isSoftwareRenderer || (isPhysicalMobile && hardwareConcurrency <= 4)) {
      detectedTier = 'low';
    } else if (isBudgetGpu) {
      detectedTier = isPhysicalMobile ? 'low' : 'medium';
    } else if (isPhysicalMobile) {
      detectedTier = 'medium';
    }

    setDeviceTier(detectedTier);

    // Track viewport size changes without mutating the hardware deviceTier
    const updateViewport = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      setDevice({ isMobile, isTablet, isDesktop, tier: detectedTier });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, [setDeviceTier]);

  return device;
}
