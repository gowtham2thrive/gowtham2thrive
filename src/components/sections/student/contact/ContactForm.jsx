import { useState, useEffect, useRef } from 'react';

export default function ContactForm() {
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return;

    setStatus('sending');
    setErrorMessage('');

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('https://formsubmit.co/ajax/gowtham.proworkspace@gmail.com', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
          _subject: `New Portfolio Message from ${formData.name}`,
          _template: 'table',
          _captcha: 'false',
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!isMountedRef.current) return;

      if (response.ok && (data.success === 'true' || data.success === true || response.status === 200)) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          if (isMountedRef.current) setStatus('idle');
        }, 6000);
      } else {
        throw new Error(data.message || 'Server returned an error');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Contact submission error:', err);
      if (!isMountedRef.current) return;
      setStatus('error');
      setErrorMessage('Could not send message. Please try again in a moment.');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (isMountedRef.current) setStatus('idle');
      }, 8000);
    }
  };

  return (
    <div className="contact-form-container scroll-reveal">
      <form className="contact-form portfolio-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="contact-name">Name</label>
          <input
            id="contact-name"
            type="text"
            placeholder="Your name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="contact-email">Email</label>
          <input
            id="contact-email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="contact-message">Message</label>
          <textarea
            id="contact-message"
            placeholder="Tell me about your project..."
            rows={5}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
          />
        </div>
        <button
          type="submit"
          disabled={status === 'sending'}
          className={`btn btn-primary contact-submit ${status === 'success' ? 'submitted' : ''} ${status === 'error' ? 'error' : ''}`}
        >
          {status === 'sending' && 'Sending Message...'}
          {status === 'success' && '✓ Message Sent!'}
          {status === 'error' && '✕ Failed to Send — Retry'}
          {status === 'idle' && 'Send Message'}
        </button>
        {status === 'error' && (
          <p className="contact-error-msg">{errorMessage}</p>
        )}
        {status === 'success' && (
          <p className="contact-success-msg">Thank you! Your message has been sent successfully.</p>
        )}
      </form>
    </div>
  );
}
