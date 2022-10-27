import React from 'react';
import { renderDeep } from '../../../../util/test-helpers';
import { fakeIntl } from '../../../../util/test-data';
import EditListingPricingForm from './EditListingPricingForm';

const noop = () => null;

describe('EditListingPricingForm', () => {
  it('matches snapshot', () => {
    const tree = renderDeep(
      <EditListingPricingForm
        intl={fakeIntl}
        dispatch={noop}
        onSubmit={v => v}
        marketplaceCurrency="USD"
        unitType="day"
        listingMinimumPriceSubUnits={0}
        saveActionMsg="Save price"
        updated={false}
        updateInProgress={false}
        disabled={false}
        ready={false}
      />
    );
    expect(tree).toMatchSnapshot();
  });
});
