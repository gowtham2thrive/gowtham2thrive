export default function EducationTimelineItem({ edu, index }) {
  return (
    <div
      className="timeline-item"
      style={{ animationDelay: `${index * 0.12}s` }}
    >
      <div className="timeline-line">
        <div className="timeline-dot" />
      </div>
      <div className="timeline-content portfolio-card">
        <div className="timeline-card-header">
          <div className="timeline-logo-wrap">
            <img
              src={edu.logo}
              alt={`${edu.institution} Logo`}
              className="timeline-logo-img"
            />
          </div>
          <div className="timeline-header-info">
            <div className="timeline-meta-row">
              <span className="timeline-year">{edu.period}</span>
              {edu.grade && (
                <span className="timeline-grade-badge">{edu.grade}</span>
              )}
            </div>
            <h3 className="timeline-institution">{edu.institution}</h3>
            <p className="timeline-degree">{edu.degree}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
