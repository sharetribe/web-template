import React, { Component } from 'react';
import { arrayOf, bool, func, object, shape, string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl, intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { createResourceLocatorString } from '../../util/routes';
import { isScrollingDisabled } from '../../ducks/UI.duck';

import {
  Page,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
} from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';

import LocationSearchForm from './LocationSearchForm/LocationSearchForm';

import css from './NotFoundPage.module.css';

export class NotFoundPageComponent extends Component {
  constructor(props) {
    super(props);
    // The StaticRouter component used in server side rendering
    // provides the context object. We attach a `notfound` flag to
    // the context to tell the server to change the response status
    // code into a 404.
    this.props.staticContext.notfound = true;
  }

  render() {
    const { history, routeConfiguration, siteTitle, intl, scrollingDisabled } = this.props;

    const title = intl.formatMessage({
      id: 'NotFoundPage.title',
    });

    const handleSearchSubmit = values => {
      const { search, selectedPlace } = values.location;
      const { origin, bounds } = selectedPlace;
      const searchParams = { address: search, origin, bounds };
      history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, searchParams));
    };

    return (
      <Page title={title} scrollingDisabled={scrollingDisabled}>
        <LayoutSingleColumn>
          <LayoutWrapperTopbar>
            <TopbarContainer />
          </LayoutWrapperTopbar>
          <LayoutWrapperMain>
            <div className={css.root}>
              <div className={css.content}>
                <div className={css.number}>404</div>
                <h1 className={css.heading}>
                  <FormattedMessage id="NotFoundPage.heading" />
                </h1>
                <p className={css.description}>
                  <FormattedMessage id="NotFoundPage.description" values={{ siteTitle }} />
                </p>
                <LocationSearchForm className={css.searchForm} onSubmit={handleSearchSubmit} />
              </div>
            </div>
          </LayoutWrapperMain>
          <LayoutWrapperFooter>
            <Footer />
          </LayoutWrapperFooter>
        </LayoutSingleColumn>
      </Page>
    );
  }
}

NotFoundPageComponent.defaultProps = {
  staticContext: {},
};

NotFoundPageComponent.propTypes = {
  scrollingDisabled: bool.isRequired,
  siteTitle: string.isRequired,

  // context object from StaticRouter, injected by the withRouter wrapper
  staticContext: object,

  // from useIntl
  intl: intlShape.isRequired,

  // from useRouteConfiguration
  routeConfiguration: arrayOf(propTypes.route).isRequired,

  // from useHistory
  history: shape({
    push: func.isRequired,
  }).isRequired,
};

const EnhancedNotFoundPage = props => {
  const routeConfiguration = useRouteConfiguration();
  const config = useConfiguration();
  const history = useHistory();
  const intl = useIntl();

  return (
    <NotFoundPageComponent
      routeConfiguration={routeConfiguration}
      siteTitle={config.siteTitle}
      history={history}
      intl={intl}
      {...props}
    />
  );
};

const mapStateToProps = state => {
  return {
    scrollingDisabled: isScrollingDisabled(state),
  };
};

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const NotFoundPage = compose(connect(mapStateToProps))(EnhancedNotFoundPage);

export default NotFoundPage;
