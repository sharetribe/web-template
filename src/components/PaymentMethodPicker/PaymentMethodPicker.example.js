import { fakeIntl } from '../../util/testData';
import PaymentMethodPicker from './PaymentMethodPicker';

const noop = () => null;
const defaultProps = {
  intl: fakeIntl,
  onDeleteCard: noop,
  onChange: noop,
  onManageDisableScrolling: noop,
};

export const PaymentMethodPickerExample = {
  component: PaymentMethodPicker,
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

export const PaymentMethodPickerNoDelete = {
  component: PaymentMethodPicker,
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

export const PaymentMethodPickerExpired = {
  component: PaymentMethodPicker,
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
