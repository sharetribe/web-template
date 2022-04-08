import { fakeIntl } from '../../../../../util/test-data';
import EditListingAvailabilityExceptionForm from './EditListingAvailabilityExceptionForm';

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const Example = {
  component: EditListingAvailabilityExceptionForm,
  props: {
    formId: 'EditListingAvailabilityExceptionFormExample',
    availabilityExceptions: [],
    listingTitle: 'Yoga guru',
    weekdays: WEEKDAYS,
    onSubmit(values) {
      console.log('submit with values:', values);
    },
    fetchErrors: {},
    intl: fakeIntl,
    timeZone: 'Etc/UTC',
    updated: false,
    updateInProgress: false,
  },
  group: 'forms',
};
