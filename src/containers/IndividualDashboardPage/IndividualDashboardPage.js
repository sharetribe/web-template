import React, { useEffect } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { ensureCurrentUser } from '../../util/data';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { loadTeamNames } from '../../ducks/team.duck';
import { getJoinedTeamCodes, formatTeamCode } from '../../util/teams';

import { H3, H4, Page, UserNav, NamedLink, LayoutSingleColumn } from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import css from './IndividualDashboardPage.module.css';

const StatCard = ({ labelId, value, pending }) => (
  <div className={css.statCard}>
    <span className={css.statValue}>{pending ? '—' : value}</span>
    <span className={css.statLabel}>
      <FormattedMessage id={labelId} />
    </span>
  </div>
);

// Map a user-field enum value (e.g. 'baseball') to its configured label, falling back to the value.
const labelForSport = (userFields, value) => {
  const sportField = (userFields || []).find(f => f.key === 'sport');
  const option = sportField?.enumOptions?.find(o => o.option === value);
  return option?.label || value;
};

const Chips = ({ items, emptyId }) =>
  items.length > 0 ? (
    <ul className={css.chips}>
      {items.map(({ key, label }) => (
        <li key={key} className={css.chip}>
          {label}
        </li>
      ))}
    </ul>
  ) : (
    <p className={css.empty}>
      <FormattedMessage id={emptyId} />
    </p>
  );

/**
 * Individual dashboard: a member's own gear activity plus the teams and sports on their profile.
 * Own-listing count is loaded via the page's loadData; teams/sports come from the current user.
 * Items sold / purchased / revenue are placeholders pending transaction aggregation.
 *
 * @component
 * @returns {JSX.Element}
 */
export const IndividualDashboardPageComponent = props => {
  const config = useConfiguration();
  const intl = useIntl();
  const {
    scrollingDisabled,
    currentUser,
    listedCount,
    listings,
    queryInProgress,
    teamNames,
    onLoadTeamNames,
  } = props;

  const user = ensureCurrentUser(currentUser);
  const publicData = user.attributes.profile.publicData || {};
  const userFields = config.user?.userFields || [];

  const joinedCodes = getJoinedTeamCodes(user);
  const joinedKey = joinedCodes.join(',');
  useEffect(() => {
    onLoadTeamNames(joinedCodes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLoadTeamNames, joinedKey]);

  const teams = joinedCodes.map(code => ({
    key: code,
    label: teamNames[code] || formatTeamCode(code),
  }));
  const sportValues = Array.isArray(publicData.sport) ? publicData.sport : [];
  const sports = sportValues.map(v => ({ key: v, label: labelForSport(userFields, v) }));

  const title = intl.formatMessage({ id: 'IndividualDashboardPage.title' });

  return (
    <Page className={css.root} title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer />
            <UserNav currentPage="IndividualDashboardPage" />
          </>
        }
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <H3 as="h1" className={css.heading}>
            <FormattedMessage id="IndividualDashboardPage.heading" />
          </H3>

          <section className={css.statsGrid}>
            <StatCard
              labelId="IndividualDashboardPage.itemsListed"
              value={listedCount}
              pending={queryInProgress || listedCount == null}
            />
            <StatCard labelId="IndividualDashboardPage.itemsSold" value={0} pending />
            <StatCard labelId="IndividualDashboardPage.itemsPurchased" value={0} pending />
            <StatCard labelId="IndividualDashboardPage.revenue" value={0} pending />
          </section>

          <section className={css.block}>
            <H4 as="h2" className={css.blockTitle}>
              <FormattedMessage id="IndividualDashboardPage.gearTitle" />
            </H4>
            {listings.length > 0 ? (
              <ul className={css.list}>
                {listings.map(l => (
                  <li key={l.id} className={css.listItem}>
                    {l.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={css.empty}>
                <FormattedMessage id="IndividualDashboardPage.noGear" />
              </p>
            )}
          </section>

          <section className={css.block}>
            <H4 as="h2" className={css.blockTitle}>
              <FormattedMessage id="IndividualDashboardPage.teamsTitle" />
            </H4>
            <Chips items={teams} emptyId="IndividualDashboardPage.noTeams" />
            <NamedLink className={css.manageLink} name="ProfileSettingsPage">
              <FormattedMessage id="IndividualDashboardPage.manageTeams" />
            </NamedLink>
          </section>

          <section className={css.block}>
            <H4 as="h2" className={css.blockTitle}>
              <FormattedMessage id="IndividualDashboardPage.sportsTitle" />
            </H4>
            <Chips items={sports} emptyId="IndividualDashboardPage.noSports" />
          </section>

          <p className={css.note}>
            <FormattedMessage id="IndividualDashboardPage.salesNote" />
          </p>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const { listedCount, listings, queryInProgress } = state.IndividualDashboardPage;
  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    listedCount,
    listings,
    queryInProgress,
    teamNames: state.team.teamNames,
  };
};

const mapDispatchToProps = dispatch => ({
  onLoadTeamNames: codes => dispatch(loadTeamNames(codes)),
});

const IndividualDashboardPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(IndividualDashboardPageComponent);

export default IndividualDashboardPage;
