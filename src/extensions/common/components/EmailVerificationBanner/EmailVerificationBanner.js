import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom'; // Assuming React Router is used
import { SecondaryButton } from '../../../../components';
import { MailCheck } from 'lucide-react';
import { FormattedMessage } from '../../../../util/reactIntl';
import css from './EmailVerificationBanner.module.css';

const EmailVerificationBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/account/contact-details' || location.pathname === '/signup') {
      setIsVisible(false);
    }
  }, [location.pathname]);

  const handleVerifyClick = () => {
    history.push('/account/contact-details');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <section className={css.root}>
      <div>
        <MailCheck /> <FormattedMessage id="EmailVerificationBanner.title" />
    </div>
      <SecondaryButton className={css.button} onClick={handleVerifyClick}>
        <FormattedMessage id="EmailVerificationBanner.buttonLabel" />
      </SecondaryButton>
    </section>
  );
};

export default EmailVerificationBanner;