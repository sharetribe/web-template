import React from 'react';

import appSettings from '../../config/settings';
import { FormattedMessage } from '../../util/reactIntl';

import { LayoutSingleColumn } from '../../components';
import css from './MaintenanceMode.module.css';

// MaintenanceMode component is shown when mandatory app-wide configurations are not found from assets.
// Note 1: this microcopy/translation does not come from translation file.
//         It needs to be something that is not part of fetched assets but built-in text
// Note 2: In the LandingPage directory, there's a similar content (FallbackPage.js).
const MaintenanceMode = props => {
  const isDev = appSettings.dev;
  return (
    <LayoutSingleColumn
      mainColumnClassName={css.layoutWrapperMain}
      topbar={<div className={css.header} title="Maintenance mode"></div>}
      footer={null}
    >
      <section id="content" className={css.root}>
        <div className={css.content}>
          <h2>
            <FormattedMessage id="MaintenanceMode.title" defaultMessage="Maintenance mode" />
          </h2>
          <p>
            <FormattedMessage
              id="MaintenanceMode.info"
              defaultMessage="The marketplace is not fully operational at the moment."
            />
          </p>
          {isDev ? (
            <>
              <p>
                Check that all the configuration assets are added to your marketplace environment
                through the Marketplace Console.
              </p>
              <p>Check also browser's developer tools for printed errors.</p>
            </>
          ) : (
            <p>
              <FormattedMessage
                id="MaintenanceMode.howToProceed"
                defaultMessage="Try refreshing the page and if that does not solve the issue, contact the marketplace admins."
              />
            </p>
          )}
        </div>
      </section>
    </LayoutSingleColumn>
  );
};

export default MaintenanceMode;
