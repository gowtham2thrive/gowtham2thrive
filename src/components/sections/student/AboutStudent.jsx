import { useRef, useMemo } from 'react';
import useScrollReveal from '../../../hooks/useScrollReveal';

export default function AboutStudent() {
  const sectionRef = useRef(null);
  useScrollReveal(sectionRef);

  const stats = [
    { number: '10+', label: 'Projects Built' },
    { number: '5+', label: 'Technologies' },
    { number: '2+', label: 'Years Coding' },
    { number: '∞', label: 'Curiosity' },
  ];

  const avatarDots = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      style: {
        transform: `rotate(${i * 45}deg) translateY(-80px)`,
        animationDelay: `${i * 0.15}s`,
      },
    }));
  }, []);

  return (
    <section className="portfolio-section about-section" id="about" ref={sectionRef}>
      <div className="portfolio-section-inner">
        <div className="about-grid">
          {/* Left — Avatar / Visual */}
          <div className="about-visual scroll-reveal">
            <div className="about-avatar-container">
              <div className="about-avatar-ring" />
              <div className="about-avatar">
                <span className="about-avatar-text">GK</span>
              </div>
              <div className="about-avatar-dots">
                {avatarDots.map((dot) => (
                  <div
                    key={dot.id}
                    className="about-dot"
                    style={dot.style}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right — Bio */}
          <div className="about-content scroll-reveal">
            <span className="section-label">About Me</span>
            <h2 className="section-heading">
              Turning ideas into <br />
              <span className="text-gradient">digital reality</span>
            </h2>
            <p className="section-description">
              I'm a passionate student and developer who loves building things that live on the internet.
              My journey started with curiosity about how websites work, and has evolved into a deep
              passion for creating elegant, performant, and user-centric digital experiences.
            </p>
            <p className="section-description" style={{ marginTop: '1rem' }}>
              When I'm not coding, you'll find me exploring new technologies, contributing to open
              source projects, or diving into the latest in AI and web development.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="about-stats scroll-reveal">
          {stats.map((stat) => (
            <div key={stat.label} className="portfolio-card stat-card">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
