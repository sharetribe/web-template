import React from 'react';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { Heading, NamedLink } from '../../components';

import css from './AuthenticationPage.module.css';

// NextRep account types get friendly copy when the Console user-type labels are empty.
const KNOWN_LABEL = {
  teamname: 'AuthenticationPage.accountTypeTeam',
  individual: 'AuthenticationPage.accountTypeIndividual',
};
const KNOWN_DESC = {
  teamname: 'AuthenticationPage.accountTypeTeamDesc',
  individual: 'AuthenticationPage.accountTypeIndividualDesc',
};

/**
 * Pre-signup account-type chooser. Renders a card per configured user type, each deep-linking to
 * the type-specific signup route (/signup/:userType). Shown on /signup when no type is preselected.
 *
 * @component
 * @param {Object} props
 * @param {Array} props.userTypes configured user types ({ userType, label })
 * @param {Object} [props.fromState] react-router state to carry through (e.g. post-signup redirect)
 * @returns {JSX.Element}
 */
const AccountTypeChooser = props => {
  const intl = useIntl();
  const { userTypes, fromState } = props;

  const labelFor = ut =>
    ut.label ||
    (KNOWN_LABEL[ut.userType]
      ? intl.formatMessage({ id: KNOWN_LABEL[ut.userType] })
      : ut.userType);
  const descFor = ut =>
    KNOWN_DESC[ut.userType] ? intl.formatMessage({ id: KNOWN_DESC[ut.userType] }) : null;

  return (
    <div className={css.accountTypeChooser}>
      <Heading as="h2" rootClassName={css.accountTypeHeading}>
        <FormattedMessage id="AuthenticationPage.chooseAccountTypeHeading" />
      </Heading>
      <div className={css.accountTypeCards}>
        {userTypes.map(ut => {
          const desc = descFor(ut);
          return (
            <NamedLink
              key={ut.userType}
              className={css.accountTypeCard}
              name="SignupForUserTypePage"
              params={{ userType: ut.userType }}
              to={fromState}
            >
              <span className={css.accountTypeName}>{labelFor(ut)}</span>
              {desc ? <span className={css.accountTypeDesc}>{desc}</span> : null}
            </NamedLink>
          );
        })}
      </div>
    </div>
  );
};

export default AccountTypeChooser;
