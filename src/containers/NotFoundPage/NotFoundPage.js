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
import { isMainSearchTypeKeywords } from '../../util/search';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { Heading, Page, LayoutSingleColumn } from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import SearchForm from './SearchForm/SearchForm';

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
    const {
      history,
      routeConfiguration,
      marketplaceName,
      isKeywordSearch,
      intl,
      scrollingDisabled,
    } = this.props;

    const title = intl.formatMessage({
      id: 'NotFoundPage.title',
    });

    const handleSearchSubmit = values => {
      const { keywords, location } = values;
      const { search, selectedPlace } = location || {};
      const { origin, bounds } = selectedPlace || {};
      const searchParams = keywords ? { keywords } : { address: search, origin, bounds };
      history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, searchParams));
    };

    return (
      <Page title={title} scrollingDisabled={scrollingDisabled}>
        <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
          <div className={css.root}>
            <div className={css.content}>
              <div className={css.number}>404</div>
              <Heading as="h1" rootClassName={css.heading}>
                <FormattedMessage id="NotFoundPage.heading" />
              </Heading>
              <p className={css.description}>
                <FormattedMessage id="NotFoundPage.description" values={{ marketplaceName }} />
              </p>
              <SearchForm
                className={css.searchForm}
                isKeywordSearch={isKeywordSearch}
                onSubmit={handleSearchSubmit}
              />
            </div>
          </div>
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
  marketplaceName: string.isRequired,
  isKeywordSearch: bool.isRequired,

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
      marketplaceName={config.marketplaceName}
      isKeywordSearch={isMainSearchTypeKeywords(config)}
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
