import { GithubIcon, LinkedinIcon, TwitterIcon, MailIcon } from '../common/Icons';
import './Footer.css';

export default function Footer() {
  const socials = [
    { name: 'GitHub', icon: <GithubIcon size={18} />, url: 'https://github.com' },
    { name: 'LinkedIn', icon: <LinkedinIcon size={18} />, url: 'https://linkedin.com' },
    { name: 'Twitter', icon: <TwitterIcon size={18} />, url: 'https://twitter.com' },
    { name: 'Email', icon: <MailIcon size={18} />, url: 'mailto:gowtham.kondapalli@email.com' },
  ];

  return (
    <footer className="footer">
      <div className="footer-glow" />
      <div className="footer-content">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-logo">GK</span>
            <span className="footer-name">Gowtham Kondapalli</span>
          </div>
          <div className="footer-socials">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.url}
                className="footer-social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
              >
                <span className="footer-social-icon">{s.icon}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="footer-divider" />
        <div className="footer-bottom">
          <p className="footer-tagline">
            Built with ☕ & Three.js — Crafted from scratch
          </p>
          <p className="footer-copyright">
            © {new Date().getFullYear()} Gowtham Kondapalli. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
