import { useState, useRef, useCallback } from 'react';
import useScrollReveal from '../../../../hooks/useScrollReveal';
import { RedCrossIcon, NssIcon } from '../../../common/Icons';
import ircsLogo from '../../../../assets/IRCS.png';
import nssLogo from '../../../../assets/NSS.png';
import rotaryCertImg from '../../../../assets/gallery/blood-donation-rotary-2025.jpg';
import ammaCertImg from '../../../../assets/gallery/blood-donation-amma-2026.jpg';
import EventShowcaseCard from './EventShowcaseCard';
import VolunteeringCard from './VolunteeringCard';
import CertificateLightboxModal from './CertificateLightboxModal';
import './EventsStudent.css';

const bloodDonationCertificates = [
  {
    id: 'rotary-2025',
    center: 'Rotary Blood Centre',
    project: 'Rotary Club Visakha Port City · Camp at Narsipatnam',
    date: '15 Aug 2025',
    volume: '350 ml',
    bloodGroup: 'A+ve',
    donorName: 'K. Gowtham',
    certType: 'Blood Donor Certificate (ISO 9001:2015)',
    image: rotaryCertImg,
    pdfUrl: '/gallery/blood-donation-rotary-2025.pdf',
    downloadName: 'K-Gowtham-Blood-Donation-Rotary-15-Aug-2025.pdf',
  },
  {
    id: 'amma-2026',
    center: 'Amma Blood Centre',
    project: 'Venkey Birthday Celebrations · Gajuwaka, Visakhapatnam',
    date: '31 Jul 2026',
    volume: '350 ml',
    bloodGroup: 'A+ve',
    donorName: 'K. Gowtham',
    certType: 'Certificate of Appreciation',
    image: ammaCertImg,
    pdfUrl: '/gallery/blood-donation-amma-2026.pdf',
    downloadName: 'K-Gowtham-Blood-Donation-Amma-31-Jul-2026.pdf',
  },
];

const volunteering = [
  {
    role: 'Volunteer',
    organization: 'Indian Red Cross Society (IRCS)',
    period: 'Sep 2025 — Present',
    cause: 'Health',
    description:
      'Regular voluntary blood donor and dedicated youth volunteer with my college Red Cross unit, actively supporting humanitarian health drives and blood donation camps.',
    logo: ircsLogo,
    icon: <RedCrossIcon size={24} />,
    badgeColor: '#ff5c5c',
  },
  {
    role: 'Volunteer',
    organization: 'National Service Scheme (NSS)',
    period: 'Aug 2026 — Present',
    cause: 'Social Services',
    description:
      'Active volunteer contributing to community welfare drives, youth empowerment initiatives, campus cleanliness, and social awareness campaigns.',
    logo: nssLogo,
    icon: <NssIcon size={24} />,
    badgeColor: '#00f0ff',
  },
];

export default function EventsStudent() {
  const sectionRef = useRef(null);
  useScrollReveal(sectionRef);

  const [activeCertIndex, setActiveCertIndex] = useState(null);

  const handleCloseCert = useCallback(() => {
    setActiveCertIndex(null);
  }, []);

  const handlePrevCert = useCallback(() => {
    setActiveCertIndex((prev) =>
      prev === 0 ? bloodDonationCertificates.length - 1 : prev - 1
    );
  }, []);

  const handleNextCert = useCallback(() => {
    setActiveCertIndex((prev) =>
      prev === bloodDonationCertificates.length - 1 ? 0 : prev + 1
    );
  }, []);

  return (
    <section className="portfolio-section events-section" id="events" ref={sectionRef}>
      <div className="portfolio-section-inner">
        {/* Section Heading */}
        <div className="scroll-reveal">
          <span className="section-label">Leadership & Community</span>
          <h2 className="section-heading">Organized Events</h2>
        </div>

        {/* IGNITE 2026 Featured Event Card */}
        <EventShowcaseCard />

        {/* Dedicated Volunteering & Community Service Section */}
        <div className="volunteering-container scroll-reveal">
          <div className="volunteering-header">
            <span className="section-label">Service & Impact</span>
            <h2 className="section-heading">Volunteering & Community Service</h2>
          </div>

          <div className="volunteering-grid">
            {volunteering.map((item, i) => (
              <VolunteeringCard
                key={item.organization}
                item={item}
                index={i}
                onOpenCertificates={() => setActiveCertIndex(0)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Pure Image Lightbox Modal */}
      <CertificateLightboxModal
        certificates={bloodDonationCertificates}
        activeIndex={activeCertIndex}
        onClose={handleCloseCert}
        onPrev={handlePrevCert}
        onNext={handleNextCert}
      />
    </section>
  );
}
