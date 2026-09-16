import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../../../common/Icons';

export default function CertificateLightboxModal({
  certificates,
  activeIndex,
  onClose,
  onPrev,
  onNext,
}) {
  useEffect(() => {
    if (activeIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, onClose, onPrev, onNext]);

  if (activeIndex === null || typeof document === 'undefined') return null;

  const currentCert = certificates[activeIndex];
  if (!currentCert) return null;

  return createPortal(
    <div
      className="pure-lightbox-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Close Button */}
      <button
        type="button"
        className="pure-lightbox-close"
        onClick={onClose}
        aria-label="Close certificate preview"
      >
        <CloseIcon size={24} />
      </button>

      {/* Main Centered Image & Navigation */}
      <div
        className="pure-lightbox-content"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentCert.image}
          alt={`Blood Donation Certificate ${activeIndex + 1}`}
          className="pure-lightbox-img"
        />
        <div className="pure-lightbox-bottom-bar">
          <button
            type="button"
            className="pure-lightbox-arrow pure-lightbox-arrow-left"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Previous certificate image"
            title="Previous Image"
          >
            <ChevronLeftIcon size={24} />
          </button>
          <div className="pure-lightbox-counter">
            {activeIndex + 1} / {certificates.length}
          </div>
          <button
            type="button"
            className="pure-lightbox-arrow pure-lightbox-arrow-right"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Next certificate image"
            title="Next Image"
          >
            <ChevronRightIcon size={24} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
