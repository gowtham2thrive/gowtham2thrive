import { GithubIcon } from '../../../common/Icons';

export default function ProjectCard({ project, index }) {
  return (
    <div
      className={`project-card portfolio-card ${project.featured ? 'featured' : ''}`}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {/* Project preview header */}
      <div className="project-preview" style={{ background: project.gradient }}>
        {/* Mock Window Top Bar */}
        <div className="project-preview-bar">
          <div className="window-dots">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
          </div>
          <span
            className="project-preview-badge"
            style={{
              borderColor: `${project.accentColor}40`,
              color: project.accentColor,
            }}
          >
            {project.badgeIcon}
            <span>{project.badge}</span>
          </span>
        </div>

        {/* Banner Graphic Frame */}
        {project.banner && (
          <div className="project-banner-wrap">
            <img
              src={project.banner}
              alt={`${project.title} official banner`}
              className="project-banner-img"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Project info */}
      <div className="project-info">
        <h3 className="project-title">{project.title}</h3>
        <p className="project-description">{project.description}</p>
        <div className="project-tags">
          {project.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
        <div className="project-links">
          <a
            href={project.link}
            className="project-btn-repo"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubIcon size={14} />
            <span>GitHub Repo</span>
          </a>
        </div>
      </div>
    </div>
  );
}
