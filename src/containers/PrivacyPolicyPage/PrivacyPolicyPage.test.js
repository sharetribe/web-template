import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import { PrivacyPolicyPageComponent } from './PrivacyPolicyPage';

const { waitFor } = testingLibrary;

describe('PrivacyPolicyPage', () => {
  it('renders the Fallback page on error', async () => {
    const errorMessage = 'PrivacyPolicyPage failed';
    let e = new Error(errorMessage);
    e.type = 'error';
    e.name = 'Test';

    const { getByText } = render(
      <PrivacyPolicyPageComponent pageAssetsData={null} inProgress={false} error={e} />
    );

    await waitFor(() => {
      expect(getByText('Privacy Policy')).toBeInTheDocument();
      expect(getByText('An error occurred')).toBeInTheDocument();
    });
  });
});
