import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import NamedLink from './NamedLink';

const { screen } = testingLibrary;

describe('NamedLink', () => {
  // This is quite small component what comes to rendered HTML
  // For now, we rely on snapshot-testing and testing couple of features.
  it('matches snapshot', () => {
    const activeClassName = 'my-active-class';
    const landingPageProps = {
      name: 'LandingPage',
      activeClassName,
      match: { url: '/' },
    };
    const searchPageProps = {
      name: 'SearchPage',
      activeClassName,
      match: { url: '/' },
    };

    const tree = render(
      <div>
        <NamedLink {...landingPageProps}>link to a</NamedLink>
        <NamedLink {...searchPageProps}>link to b</NamedLink>
      </div>
    );
    expect(screen.getByRole('link', { name: 'link to a' })).toHaveClass(activeClassName);
    expect(screen.getByRole('link', { name: 'link to b' })).not.toHaveClass(activeClassName);
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });

  it('should contain correct link', () => {
    const id = '12';
    render(
      <NamedLink name="ListingPageCanonical" params={{ id }}>
        to ListingPage
      </NamedLink>
    );
    const link = screen.getByRole('link', { name: 'to ListingPage' });
    expect(link.getAttribute('href')).toEqual(`/l/${id}`);
  });
});
