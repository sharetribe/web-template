import React, { useState } from 'react';
import css from './NewsletterForm.module.css'; // or CSS module in the FTW style

const BREVO_API_KEY = process.env.REACT_APP_BREVO_API_KEY;
const BREVO_LIST_ID = process.env.REACT_APP_BREVO_LIST_ID;

const NewsletterForm = ({
  className,
  disclaimerText = "",
  okMsg = "Thanks! Please check your inbox.",
  errorMsg = "Subscription failed. Try again later.",
}) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const onSubmit = async e => {
    e.preventDefault();
    setMessage(null);

    const val = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setMessage({ type: 'error', text: 'Please enter a valid email.' });
      return;
    }

    setSubmitting(true);
    try {
      const apiBase =
        process.env.REACT_APP_ENV === 'development'
          ? `${window.location.protocol}//${window.location.hostname}:${process.env.REACT_APP_DEV_API_SERVER_PORT}`
          : ''; // same-origin in prod SSR

      const r = await fetch(`${apiBase}/api/brevo/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: val, hp: '' }),
      });
      const j = await r.json();
      console.log(r, j);

      if (j.ok && r.ok) {
        setMessage({ type: 'ok', text: okMsg });
        setEmail('');
      } else {
        setMessage({ type: 'error', text: errorMsg });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className={className}>
      {/* Honeypot anti-bot field (hidden from users) */}
      <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
        <label>Leave this field empty:
          <input type="text" name="hp" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className={css.group}>
        <label className={css.label}>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            disabled={submitting}
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={css.input}
            placeholder="Tu Email"
          />
        </label>

        <button type="submit" disabled={submitting} className={css.button}>
          <svg width="15" height="18" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.8684 0.4098C14.8419 0.367941 14.8998 0.44589 14.8684 0.4098C14.867 0.408056 14.8699 0.41141 14.8684 0.4098C14.8697 0.411276 14.8671 0.408324 14.8684 0.4098C14.6927 0.212848 14.1806 0.4098 13.8977 0.4098C13.7371 0.4098 14.077 0.342047 13.8977 0.4098L0.307353 4.80608C-0.390956 5.06971 0.320981 5.6544 0.307353 5.90515C0.293608 6.15604 -0.35671 6.6452 0.307353 7.00422L4.1903 9.20236L2.24883 12.4996C2.24515 12.5096 2.25179 12.4894 2.24883 12.4996C2.084 13.0594 1.9681 14.38 2.24883 14.6977C2.42811 14.9007 2.93623 14.6977 3.21956 14.6977C3.37977 14.6977 4.01172 14.7651 4.1903 14.6977C4.18141 14.7019 4.19942 14.6942 4.1903 14.6977L7.10251 12.4996L9.04398 16.8958C9.34651 17.613 9.80391 17.9949 10.0147 17.9949C10.203 17.9949 10.7326 17.7549 10.9855 16.8958L14.8684 1.50887C15.0133 1.01662 15.072 0.729512 14.8684 0.4098ZM1.27809 5.90515C1.21837 5.92769 1.31411 5.88449 1.27809 5.90515L13.8977 1.50887L6.13177 9.20236C5.87226 8.95523 6.38915 8.24242 6.13177 8.10329L1.27809 5.90515C1.31162 5.93064 1.22133 5.87443 1.27809 5.90515ZM3.21956 13.5986C3.06255 13.6557 3.248 13.6095 3.21956 13.5986C3.1692 13.7764 3.20996 13.5663 3.21956 13.5986L5.16104 9.20236C5.71181 9.50007 6.83944 10.777 7.10251 11.4005L3.21956 13.5986ZM10.0147 15.7968C9.99481 15.8645 10.033 15.756 10.0147 15.7968C9.99208 15.7588 10.0419 15.8613 10.0147 15.7968L8.07324 10.3014C7.95036 10.01 7.32078 10.5954 7.10251 10.3014L13.8977 1.50887L10.0147 15.7968Z" fill="#E6E56A"/>
          </svg>
        </button>
      </div>

      {message && (
        <div className={message.type === 'ok' ? css.msgOk : css.msgError}>
          {message.text}
        </div>
      )}

      <span className={css.disclaimerText}>{disclaimerText}</span>
    </form>
    
  );
};

export default NewsletterForm;