import { useRef } from 'react';
import useScrollReveal from '../../../../hooks/useScrollReveal';
import unstopLogo from '../../../../assets/UNSTOP.png';
import ExperienceCard from './ExperienceCard';
import './ExperienceStudent.css';

const experiences = [
  {
    id: 'unstop',
    role: 'Unstop Campus Champions',
    company: 'Unstop',
    employmentType: 'Part-time',
    period: 'Sep 2026 — Present',
    location: 'Makavarapalem, Andhra Pradesh, India · On-site',
    status: 'active',
    statusLabel: 'Current Role',
    logo: unstopLogo,
    summary:
      'Serving as the official student ambassador and campus champion representing Unstop at Avanthi Institute. Driving campus engagement across national hackathons, coding contests, and student opportunities.',
    highlights: [
      'Spearheading awareness for national hackathons, technical challenges, and hiring assessments powered by Unstop.',
      'Serving as the primary point of contact between Unstop and college departments to maximize student reach.',
      'Organizing student workshops, peer coding drives, and campus engagement sessions.',
    ],
    tags: [
      'Campus Leadership',
      'Community Building',
      'Technical Competitions',
      'Hackathons',
      'Student Engagement',
    ],
    awardBadge: 'Campus Ambassador',
  },
];

export default function ExperienceStudent() {
  const sectionRef = useRef(null);
  useScrollReveal(sectionRef);

  return (
    <section className="portfolio-section experience-section" id="experience" ref={sectionRef}>
      <div className="portfolio-section-inner">
        {/* Section Heading */}
        <div className="scroll-reveal">
          <span className="section-label">Professional & Leadership</span>
          <h2 className="section-heading">Work Experience</h2>
        </div>

        {/* Experience Cards / Timeline */}
        <div className="experience-list scroll-reveal">
          {experiences.map((exp, i) => (
            <ExperienceCard key={exp.id} exp={exp} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
