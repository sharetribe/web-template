import { fakeIntl } from '../../util/testData';
import SavedCardDetails from './SavedCardDetails';

const noop = () => null;
const defaultProps = {
  intl: fakeIntl,
  onDeleteCard: noop,
  onChange: noop,
  onManageDisableScrolling: noop,
};

export const SavedCardDetailsExample = {
  component: SavedCardDetails,
  props: {
    ...defaultProps,
    card: {
      brand: 'visa',
      expirationMonth: 10,
      expirationYear: 2050,
      last4Digits: '3220',
    },
  },
  group: 'payment',
};

export const SavedCardDetailsNoDelete = {
  component: SavedCardDetails,
  props: {
    ...defaultProps,
    card: {
      brand: 'mastercard',
      expirationMonth: 10,
      expirationYear: 2050,
      last4Digits: '3220',
    },
    onDeleteCard: null,
  },
  group: 'payment',
};

export const SavedCardDetailsExpired = {
  component: SavedCardDetails,
  props: {
    ...defaultProps,
    card: {
      brand: 'amex',
      expirationMonth: 7,
      expirationYear: 2019,
      last4Digits: '3220',
    },
  },
  group: 'payment',
};
