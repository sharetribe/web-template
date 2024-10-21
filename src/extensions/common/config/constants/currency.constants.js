export const DEFAULT_CURRENCY = 'USD';

export const SUPPORT_CURRENCIES = process.env.REACT_APP_CURRENCIES_SUPPORT
  ? process.env.REACT_APP_CURRENCIES_SUPPORT.split(',')
  : ['USD', 'CAD'];
