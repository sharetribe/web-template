import { fakeIntl } from '../../../../../util/testData';
import EditListingAvailabilityExceptionForm from './EditListingAvailabilityExceptionForm';

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const Example = {
  component: EditListingAvailabilityExceptionForm,
  props: {
    formId: 'EditListingAvailabilityExceptionFormExample',
    //form: { initialize: value => console.log('initialize called with', value )},
    monthlyExceptionQueries: { ['2023-01']: {}, ['2023-02']: {} },
    allExceptions: [],
    listingTitle: 'Yoga guru',
    weekdays: WEEKDAYS,
    onSubmit(values) {
      console.log('submit with values:', values);
      return Promise.resolve();
    },
    onFetchExceptions: values => console.log('onFetchExceptions', values),
    onMonthChanged: values => console.log('onMonthChanged', values),
    fetchErrors: {},
    listingTypeConfig: { availabilityType: 'oneSeat' },
    unitType: 'hour',
    useFullDays: false,
    intl: fakeIntl,
    timeZone: 'Etc/UTC',
    updated: false,
    updateInProgress: false,
  },
  group: 'forms',
};
