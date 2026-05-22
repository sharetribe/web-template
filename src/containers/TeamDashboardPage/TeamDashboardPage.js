import React, { useEffect, useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { createSlug } from '../../util/urlHelpers';
import { formatTeamCode } from '../../util/teams';

import {
  H3,
  H4,
  Page,
  UserNav,
  InlineTextButton,
  NamedLink,
  LayoutSingleColumn,
} from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import { loadTeamStats } from './TeamDashboardPage.duck';
import css from './TeamDashboardPage.module.css';

const StatCard = ({ labelId, value, pending }) => (
  <div className={css.statCard}>
    <span className={css.statValue}>{pending ? '—' : value}</span>
    <span className={css.statLabel}>
      <FormattedMessage id={labelId} />
    </span>
  </div>
);

/**
 * Team Admin dashboard: the team's join code plus a virtual-warehouse overview of gear activity
 * across the team (team-posted and member-posted). Metrics are fetched from the server
 * (Integration API). Items sold / revenue are placeholders pending transaction aggregation.
 *
 * @component
 * @returns {JSX.Element}
 */
export const TeamDashboardPageComponent = props => {
  const intl = useIntl();
  const { scrollingDisabled, stats, fetchInProgress, fetchError, onLoadTeamStats } = props;

  useEffect(() => {
    onLoadTeamStats();
  }, [onLoadTeamStats]);

  const [copied, setCopied] = useState(false);
  const displayCode = stats?.teamCode ? formatTeamCode(stats.teamCode) : null;
  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && displayCode) {
      navigator.clipboard.writeText(displayCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const title = intl.formatMessage({ id: 'TeamDashboardPage.title' });
  const integrationOff = stats && stats.integrationConfigured === false;

  return (
    <Page className={css.root} title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer />
            <UserNav currentPage="TeamDashboardPage" />
          </>
        }
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <H3 as="h1" className={css.heading}>
            <FormattedMessage id="TeamDashboardPage.heading" />
          </H3>

          {fetchInProgress && !stats ? (
            <p className={css.message}>
              <FormattedMessage id="TeamDashboardPage.loading" />
            </p>
          ) : fetchError ? (
            <p className={css.error}>
              <FormattedMessage id="TeamDashboardPage.error" />
            </p>
          ) : stats ? (
            <>
              <section className={css.identity}>
                <H4 as="h2" className={css.teamName}>
                  {stats.teamName || <FormattedMessage id="TeamDashboardPage.untitledTeam" />}
                </H4>
                {displayCode ? (
                  <div className={css.codeRow}>
                    <span className={css.codeLabel}>
                      <FormattedMessage id="TeamDashboardPage.teamCodeLabel" />
                    </span>
                    <span className={css.code}>{displayCode}</span>
                    <InlineTextButton type="button" className={css.copyButton} onClick={handleCopy}>
                      <FormattedMessage
                        id={copied ? 'TeamDashboardPage.copied' : 'TeamDashboardPage.copy'}
                      />
                    </InlineTextButton>
                  </div>
                ) : null}
              </section>

              <section className={css.statsGrid}>
                <StatCard
                  labelId="TeamDashboardPage.members"
                  value={stats.memberCount}
                  pending={stats.memberCount == null}
                />
                <StatCard
                  labelId="TeamDashboardPage.itemsListed"
                  value={stats.listedCount}
                  pending={stats.listedCount == null}
                />
                <StatCard labelId="TeamDashboardPage.itemsSold" value={stats.soldCount} pending />
                <StatCard labelId="TeamDashboardPage.revenue" value={stats.totalRevenue} pending />
              </section>

              <section className={css.block}>
                <H4 as="h2" className={css.blockTitle}>
                  <FormattedMessage id="TeamDashboardPage.membersTitle" />
                </H4>
                {stats.members?.length > 0 ? (
                  <ul className={css.list}>
                    {stats.members.map(m => (
                      <li key={m.id} className={css.listItem}>
                        <NamedLink className={css.listLink} name="ProfilePage" params={{ id: m.id }}>
                          {m.name || <FormattedMessage id="TeamDashboardPage.unnamedMember" />}
                        </NamedLink>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={css.empty}>
                    <FormattedMessage id="TeamDashboardPage.noMembers" />
                  </p>
                )}
              </section>

              <section className={css.block}>
                <H4 as="h2" className={css.blockTitle}>
                  <FormattedMessage id="TeamDashboardPage.gearTitle" />
                </H4>
                {stats.listings?.length > 0 ? (
                  <ul className={css.list}>
                    {stats.listings.map(l => (
                      <li key={l.id} className={css.listItem}>
                        <NamedLink
                          className={css.listLink}
                          name="ListingPage"
                          params={{ id: l.id, slug: createSlug(l.title || '') }}
                        >
                          <span className={css.listTitle}>{l.title}</span>
                        </NamedLink>
                        {l.author ? (
                          <span className={css.listMeta}>
                            <FormattedMessage
                              id="TeamDashboardPage.postedBy"
                              values={{ author: l.author }}
                            />
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={css.empty}>
                    <FormattedMessage id="TeamDashboardPage.noGear" />
                  </p>
                )}
              </section>

              <p className={css.note}>
                <FormattedMessage id="TeamDashboardPage.salesNote" />
              </p>
              {integrationOff ? (
                <p className={css.note}>
                  <FormattedMessage id="TeamDashboardPage.integrationOff" />
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { stats, fetchInProgress, fetchError } = state.TeamDashboardPage;
  return {
    scrollingDisabled: isScrollingDisabled(state),
    stats,
    fetchInProgress,
    fetchError,
  };
};

const mapDispatchToProps = dispatch => ({
  onLoadTeamStats: () => dispatch(loadTeamStats()),
});

const TeamDashboardPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(TeamDashboardPageComponent);

export default TeamDashboardPage;
