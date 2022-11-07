import React, { useEffect, useState } from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { NamedLink, ResponsiveBackgroundImageContainer } from '../../../components';

import css from './SectionHero.module.css';
import { useConfiguration } from '../../../context/configurationContext';

const SectionHero = props => {
  const [mounted, setMounted] = useState(false);
  const config = useConfiguration();
  const { rootClassName, className } = props;

  useEffect(() => {
    setMounted(true);
  }, []);

  const classes = classNames(rootClassName || css.root, className);

  return (
    <ResponsiveBackgroundImageContainer
      className={classes}
      as="section"
      image={config.branding.brandImageURL}
      sizes="100%"
      useOverlay
    >
      <div className={css.heroContent}>
        <h1 className={classNames(css.heroMainTitle, { [css.heroMainTitleFEDelay]: mounted })}>
          <FormattedMessage id="SectionHero.title" />
        </h1>
        <p className={classNames(css.heroSubTitle, { [css.heroSubTitleFEDelay]: mounted })}>
          <FormattedMessage id="SectionHero.subTitle" />
        </p>
        <NamedLink
          name="SearchPage"
          className={classNames(css.heroButton, { [css.heroButtonFEDelay]: mounted })}
        >
          <FormattedMessage id="SectionHero.browseButton" />
        </NamedLink>
      </div>
    </ResponsiveBackgroundImageContainer>
  );
};

SectionHero.defaultProps = { rootClassName: null, className: null };

SectionHero.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionHero;
