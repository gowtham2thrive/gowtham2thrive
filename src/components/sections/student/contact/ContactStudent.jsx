import { useRef } from 'react';
import useScrollReveal from '../../../../hooks/useScrollReveal';
import ContactInfo from './ContactInfo';
import ContactForm from './ContactForm';
import './ContactStudent.css';

export default function ContactStudent() {
  const sectionRef = useRef(null);
  useScrollReveal(sectionRef);

  return (
    <section className="portfolio-section contact-section" id="contact" ref={sectionRef}>
      <div className="portfolio-section-inner">
        <div className="contact-grid">
          <ContactInfo />
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
