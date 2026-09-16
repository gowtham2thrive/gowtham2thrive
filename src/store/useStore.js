import { create } from 'zustand';

// Shared mouse/touch position — mutable ref avoids re-renders on every interaction
const sharedMouse = { x: 0, y: 0 };
let listenersAttached = false;

let winWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
let winHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

function attachInteractionListeners() {
  if (listenersAttached || typeof window === 'undefined') return;
  listenersAttached = true;

  const updateDims = () => {
    winWidth = window.innerWidth || 1920;
    winHeight = window.innerHeight || 1080;
  };
  window.addEventListener('resize', updateDims, { passive: true });
  updateDims();

  // Desktop mouse parallax
  window.addEventListener('mousemove', (e) => {
    sharedMouse.x = (e.clientX / winWidth - 0.5) * 2;
    sharedMouse.y = (e.clientY / winHeight - 0.5) * 2;
  }, { passive: true });

  // Mobile/tablet touch parallax
  let touchDecayAnim = null;
  const startDecay = () => {
    if (touchDecayAnim) cancelAnimationFrame(touchDecayAnim);
    const decay = () => {
      sharedMouse.x *= 0.92;
      sharedMouse.y *= 0.92;
      if (Math.abs(sharedMouse.x) > 0.001 || Math.abs(sharedMouse.y) > 0.001) {
        touchDecayAnim = requestAnimationFrame(decay);
      } else {
        sharedMouse.x = 0;
        sharedMouse.y = 0;
        touchDecayAnim = null;
      }
    };
    touchDecayAnim = requestAnimationFrame(decay);
  };

  window.addEventListener('touchmove', (e) => {
    if (touchDecayAnim) {
      cancelAnimationFrame(touchDecayAnim);
      touchDecayAnim = null;
    }
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      sharedMouse.x = (touch.clientX / winWidth - 0.5) * 2;
      sharedMouse.y = (touch.clientY / winHeight - 0.5) * 2;
    }
  }, { passive: true });

  window.addEventListener('touchend', startDecay, { passive: true });
  window.addEventListener('touchcancel', startDecay, { passive: true });
}
attachInteractionListeners();

export { sharedMouse };

// Safe storage helpers that gracefully handle restricted or disabled localStorage
const getStoredRole = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('portfolio-role') || null;
    }
  } catch {
    // Graceful fallback if localStorage is blocked
  }
  return null;
};

const setStoredRole = (role) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('portfolio-role', role);
    }
  } catch {
    // Graceful fallback if localStorage is blocked
  }
};

const removeStoredRole = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('portfolio-role');
    }
  } catch {
    // Graceful fallback if localStorage is blocked
  }
};

const useStore = create((set, get) => ({
  // Role selection
  selectedRole: getStoredRole(),
  recentSwitchRole: null, // Role just switched from (powers smooth arrival in RoleSelection)
  setSelectedRole: (role) => {
    setStoredRole(role);
    set({ selectedRole: role, recentSwitchRole: null });

    // Update CSS variables based on role
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (role === 'student') {
        root.style.setProperty('--color-accent-primary', '#00f0ff');
        root.style.setProperty('--color-accent-secondary', '#0088ff');
        root.style.setProperty('--color-accent-glow', 'rgba(0, 240, 255, 0.4)');
        root.style.setProperty('--color-accent-gradient', 'linear-gradient(135deg, #00f0ff, #0088ff)');
      } else if (role === 'entrepreneur') {
        root.style.setProperty('--color-accent-primary', '#ffb800');
        root.style.setProperty('--color-accent-secondary', '#ff6b00');
        root.style.setProperty('--color-accent-glow', 'rgba(255, 184, 0, 0.4)');
        root.style.setProperty('--color-accent-gradient', 'linear-gradient(135deg, #ffb800, #ff6b00)');
      }
    }
  },
  clearRole: () => {
    removeStoredRole();
    set({ selectedRole: null, isSwitchingPath: false, recentSwitchRole: null });
  },

  // Smooth outcoming transition when switching path
  isSwitchingPath: false,
  switchPath: () => {
    const currentRole = get().selectedRole;
    if (get().isSwitchingPath) return;
    set({
      isSwitchingPath: true,
      recentSwitchRole: currentRole,
      isMobileMenuOpen: false,
    });

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      removeStoredRole();
      set({ selectedRole: null, isSwitchingPath: false });

      // Keep recentSwitchRole active for 450ms so arrival in RoleSelection settles smoothly
      setTimeout(() => {
        set({ recentSwitchRole: null });
      }, 450);
    }, 380);
  },

  // Device tier for adaptive quality
  deviceTier: 'high', // 'high' | 'medium' | 'low'
  setDeviceTier: (tier) => set({ deviceTier: tier }),

  // Mobile menu
  isMobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  // Transition state (for portal warp effect entering a role)
  isTransitioning: false,
  transitionRole: null,
  setTransitioning: (transitioning, role = null) =>
    set({ isTransitioning: transitioning, transitionRole: role }),
}));

export default useStore;
