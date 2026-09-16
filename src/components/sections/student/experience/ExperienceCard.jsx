import { MapPinIcon, CalendarIcon } from '../../../common/Icons';

export default function ExperienceCard({ exp, index }) {
  return (
    <div
      className={`experience-card portfolio-card ${exp.status === 'active' ? 'exp-active' : ''}`}
      style={{ animationDelay: `${index * 0.12}s` }}
    >
      {/* Top Header: Identity + Badges */}
      <div className="exp-card-header">
        <div className="exp-header-top">
          <div className="exp-logo-box">
            {exp.logo ? (
              <img
                src={exp.logo}
                alt={`${exp.company} Logo`}
                className="exp-logo-img"
              />
            ) : (
              <div className="exp-logo-fallback">
                <span>{exp.company[0]}</span>
              </div>
            )}
          </div>

          <div className="exp-heading-info">
            <h3 className="exp-role-title">{exp.role}</h3>
            <div className="exp-company-sub">
              <span className="exp-company-meta-line">
                <span className="exp-company-name">{exp.company}</span>
                <span className="exp-dot-sep">·</span>
                <span className="exp-type-badge">{exp.employmentType}</span>
              </span>
            </div>
            {exp.location && (
              <div className="exp-location-tag">
                <MapPinIcon size={12} />
                <span>{exp.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Badges Meta */}
        <div className="exp-meta-row">
          <span className={`exp-status-pill ${exp.status}`}>
            {exp.status === 'active' && <span className="exp-pulse-dot" />}
            {exp.statusLabel}
          </span>
          {exp.awardBadge && (
            <span className="exp-award-pill">
              {exp.awardBadge}
            </span>
          )}
          <span className="exp-period-pill">
            <CalendarIcon size={12} />
            {exp.period}
          </span>
        </div>
      </div>

      {/* Summary narrative */}
      <p className="exp-summary">{exp.summary}</p>

      {/* Impact Bullets */}
      {exp.highlights && exp.highlights.length > 0 && (
        <ul className="exp-highlights-list">
          {exp.highlights.map((bullet) => (
            <li key={bullet} className="exp-highlight-item">
              <span className="exp-bullet-marker">▹</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Skills Tags */}
      <div className="exp-tags-row">
        {exp.tags.map((tag) => (
          <span key={tag} className="exp-tag">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
