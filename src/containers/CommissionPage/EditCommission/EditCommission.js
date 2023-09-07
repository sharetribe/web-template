import React, { useState } from 'react';
import { number, shape } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useConfiguration } from '../../../context/configurationContext';
import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';

import { withViewport } from '../../../util/uiHelpers';
import { isScrollingDisabled } from '../../../ducks/ui.duck';
import { NamedRedirect } from '../../../components';
// import { getMarketplaceEntities } from '../../../ducks/marketplaceData.duck';
import {
  H2,
  Page,
  Footer,
  LayoutSingleColumnMidle,
} from '../../../components';

import TopbarContainer from '../../TopbarContainer/TopbarContainer';
import NotFoundPage from '../../NotFoundPage/NotFoundPage';

import EditCommissionForm from './EditCommissionForm/EditCommissionForm';

import { updateCommission, uploadImage } from './EditCommission.duck';

import css from './EditCommission.module.css';

export const MainContent = props => {
  const {
   
  } = props;
  
  
  return (
    <div>
      <H2 as="h1" className={css.desktopHeading}>
        <FormattedMessage id="CommissionPage.desktopHeading" values={{ name: 'displayName' }} />
      </H2>

    </div>
  );
};

const EditCommissionComponent = props => {
    const config = useConfiguration();
    
    const { scrollingDisabled, updateInProgress, onUpdateCommission, updateSuccess, intl, userId, userName, commission, ...rest } = props;
    
    const schemaTitleVars = { name: 'displayName', marketplaceName: config.marketplaceName };
    const schemaTitle = intl.formatMessage({ id: 'EditCommission.schemaTitle' }, schemaTitleVars);

    const routeName = "Commission";

    const handleSubmit = values => {
      const data = {
        values,
        userId
      }
  
      return onUpdateCommission(data);
    };

    const redirect = !updateSuccess ? null : ( <NamedRedirect
      name={routeName}
      state={{ from: `${location.pathname}${location.search}${location.hash}` }}
    />);
    
    return (
      <Page
        scrollingDisabled={scrollingDisabled}
        title={schemaTitle}
        schema={{
          '@context': 'http://schema.org',
          '@type': 'CommissionPage',
          name: schemaTitle,
        }}
      >
        <LayoutSingleColumnMidle
          topbar={<TopbarContainer currentPage="CommissionPage" />}
          footer={<Footer />}
        >
          <MainContent  {...rest} />
            <div className={css.main}>
              <EditCommissionForm
                intl={injectIntl}
                // dispatch={noop}
                onSubmit={handleSubmit}
                initialValues={{ commission:commission }}
                formId="EditCommissionForm"
                userName={userName}
                inProgress={updateInProgress}
                ready={false}
              />
            </div>

           {redirect}
          
        </LayoutSingleColumnMidle>
      </Page>
    );
  };

  EditCommissionComponent.defaultProps = {
    currentUser: null,
    user: null,
    // userShowError: null,
    queryListingsError: null,
    reviews: [],
    // queryReviewsError: null,
  };
  
  EditCommissionComponent.propTypes = {

    // queryReviewsError: propTypes.error,
  
    // form withViewport
    viewport: shape({
      width: number.isRequired,
      height: number.isRequired,
    }).isRequired,
  
    // from injectIntl
    intl: intlShape.isRequired,
  };

const mapStateToProps = state => {
  const { currentUser } = state.user;
  
  const {
    userId,
    // userShowError,
    // queryListingsError,
    // userListingRefs,
    commission,
    userName,
    intl,
    params,
    updateInProgress,
    updateSuccess
  } = state.EditCommission;

  // const userMatches = getMarketplaceEntities(state, [{ type: 'user', id: userId }]);
  // const user = userMatches.length === 1 ? userMatches[0] : null;
  // const listings = getMarketplaceEntities(state, userListingRefs);
  return {
    userId,
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    // user,
    commission,
    userName,
    // userShowError,
    // queryListingsError,
    // listings,
    // reviews,
    intl,
    params,
    updateInProgress,
    updateSuccess
  };
};


const mapDispatchToProps = dispatch => ({
  onUpdateCommission: data => dispatch(updateCommission(data)),
});

const EditCommission = compose(
    connect(mapStateToProps,mapDispatchToProps),
    withViewport,
    injectIntl
  )(EditCommissionComponent);
  
  export default EditCommission;