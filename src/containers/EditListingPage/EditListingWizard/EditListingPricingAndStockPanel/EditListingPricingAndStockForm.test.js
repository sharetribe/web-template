import React from 'react';
import { renderDeep } from '../../../../util/test-helpers';
import { fakeIntl } from '../../../../util/test-data';
import EditListingPricingAndStockForm from './EditListingPricingAndStockForm';

const noop = () => null;

describe('EditListingPricingAndStockForm', () => {
  it('matches snapshot', () => {
    const tree = renderDeep(
      <EditListingPricingAndStockForm
        intl={fakeIntl}
        dispatch={noop}
        onSubmit={v => v}
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
