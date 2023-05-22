import React from 'react';

import { LayoutSingleColumn } from '../../components';
import css from './MaintenanceMode.module.css';

// MaintenanceMode component is shown when mandatory app-wide configurations are not found from assets.
// Note 1: this microcopy/translation does not come from translation file.
//         It needs to be something that is not part of fetched assets but built-in text
// Note 2: In the LandingPage directory, there's a similar content (FallbackPage.js).
const MaintenanceMode = props => {
  return (
    <LayoutSingleColumn
      mainColumnClassName={css.layoutWrapperMain}
      topbar={<div className={css.header} title="Maintenance mode"></div>}
      footer={null}
    >
      <section id="content" className={css.root}>
        <div className={css.content}>
          <h2>Maintenance mode</h2>
          <p>
            The marketplace is not fully operational at the moment.
            <br />
            Try refreshing the page and if that does not solve the issue, contact the marketplace
            admins.
          </p>
        </div>
      </section>
    </LayoutSingleColumn>
  );
};

export default MaintenanceMode;
