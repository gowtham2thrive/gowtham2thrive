import { useRef } from 'react';
import useScrollReveal from '../../../../hooks/useScrollReveal';
import { MedalBadgeIcon } from '../../../common/Icons';
import ravenBanner from '../../../../assets/projects/raven-banner.png';
import echoBanner from '../../../../assets/projects/echo-banner.png';
import hiveBanner from '../../../../assets/projects/hive-banner.png';
import ProjectCard from './ProjectCard';
import PublicationsStudent from './PublicationsStudent';
import './ProjectsStudent.css';

const projects = [
  {
    title: 'RAVEN',
    description:
      'Risk Analysis & Verification for Evidence Navigation — An agentic chargeback investigation system that automates dispute evidence gathering with 9 specialized tools, deterministic scoring, and Razorpay API integration.',
    tags: ['AI & Agents', 'FastAPI', 'Gemini ADK', 'Razorpay API', 'Chargeback Responder'],
    link: 'https://github.com/gowtham2thrive/raven',
    github: 'https://github.com/gowtham2thrive/raven',
    featured: true,
    badge: 'Razorpay Buildathon 2026',
    banner: ravenBanner,
    snippet: "raven.investigate({ disputeId, model: 'gemini-flash', tools: 9 })",
    gradient: 'linear-gradient(135deg, rgba(0, 240, 255, 0.16), rgba(160, 32, 240, 0.22))',
    accentColor: '#00f0ff',
  },
  {
    title: 'Echo',
    description:
      'A modern, AI-enhanced Hostel Management System built with React and Supabase. Streamlines complaints, outing requests, and staff approvals with role-based access and real-time analytics.',
    tags: ['AI & Agents', 'React', 'Supabase', 'llama-3.3', 'Groq Cloud'],
    link: 'https://github.com/gowtham2thrive/Echo',
    github: 'https://github.com/gowtham2thrive/Echo',
    featured: true,
    badge: '2nd Place Synergy 2026',
    badgeIcon: <MedalBadgeIcon size={13} />,
    banner: echoBanner,
    snippet: "llm.stream({ model: 'llama-3.3-70b-versatile', role: 'admin' })",
    gradient: 'linear-gradient(135deg, rgba(0, 240, 255, 0.16), rgba(0, 100, 255, 0.22))',
    accentColor: '#00f0ff',
    awardLink:
      'https://github.com/gowtham2thrive/Echo/blob/main/src/assets/Echo%20Hostel%20Management%20System%20%E2%80%93%20Second%20Place%2C%20National%20Technical%20Meet%20(Synergy%202026).jpg',
  },
  {
    title: 'Hive',
    description:
      'A desktop-class interface to discover, download, and run Hugging Face GGUF models locally with real-time streaming inference, zero-config GPU acceleration, and 100% data privacy.',
    tags: ['Local AI', 'Python', 'FastAPI', 'llama.cpp', 'Hugging Face'],
    link: 'https://github.com/gowtham2thrive/Hive',
    github: 'https://github.com/gowtham2thrive/Hive',
    featured: true,
    badge: 'Local AI / llama.cpp',
    banner: hiveBanner,
    snippet: "llama.stream({ model: 'gguf_local', n_gpu_layers: -1, privacy: '100%' })",
    gradient: 'linear-gradient(135deg, rgba(255, 170, 0, 0.16), rgba(255, 60, 0, 0.2))',
    accentColor: '#ffaa00',
  },
];

export default function ProjectsStudent() {
  const sectionRef = useRef(null);
  useScrollReveal(sectionRef);

  return (
    <section className="portfolio-section projects-section" id="projects" ref={sectionRef}>
      <div className="portfolio-section-inner">
        {/* Section Heading */}
        <div className="scroll-reveal">
          <span className="section-label">Selected Works</span>
          <h2 className="section-heading">Featured Projects</h2>
        </div>

        {/* Projects grid */}
        <div className="projects-grid scroll-reveal">
          {projects.map((project, i) => (
            <ProjectCard key={project.title} project={project} index={i} />
          ))}
        </div>

        {/* Dedicated Publications Section — Featuring Silicon Apocalypse */}
        <PublicationsStudent />
      </div>
    </section>
  );
}
