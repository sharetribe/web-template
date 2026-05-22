import React, { useState } from 'react';

// Import contexts and util modules
import { FormattedMessage } from '../../../util/reactIntl';
import {
  isTeamAccount,
  isIndividualAccount,
  getTeamCode,
  getJoinedTeamCodes,
  formatTeamCode,
} from '../../../util/teams';

// Import shared components
import { H4, InlineTextButton, NamedLink } from '../../../components';

// Import modules from this directory
import JoinTeamForm from './JoinTeamForm';
import css from './TeamSection.module.css';

const copyToClipboard = text => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error('Clipboard unavailable'));
};

// Panel shown to a Team account: its non-expiring, shareable join code.
const TeamCodePanel = ({ teamCode }) => {
  const [copied, setCopied] = useState(false);
  const display = teamCode ? formatTeamCode(teamCode) : null;

  const handleCopy = () => {
    copyToClipboard(display)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setCopied(false));
  };

  return (
    <div className={css.codePanel}>
      <p className={css.description}>
        <FormattedMessage id="ProfileSettingsPage.TeamSection.teamDescription" />
      </p>
      {display ? (
        <div className={css.codeRow}>
          <span className={css.code}>{display}</span>
          <InlineTextButton type="button" className={css.copyButton} onClick={handleCopy}>
            <FormattedMessage
              id={
                copied
                  ? 'ProfileSettingsPage.TeamSection.copied'
                  : 'ProfileSettingsPage.TeamSection.copy'
              }
            />
          </InlineTextButton>
        </div>
      ) : (
        <p className={css.generating}>
          <FormattedMessage id="ProfileSettingsPage.TeamSection.generating" />
        </p>
      )}
      <NamedLink className={css.dashboardLink} name="TeamDashboardPage">
        <FormattedMessage id="ProfileSettingsPage.TeamSection.viewDashboard" />
      </NamedLink>
    </div>
  );
};

// Panel shown to an Individual: join teams by code, and manage joined teams.
const JoinTeamPanel = ({ joinedCodes, onJoinTeam, onLeaveTeam, joinInProgress, joinError }) => (
  <div className={css.joinPanel}>
    <p className={css.description}>
      <FormattedMessage id="ProfileSettingsPage.TeamSection.individualDescription" />
    </p>

    <JoinTeamForm
      onSubmit={values => onJoinTeam(values.teamCode)}
      inProgress={joinInProgress}
      hasError={!!joinError}
    />

    {joinedCodes.length > 0 ? (
      <ul className={css.joinedList}>
        {joinedCodes.map(code => (
          <li key={code} className={css.joinedItem}>
            <span className={css.joinedCode}>{formatTeamCode(code)}</span>
            <InlineTextButton
              type="button"
              className={css.leaveButton}
              onClick={() => onLeaveTeam(code)}
            >
              <FormattedMessage id="ProfileSettingsPage.TeamSection.leave" />
            </InlineTextButton>
          </li>
        ))}
      </ul>
    ) : (
      <p className={css.empty}>
        <FormattedMessage id="ProfileSettingsPage.TeamSection.noTeams" />
      </p>
    )}
  </div>
);

/**
 * Team membership section on the Profile Settings page. Renders a team's shareable join code
 * (for Team accounts) or a join-by-code panel (for Individual accounts). Renders nothing for
 * other/anonymous users.
 *
 * @component
 * @param {Object} props
 * @param {propTypes.currentUser} props.currentUser the current user
 * @param {Function} props.onJoinTeam (code) => Promise
 * @param {Function} props.onLeaveTeam (code) => Promise
 * @param {boolean} props.joinInProgress
 * @param {propTypes.error} props.joinError
 * @returns {JSX.Element|null}
 */
const TeamSection = props => {
  const { currentUser, onJoinTeam, onLeaveTeam, joinInProgress, joinError } = props;

  const isTeam = isTeamAccount(currentUser);
  const isIndividual = isIndividualAccount(currentUser);
  if (!isTeam && !isIndividual) {
    return null;
  }

  return (
    <section className={css.root}>
      <H4 as="h2" className={css.sectionTitle}>
        <FormattedMessage id="ProfileSettingsPage.TeamSection.title" />
      </H4>

      {isTeam ? (
        <TeamCodePanel teamCode={getTeamCode(currentUser)} />
      ) : (
        <JoinTeamPanel
          joinedCodes={getJoinedTeamCodes(currentUser)}
          onJoinTeam={onJoinTeam}
          onLeaveTeam={onLeaveTeam}
          joinInProgress={joinInProgress}
          joinError={joinError}
        />
      )}
    </section>
  );
};

export default TeamSection;
