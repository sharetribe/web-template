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
import { isScrollingDisabled } from '../../ducks/ui.duck';
import Image404 from '../../assets/images/404.png';

import { Heading, Page, LayoutSingleColumn, Button, NamedLink } from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

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
    const { history, routeConfiguration, marketplaceName, intl, scrollingDisabled } = this.props;

    const title = intl.formatMessage({
      id: 'NotFoundPage.title',
    });

    const handleSearchSubmit = values => {
      const { origin, bounds } = selectedPlace || {};
      const searchParams = keywords ? { keywords } : { address: search, origin, bounds };
      history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, searchParams));
    };

    return (
      <Page title={title} scrollingDisabled={scrollingDisabled} className={css.page}>
        <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
          <div className={css.root}>
            <div className={css.content}>
              <div className={css.image}>
                <img src={Image404} />
              </div>
              <div className={css.description}>
                <p>Sorry! This page doesn't seem to be there.</p>
                <NamedLink className={css.button} name="ExperiencesPage">
                  Explore Experiences
                </NamedLink>
              </div>
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
