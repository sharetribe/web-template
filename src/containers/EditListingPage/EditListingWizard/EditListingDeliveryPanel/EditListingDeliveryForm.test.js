// NOTE: renderdeep doesn't work due to map integration
import React from 'react';
import { renderShallow } from '../../../../util/test-helpers';
import { fakeIntl } from '../../../../util/test-data';
import { EditListingDeliveryFormComponent } from './EditListingDeliveryForm';

const noop = () => null;

describe('EditListingDeliveryForm', () => {
  it('matches snapshot', () => {
    const tree = renderShallow(
      <EditListingDeliveryFormComponent
        intl={fakeIntl}
        dispatch={noop}
        onSubmit={noop}
        saveActionMsg="Save location"
        updated={false}
        updateInProgress={false}
        disabled={false}
        ready={false}
      />
    );
    expect(tree).toMatchSnapshot();
  });
});
