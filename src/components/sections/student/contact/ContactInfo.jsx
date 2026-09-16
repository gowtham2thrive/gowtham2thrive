import {
  GithubIcon,
  LinkedinIcon,
  TwitterIcon,
  ThreadsIcon,
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  AmazonIcon,
  MapPinIcon,
} from '../../../common/Icons';

const socials = [
  { name: 'GitHub', icon: <GithubIcon size={18} />, url: 'https://github.com/gowtham2thrive' },
  { name: 'LinkedIn', icon: <LinkedinIcon size={18} />, url: 'https://www.linkedin.com/in/gowtham2thrive' },
  { name: 'X', icon: <TwitterIcon size={18} />, url: 'https://x.com/gowtham2thrive' },
  { name: 'Threads', icon: <ThreadsIcon size={18} />, url: 'https://www.threads.com/@ask.gowtham' },
  { name: 'Instagram', icon: <InstagramIcon size={18} />, url: 'https://www.instagram.com/ask.gowtham' },
  { name: 'YouTube', icon: <YoutubeIcon size={18} />, url: 'https://www.youtube.com/@Ask.Gowtham' },
  { name: 'Amazon Author', icon: <AmazonIcon size={18} />, url: 'https://www.amazon.com/author/gowthamkondapalli' },
  { name: 'Facebook', icon: <FacebookIcon size={18} />, url: 'https://www.facebook.com/Ask.Gowtham' },
];

export default function ContactInfo() {
  return (
    <div className="contact-info scroll-reveal">
      <span className="section-label">Get In Touch</span>
      <h2 className="section-heading">
        Let's <span className="text-gradient">Connect</span>
      </h2>
      <p className="section-description">
        Whether you have a project idea, want to collaborate, or just want to say hello —
        I'd love to hear from you!
      </p>

      <div className="contact-details">
        <div className="contact-detail-item">
          <span className="contact-icon"><MapPinIcon size={18} /></span>
          <span>Visakhapatnam, Andhra Pradesh, India</span>
        </div>
      </div>

      <div className="contact-socials">
        {socials.map((s) => (
          <a
            key={s.name}
            href={s.url}
            aria-label={s.name}
            title={s.name}
            className="contact-social-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            {s.icon}
          </a>
        ))}
      </div>
    </div>
  );
}
