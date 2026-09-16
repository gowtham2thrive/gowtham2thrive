export default function HeroStats({ stats }) {
  return (
    <div className="hero-stats-row">
      {stats.map((stat) => (
        <div key={stat.label} className="portfolio-card stat-card">
          <div className="stat-number">{stat.number}</div>
          <div className="stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
