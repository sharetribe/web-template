import React from 'react';
import { FormattedMessage, intlShape, useIntl } from '../../util/reactIntl';
import css from './ListingPage.module.css';

// [SKYFARER]
// This is disabled per client request
const SectionLinks = () => null;
const SectionLinksDisabled = () => {
  // TODO: Pull these from Sharetribe backend
  const links = [
    {
      title: 'Sign up as a student',
      url: 'https://skyfareracademy.com/p/sign-up-as-a-student-pilot',
    },
    {
      title: 'Find the right flight instructor for you',
      url: 'https://skyfareracademy.com/p/find-the-right-flight-instructor-for-you',
    },
    {
      title: 'How to send a message to your flight instructor',
      url: 'https://skyfareracademy.com/p/how-to-send-a-message-to-your-flight-instructor',
    },
    {
      title: 'How to book a free consultation',
      url: 'https://skyfareracademy.com/p/how-to-book-a-free-consultation',
    },
    {
      title: 'Rules for Students',
      url: 'https://skyfareracademy.com/p/rules-for-students',
    },
    {
      title: 'How to prepare for your first session',
      url: 'https://skyfareracademy.com/p/how-to-prepare-for-your-first-session',
    },
    {
      title: 'How Session Packs Work',
      url: 'https://skyfareracademy.com/p/how-session-packs-works',
    },
    {
      title: 'Is Skyfarer Academy an Online Flight School?',
      url: 'https://skyfareracademy.com/p/is-skyfarer-academy-an-online-flight-school',
    },
    {
      title: 'Standard Refund Policy and Refund Eligibility Guidelines',
      url: 'https://skyfareracademy.com/p/standard-refund-policy-and-refund-eligibility-guidelines',
    },
  ];

  return (
    <section className={css.sectionLinks}>
      <h1>
        <FormattedMessage
          id="ListingPage.linksSectionTitle"
          defaultMessage="Becoming a Skyfarer Academy student"
        />
      </h1>
      <ul>
        {links.map((link, index) => (
          <li key={index}>
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              {link.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default SectionLinks;
