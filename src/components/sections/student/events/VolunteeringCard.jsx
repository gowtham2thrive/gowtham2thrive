import {
  BloodDropIcon,
  PhotoIcon,
} from '../../../common/Icons';

export default function VolunteeringCard({ item, index, onOpenCertificates }) {
  const isRedCross = item.organization.includes('Red Cross');

  return (
    <div
      className={`volunteering-card portfolio-card ${
        isRedCross ? 'volunteering-card-extended' : ''
      }`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="volunteering-top">
        <div className="volunteering-top-main">
          <div
            className="volunteering-icon-wrap"
            style={{ borderColor: `${item.badgeColor}50` }}
          >
            {item.logo ? (
              <img
                src={item.logo}
                alt={`${item.organization} Logo`}
                className="volunteering-logo-img"
              />
            ) : (
              item.icon
            )}
          </div>
          <div className="volunteering-meta">
            <span className="volunteering-role" style={{ color: item.badgeColor }}>
              {item.role}
            </span>
            <span className="volunteering-period">{item.period}</span>
          </div>
        </div>

        {/* Photo icon on top of card */}
        {isRedCross && (
          <button
            type="button"
            className="volunteering-photo-top-btn"
            onClick={onOpenCertificates}
            aria-label="View blood donation certificate photos"
            title="View Certificate Photos"
          >
            <PhotoIcon size={18} />
          </button>
        )}
      </div>

      <h3 className="volunteering-org">{item.organization}</h3>
      <span
        className="volunteering-cause"
        style={{
          borderColor: `${item.badgeColor}35`,
          color: item.badgeColor,
          background: `${item.badgeColor}10`,
        }}
      >
        {item.cause}
      </span>

      <p className="volunteering-desc">{item.description}</p>

      {/* Blood Donation Records & Donor Stats for IRCS */}
      {isRedCross && (
        <div className="volunteering-donor-block">
          {/* Donor Quick Metric Capsules */}
          <div className="donor-stats-strip">
            <div className="donor-stat-capsule donor-stat-primary">
              <BloodDropIcon size={13} className="donor-drop-icon" />
              <span className="donor-stat-val">700 ml</span>
              <span className="donor-stat-label">Donated</span>
            </div>
            <div className="donor-stat-capsule">
              <span className="donor-stat-dot" />
              <span className="donor-stat-val">2x</span>
              <span className="donor-stat-label">Voluntary Donor</span>
            </div>
            <div className="donor-stat-capsule donor-group-capsule">
              <span className="donor-stat-label">Group</span>
              <span className="donor-stat-val donor-bg-text">A+ve</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
