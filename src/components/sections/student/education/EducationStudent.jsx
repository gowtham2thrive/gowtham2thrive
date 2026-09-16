import { useRef } from 'react';
import useScrollReveal from '../../../../hooks/useScrollReveal';
import aietLogo from '../../../../assets/AIET.png';
import apmsLogo from '../../../../assets/APMS.png';
import EducationTimelineItem from './EducationTimelineItem';
import './EducationStudent.css';

const education = [
  {
    period: 'July 2025 — July 2028',
    institution: 'Avanthi Institute of Engineering & Technology',
    degree: 'Bachelor of Technology, Computer Science & Engineering',
    grade: '8.62 CGPA',
    logo: aietLogo,
  },
  {
    period: 'July 2022 — April 2025',
    institution: 'Avanthi Institute of Engineering & Technology',
    degree: 'Diploma of Education, Computer Engineering',
    grade: '9.4 CGPA',
    logo: aietLogo,
  },
  {
    period: 'June 2017 — April 2022',
    institution: 'AP Model School & Jr. College (APMS)',
    degree: 'Secondary School (SSC)',
    grade: '71.67%',
    logo: apmsLogo,
  },
];

export default function EducationStudent() {
  const sectionRef = useRef(null);
  useScrollReveal(sectionRef);

  return (
    <section className="portfolio-section education-section" id="education" ref={sectionRef}>
      <div className="portfolio-section-inner">
        {/* Section Heading */}
        <div className="scroll-reveal">
          <span className="section-label">Education</span>
          <h2 className="section-heading">Academic Journey</h2>
        </div>

        {/* Minimized Timeline */}
        <div className="education-timeline-wrap scroll-reveal">
          <div className="education-timeline">
            {education.map((edu, i) => (
              <EducationTimelineItem key={edu.period} edu={edu} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
