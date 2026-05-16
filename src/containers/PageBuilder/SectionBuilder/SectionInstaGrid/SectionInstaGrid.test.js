import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';

import SectionInstaGrid from './SectionInstaGrid';

const { screen, userEvent } = testingLibrary;

const blocks = [
  {
    blockId: 'post-1',
    blockName: 'May 16',
    media: {
      image: {
        attributes: {
          variants: {
            'scaled-medium': { url: 'https://example.com/post-1-small.jpg' },
            original800: { url: 'https://example.com/post-1.jpg' },
          },
        },
      },
    },
  },
];

describe('SectionInstaGrid', () => {
  it('uses translated labels for post buttons and modal controls', async () => {
    const user = userEvent.setup();

    render(
      <SectionInstaGrid
        sectionId="av-insta-grid"
        title={{ content: 'archivovintach' }}
        blocks={blocks}
      />,
      {
        messages: {
          'SectionInstaGrid.dialogLabel': 'Social post',
          'SectionInstaGrid.closePost': 'Close social post',
          'SectionInstaGrid.viewPost': 'Open social post {index}',
        },
      }
    );

    await user.click(screen.getByRole('button', { name: 'Open social post 1' }));

    expect(screen.getByRole('dialog', { name: 'Social post' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close social post' })).toBeInTheDocument();
  });
});
