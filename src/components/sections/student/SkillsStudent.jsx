import { useRef, useState } from 'react';
import useScrollReveal from '../../../hooks/useScrollReveal';

const skillCategories = [
  {
    name: 'Frontend',
    skills: [
      { name: 'React', level: 85 },
      { name: 'JavaScript', level: 90 },
      { name: 'HTML/CSS', level: 95 },
      { name: 'Three.js', level: 70 },
      { name: 'TypeScript', level: 75 },
    ],
  },
  {
    name: 'Backend',
    skills: [
      { name: 'Node.js', level: 80 },
      { name: 'Python', level: 85 },
      { name: 'Express', level: 75 },
      { name: 'MongoDB', level: 70 },
      { name: 'PostgreSQL', level: 65 },
    ],
  },
  {
    name: 'Tools & Others',
    skills: [
      { name: 'Git', level: 90 },
      { name: 'Docker', level: 60 },
      { name: 'Figma', level: 70 },
      { name: 'Linux', level: 75 },
      { name: 'AWS', level: 55 },
    ],
  },
];

export default function SkillsStudent() {
  const sectionRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState(0);
  useScrollReveal(sectionRef);

  return (
    <section className="portfolio-section skills-section" id="skills" ref={sectionRef}>
      <div className="portfolio-section-inner">
        <div className="scroll-reveal">
          <span className="section-label">Skills & Technologies</span>
          <h2 className="section-heading">My Tech Arsenal</h2>
          <p className="section-description">
            A diverse toolkit built through projects, courses, and endless curiosity.
          </p>
        </div>

        {/* Category tabs */}
        <div className="skills-tabs scroll-reveal">
          {skillCategories.map((cat, i) => (
            <button
              key={cat.name}
              className={`skills-tab ${activeCategory === i ? 'active' : ''}`}
              onClick={() => setActiveCategory(i)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Skills grid */}
        <div className="skills-grid scroll-reveal">
          {skillCategories[activeCategory].skills.map((skill, i) => (
            <div key={skill.name} className="skill-card portfolio-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="skill-header">
                <span className="skill-name">{skill.name}</span>
                <span className="skill-level">{skill.level}%</span>
              </div>
              <div className="skill-bar">
                <div
                  className="skill-bar-fill"
                  style={{ width: `${skill.level}%` }}
                />
              </div>
              <div className="skill-orb">
                <div
                  className="skill-orb-inner"
                  style={{
                    width: `${30 + skill.level * 0.4}px`,
                    height: `${30 + skill.level * 0.4}px`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
