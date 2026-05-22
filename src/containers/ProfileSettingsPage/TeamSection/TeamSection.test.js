import React from 'react';
import '@testing-library/jest-dom';

import { createCurrentUser } from '../../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';

import TeamSection from './TeamSection';

const { screen } = testingLibrary;
const noop = () => Promise.resolve();

const teamUser = publicData =>
  createCurrentUser('t', { profile: { publicData: { userType: 'teamname', ...publicData } } });
const individualUser = publicData =>
  createCurrentUser('i', { profile: { publicData: { userType: 'individual', ...publicData } } });

describe('TeamSection', () => {
  it('renders nothing for users without a NextRep user type', () => {
    render(
      <TeamSection currentUser={createCurrentUser('x')} onJoinTeam={noop} onLeaveTeam={noop} />
    );
    expect(screen.queryByText('ProfileSettingsPage.TeamSection.title')).toBeNull();
  });

  it('shows the formatted team code for a team account', () => {
    render(
      <TeamSection
        currentUser={teamUser({ teamCode: 'NRK7MQ9P2' })}
        onJoinTeam={noop}
        onLeaveTeam={noop}
      />
    );
    expect(screen.getByText('NR-K7MQ9P2')).toBeInTheDocument();
    expect(screen.getByText('ProfileSettingsPage.TeamSection.copy')).toBeInTheDocument();
  });

  it('shows the join form and joined teams for an individual', () => {
    render(
      <TeamSection
        currentUser={individualUser({ teamCodes: ['NRAAAAAA2'] })}
        onJoinTeam={noop}
        onLeaveTeam={noop}
      />
    );
    expect(screen.getByText('ProfileSettingsPage.TeamSection.joinButton')).toBeInTheDocument();
    expect(screen.getByText('NR-AAAAAA2')).toBeInTheDocument();
  });
});
