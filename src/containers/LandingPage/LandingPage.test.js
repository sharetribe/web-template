import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render } from '../../util/testHelpers';

import { LandingPageComponent } from './LandingPage';

describe('LandingPage', () => {
  // For now, we rely on snapshot-testing to check the content of fallback page.
  test('matches snapshot', () => {
    let error = new Error('Fake error');
    error.type = 'error';
    error.status = 404;
    error.type;

    // Testing that the fallback page looks as expected
    const tree = render(
      <LandingPageComponent pageAssetsData={{}} inProgress={false} error={error} />
    );
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });
});
