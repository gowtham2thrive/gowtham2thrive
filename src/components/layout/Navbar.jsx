import { useState, useEffect, useRef } from 'react';
import useStore from '../../store/useStore';
import './Navbar.css';

export default function Navbar() {
  const selectedRole = useStore((s) => s.selectedRole);
  const switchPath = useStore((s) => s.switchPath);
  const isSwitchingPath = useStore((s) => s.isSwitchingPath);

  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const hiddenRef = useRef(false);
  const scrolledRef = useRef(false);

  // Navbar show/hide on scroll
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const isDown = currentScrollY > lastScrollY.current && currentScrollY > 100;
      const isScrolled = currentScrollY > 50;

      if (hiddenRef.current !== isDown) {
        hiddenRef.current = isDown;
        setHidden(isDown);
      }
      if (scrolledRef.current !== isScrolled) {
        scrolledRef.current = isScrolled;
        setScrolled(isScrolled);
      }
      lastScrollY.current = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSwitchPath = () => {
    if (isSwitchingPath) return;
    switchPath();
  };

  return (
    <nav className={`navbar ${hidden ? 'hidden' : ''} ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner">
        {/* Switch Role button */}
        <div className="navbar-actions">
          <button
            type="button"
            className={`navbar-switch-btn ${isSwitchingPath ? 'switching' : ''}`}
            onClick={handleSwitchPath}
            disabled={isSwitchingPath}
            title="Switch Role"
          >
            <svg
              className={`switch-icon ${isSwitchingPath ? 'spinning' : ''}`}
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 16V4M7 4L3 8M7 4L11 8" />
              <path d="M17 8v12M17 20l4-4M17 20l-4-4" />
            </svg>
            <span className={`switch-indicator ${selectedRole} ${isSwitchingPath ? 'active' : ''}`} />
            <span className="switch-text">{isSwitchingPath ? 'Switching...' : 'Switch Role'}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
