import React, { Component } from 'react';
import { arrayOf, number, string } from 'prop-types';

import { Link } from 'react-router-dom';

import { injectIntl, intlShape } from '../../util/reactIntl';
import { parse } from '../../util/urlHelpers';

import omit from 'lodash/omit';
import { createResourceLocatorString } from '../../util/routes';



/**
 * Helper to pick only valid values of search params from URL (location)
 * Note: location.search might look like: '?pub_category=men&pub_amenities=towels,bathroom'
 *
 * @param {Object} props object containing: location, listingFieldsConfig, defaultFiltersConfig
 * @returns picked search params against extended data config and default filter config
 */
export const validUrlQueryParamsFromProps = props => {
  const {history } = props;

  const { ...searchInURL } = parse(history.location.search, {
    latlng: ['origin'],
    latlngBounds: ['bounds'],
  });

  return { ...searchInURL };
};

class SortComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentQueryParams: validUrlQueryParamsFromProps(this.props),
    };
    this.history = this.props.history;
    this.title = this.props.title;
    this.routeConfiguration = props.routeConfiguration;
    this.getHandleChangedSort = this.getHandleChangedSort.bind(this);
  }

  getHandleChangedSort(useHistoryPush) {
    useHistoryPush.preventDefault();
    const urlQueryParams = validUrlQueryParamsFromProps(this.props);
    const {sort} = this.props;

    console.log('getHandleChangedSort');
    console.log(urlQueryParams);
    console.log(this.props);

    if(urlQueryParams.sort === sort ){
      urlQueryParams.sort = '-'+sort;
    }else{
      urlQueryParams.sort = sort;
    }
    

    const searchParams = omit(urlQueryParams, 'orderOpen');

    console.log('searchParams');
    console.log(searchParams);

    console.log('createResourceLocatorString(searchParams)');
    // console.log(createResourceLocatorString('Commission',searchParams));
    this.history.push(createResourceLocatorString('Commission', this.routeConfiguration, {}, searchParams));


    // this.history.push('/Commission');
  }
 
  render() {
    const {
      className,
      // id,
      // name,
      initialValues,
      contentPlacementOffset,
      queryParamName,
      intl,
      ...rest
    } = this.props;

    return <Link to={'Commission'} /*className={css.editLink}*/ onClick={this.getHandleChangedSort}>{this.title}</Link>;
  }
}

SortComponent.defaultProps = {
  rootClassName: null,
  className: null,
  initialValues: null,
  contentPlacementOffset: 0,
};

SortComponent.propTypes = {
  contentPlacementOffset: number,

  // form injectIntl
  intl: intlShape.isRequired,
};

export default injectIntl(SortComponent);
