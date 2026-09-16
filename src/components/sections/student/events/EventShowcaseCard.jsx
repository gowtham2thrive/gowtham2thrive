import {
  GithubIcon,
  YoutubeIcon,
  ExternalLinkIcon,
} from '../../../common/Icons';

export default function EventShowcaseCard() {
  return (
    <div className="events-showcase scroll-reveal">
      <div className="leadership-card portfolio-card events-featured-card">
        <div className="leadership-top-meta">
          <span className="leadership-badge">
            <span className="badge-pulse-dot" />
            Organizer & Technical Architect
          </span>
          <span className="leadership-date">August 2026</span>
        </div>

        <div className="leadership-title-row">
          <h3 className="leadership-title">IGNITE 2026</h3>
          <span className="leadership-tagline">Think. Build. Transform. — 100% Student-Driven Hackathon</span>
        </div>

        <p className="leadership-summary">
          Coordinated IGNITE 2026 alongside a 27-member organizing team, contributing end-to-end across planning, event operations, participant management, workshops, execution, evaluation, and final results. Led the development of the results platform.
        </p>

        <div className="leadership-metrics-grid">
          <div className="leadership-metric-item">
            <span className="metric-number">47</span>
            <span className="metric-label">Total Teams</span>
          </div>
          <div className="leadership-metric-item">
            <span className="metric-number">219</span>
            <span className="metric-label">Total Participants</span>
          </div>
          <div className="leadership-metric-item">
            <span className="metric-number">27</span>
            <span className="metric-label">Coordinators Team</span>
          </div>
        </div>

        <div className="leadership-actions">
          <a
            href="https://ignite26.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary-leadership"
          >
            <ExternalLinkIcon size={13} />
            <span>Event Portal</span>
          </a>
          <a
            href="https://github.com/gowtham2thrive/IGNITE-2026"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary-leadership"
          >
            <GithubIcon size={14} />
            <span>Event Archive</span>
          </a>
          <a
            href="https://youtu.be/1aPcckXVDqM"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost-leadership"
          >
            <YoutubeIcon size={15} />
            <span>Watch Event Video</span>
          </a>
        </div>
      </div>
    </div>
  );
}
