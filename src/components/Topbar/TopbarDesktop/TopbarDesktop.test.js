import React from 'react';
import { fakeIntl } from '../../../util/test-data';
import { renderDeep } from '../../../util/test-helpers';
import TopbarDesktop from './TopbarDesktop';

const noop = () => null;

describe('TopbarDesktop', () => {
  it('data with location search matches snapshot', () => {
    window.google = { maps: {} };
    const topbarProps = {
      isAuthenticated: true,
      currentUserHasListings: true,
      name: 'John Doe',
      onSearchSubmit: noop,
      intl: fakeIntl,
      onLogout: noop,
      appConfig: { mainSearchType: 'location' },
    };
    const tree = renderDeep(<TopbarDesktop {...topbarProps} />);
    delete window.google;
    expect(tree).toMatchSnapshot();
  });

  it('data with keywords search matches snapshot', () => {
    window.google = { maps: {} };
    const topbarProps = {
      isAuthenticated: true,
      currentUserHasListings: true,
      name: 'John Doe',
      onSearchSubmit: noop,
      intl: fakeIntl,
      onLogout: noop,
      appConfig: { mainSearchType: 'keywords' },
    };
    const tree = renderDeep(<TopbarDesktop {...topbarProps} />);
    delete window.google;
    expect(tree).toMatchSnapshot();
  });
});
