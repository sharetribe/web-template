import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExchangeRate } from '../ExchangeRate/ExchangeRate.duck';
import { DEFAULT_CURRENCY } from '../common/config/constants/currency.constants';

export const GetStoredExchangeRate = () => {
  const dispatch = useDispatch();
  const { exchangeRate } = useSelector(state => state.ExchangeRate);
  const { uiCurrency } = useSelector(state => state.ui);

  useEffect(() => {
    if (uiCurrency !== DEFAULT_CURRENCY && exchangeRate === null) {
      dispatch(fetchExchangeRate(uiCurrency));
    }
  }, [dispatch, exchangeRate, uiCurrency]);

  return null;
};
