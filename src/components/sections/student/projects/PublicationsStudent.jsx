import {
  FileTextIcon,
  YoutubeIcon,
  GithubIcon,
  AcademicCapIcon,
  BookIcon,
} from '../../../common/Icons';

export default function PublicationsStudent() {
  return (
    <div className="publications-container scroll-reveal">
      <div className="publications-header">
        <span className="section-label">Research & Academia</span>
        <h2 className="section-heading">Publications</h2>
      </div>

      <div className="publications-featured-wrap">
        {/* Paper: Silicon Apocalypse */}
        <div className="publication-card publication-featured-card portfolio-card">
          <div className="publication-top-meta">
            <div className="publication-badges-group">
              <span className="publication-tag tag-blue">
                <FileTextIcon size={13} />
                Published Research
              </span>
              <span className="publication-issn-tag">
                <span className="issn-label">ISSN:</span> 2347-315013
              </span>
              <span className="publication-journal-tag">
                <BookIcon size={13} />
                Mukt Shabd Journal (UGC Approved)
              </span>
            </div>
            <span className="publication-date">04-April 2025</span>
          </div>

          <div className="publication-grid-layout">
            {/* Left Column: Research Content & Paper Abstract */}
            <div className="publication-main-col">
              <h3 className="publication-title">Silicon Apocalypse Using Cisco Packet Tracer</h3>
              <div className="publication-domain-capsule">
                <span className="domain-pulse-dot" />
                <span>Domain: IoT Disaster Resilience & Autonomous Grid Defense</span>
              </div>

              <p className="publication-text">
                This paper bridges the gap between theoretical network design and real-world crisis management. Cisco Packet Tracer was utilized to simulate how IoT and smart automation can be engineered to drastically enhance disaster preparedness in smart environments, taking complex networking theories and applying them directly to critical infrastructure challenges.
              </p>

              <div className="publication-actions">
                <a
                  href="/docs/Silicon-Apocalypse-Using-Cisco-Packet-Tracer.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="publication-btn btn-research-pub"
                >
                  <FileTextIcon size={14} />
                  <span>Read Paper</span>
                </a>
                <a
                  href="https://youtu.be/X5NUrmSytSQ?si=5e8ugwrj_88o-Kpu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="publication-btn btn-youtube-pub"
                >
                  <YoutubeIcon size={15} />
                  <span>Watch Demo</span>
                </a>
                <a
                  href="https://github.com/gowtham2thrive/Silicon-Apocalypse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="publication-btn btn-ghost-pub"
                >
                  <GithubIcon size={14} />
                  <span>GitHub Repo</span>
                </a>
              </div>
            </div>

            {/* Right Column: Academic Mentors Panel */}
            <div className="publication-sidebar-col">
              <div className="mentors-panel">
                <div className="mentors-panel-header">
                  <AcademicCapIcon size={16} />
                  <span>Academic Mentorship</span>
                </div>
                <div className="mentors-cards-stack">
                  <div className="mentor-card-item">
                    <div className="mentor-dept-badge badge-ece">ECE</div>
                    <div className="mentor-meta">
                      <span className="mentor-name">S. Phani Varaprasad</span>
                      <span className="mentor-designation">Head of Department, ECE</span>
                    </div>
                  </div>
                  <div className="mentor-card-item">
                    <div className="mentor-dept-badge badge-cme">CME</div>
                    <div className="mentor-meta">
                      <span className="mentor-name">B. Padmavathi</span>
                      <span className="mentor-designation">Head of Department, CME</span>
                    </div>
                  </div>
                  <div className="mentor-card-item">
                    <div className="mentor-dept-badge badge-cc">CC</div>
                    <div className="mentor-meta">
                      <span className="mentor-name">S. Hemalatha</span>
                      <span className="mentor-designation">Class Coordinator</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
