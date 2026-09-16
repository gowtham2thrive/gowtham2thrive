import { useEffect, useRef } from 'react';
import useStore from '../../store/useStore';
import './ScrollProgress.css';

export default function ScrollProgress() {
  const barRef = useRef(null);
  const selectedRole = useStore((s) => s.selectedRole);

  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      if (!barRef.current) {
        ticking = false;
        return;
      }
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progressRatio = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
      barRef.current.style.transform = `scaleX(${progressRatio})`;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div className="scroll-progress">
      <div
        ref={barRef}
        className={`scroll-progress-bar ${selectedRole || ''}`}
      />
    </div>
  );
}
