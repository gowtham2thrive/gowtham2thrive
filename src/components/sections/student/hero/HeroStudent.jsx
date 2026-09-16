import { useEffect, useRef } from 'react';
import profilePic from '../../../../assets/Gowtham-Kondapalli.jpg';
import HeroStats from './HeroStats';
import './HeroStudent.css';

export default function HeroStudent() {
  const heroRef = useRef(null);

  const stats = [
    { number: '8+', label: 'Projects Built' },
    { number: '5+', label: 'Years of Coding' },
    { number: '1+', label: 'Events Organized' },
    { number: '1+', label: 'Publications' },
  ];

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    let ticking = false;
    let targetX = 0;
    let targetY = 0;

    const updateParallax = () => {
      el.style.setProperty('--mouse-x', `${targetX}px`);
      el.style.setProperty('--mouse-y', `${targetY}px`);
      ticking = false;
    };

    const handleMouseMove = (e) => {
      targetX = (e.clientX / (window.innerWidth || 1920) - 0.5) * 16;
      targetY = (e.clientY / (window.innerHeight || 1080) - 0.5) * 16;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateParallax);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="portfolio-section hero-section" id="about" ref={heroRef}>
      <div id="hero" className="hero-anchor-target" />

      <div className="portfolio-section-inner hero-container">
        {/* Main Grid: Left = Profile Picture, Right = Info & About Me */}
        <div className="hero-grid">
          {/* Left Column — Gowtham's Profile Picture */}
          <div className="hero-profile-col">
            <div className="hero-profile-wrapper">
              <div className="about-avatar-ring" />
              <div className="about-avatar-ring outer-ring" />
              <div className="hero-profile-avatar">
                <img
                  src={profilePic}
                  alt="Gowtham Kondapalli"
                  className="hero-profile-img"
                />
              </div>
            </div>
          </div>

          {/* Right Column — Headline & About Me Bio */}
          <div className="hero-content">
            <h1 className="hero-name">
              <span className="hero-greeting">Hello, I'm</span>
              <span className="hero-name-main">Gowtham</span>
              <span className="hero-name-last">Kondapalli</span>
            </h1>

            <p className="hero-description hero-bio-text">
              I’m a Computer Science student focused on building practical technology across software, AI, automation, and emerging systems. I learn by building—working on projects, technical initiatives, and real-world experiences while continuously strengthening my engineering and problem-solving skills. My goal is to turn ideas into useful products and systems that create real-world impact.
            </p>
          </div>
        </div>

        {/* Integrated Stats Row */}
        <HeroStats stats={stats} />

        {/* Bottom Actions: View My Work & Get In Touch */}
        <div className="hero-bottom-actions">
          <div className="hero-cta">
            <button
              type="button"
              className="btn btn-primary hero-btn"
              onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View My Work
              <span className="btn-arrow">→</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost hero-btn"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get In Touch
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
