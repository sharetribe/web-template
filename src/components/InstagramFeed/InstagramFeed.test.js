import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import InstagramFeed from './InstagramFeed';

const { screen, userEvent } = testingLibrary;

const profile = {
  username: 'archivovintach',
  profilePictureUrl: 'https://example.com/avatar.jpg',
};

const posts = [
  {
    id: 'post-1',
    mediaUrl: 'https://example.com/post-1.jpg',
    mediaType: 'IMAGE',
    caption: '',
    timestamp: '2026-05-16T12:00:00.000Z',
  },
];

describe('InstagramFeed', () => {
  it('uses translated labels for post buttons and modal controls', async () => {
    const user = userEvent.setup();

    render(<InstagramFeed profile={profile} posts={posts} />, {
      messages: {
        'InstagramFeed.dialogLabel': 'Social feed post',
        'InstagramFeed.closePost': 'Close feed post',
        'InstagramFeed.viewPost': 'Open feed post {index}',
        'InstagramFeed.mediaAlt': 'Social feed image',
      },
    });

    await user.click(screen.getByRole('button', { name: 'Open feed post 1' }));

    expect(screen.getByRole('dialog', { name: 'Social feed post' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close feed post' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Social feed image' })).toBeInTheDocument();
  });
});
