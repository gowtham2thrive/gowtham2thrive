import { useEffect } from 'react';

export default function useScrollReveal(ref, options = {}) {
  const { threshold = 0.05, rootMargin = '0px 0px -10% 0px' } = options;

  useEffect(() => {
    if (!ref.current) return;

    const elements = ref.current.querySelectorAll('.scroll-reveal');
    if (elements.length === 0) return;

    if (typeof IntersectionObserver === 'undefined') {
      // Fallback for environments without IntersectionObserver
      elements.forEach((el) => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin,
        threshold,
      }
    );

    elements.forEach((el) => {
      if (!el.classList.contains('visible')) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [ref, rootMargin, threshold]);
}
