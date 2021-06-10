import React from 'react';

import config from '../../config';
import { twitterPageURL } from '../../util/urlHelpers';
import {
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  ExternalLink,
} from '../../components';
import StaticPage from '../../containers/StaticPage/StaticPage';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';

import css from './AboutPage.module.css';
import image from './about-us-1056.jpg';

const AboutPage = () => {
  const { siteTwitterHandle, siteFacebookPage } = config;
  const siteTwitterPage = twitterPageURL(siteTwitterHandle);

  // prettier-ignore
  return (
    <StaticPage
      title="About Us"
      schema={{
        '@context': 'http://schema.org',
        '@type': 'AboutPage',
        description: 'About Sneakertime',
        name: 'About page',
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer />
        </LayoutWrapperTopbar>

        <LayoutWrapperMain className={css.staticPageWrapper}>
          <h1 className={css.pageTitle}>There's no such thing as too many sneakers.</h1>
          <img className={css.coverImage} src={image} alt="My first ice cream." />

          <div className={css.contentWrapper}>
            <div className={css.contentSide}>
              <p>"We've built Sneakertime because we didn't trust anonymous sellers online without recommendations."</p>
            </div>

            <div className={css.contentMain}>
              <h2>
                The world of Sneakers couldn't be more exciting! Whether you are a casual buyer or an experienced collector, you can find the right pair on Sneakertime and trust sellers that your new favorite item will be swiftly and safely sent to you or ready for pickup.
              </h2>

              <p>
                Buying sneakers can be stressful: you can find many online websites where to buy them but most don't deliver the trust you can legitimately expect. With Sneakertime, we want to make sure you're transaction will go smoothly: from browsing and checking the stock, to making the order and payment, to the review of the sellers. And we hope you'll be so convinced that you'll soon start selling your least favorite pairs to make new buyers happy!
              </p>

              <h3 className={css.subtitle}>Do you have sneakers to sell?</h3>

              <p>
                Sneakertime offers you a good way to earn some extra cash! If you're not using your
                sneakers anymore, why not sell them to other sneakers fans? And if you already have laid your eyes on the pair you want next, selling something from your collection is a great way to get money for your next buy and make room in your closets!
              </p>

              <h3 id="contact" className={css.subtitle}>
                Create your own marketplace like Sneakertime
              </h3>
              <p>
                Sneakertime is brought to you by the good folks at{' '}
                <ExternalLink href="http://www.sharetribe.com">Sharetribe</ExternalLink>. Would you like
                to create your own marketplace platform a bit like Sneakertime? Or perhaps a mobile
                app? With Sharetribe it's really easy. If you have a marketplace idea in mind, do
                get in touch!
              </p>
              <p>
                You can also checkout our{' '}
                <ExternalLink href={siteFacebookPage}>Facebook</ExternalLink> and{' '}
                <ExternalLink href={siteTwitterPage}>Twitter</ExternalLink>.
              </p>
            </div>
          </div>
        </LayoutWrapperMain>

        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </StaticPage>
  );
};

export default AboutPage;
