import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { SUPPORT_CURRENCIES } from '../../../common/config/constants/currency.constants';
import { setUiCurrency } from '../../../../ducks/ui.duck';
import CanadaIcon from '../CanadaIcon/CanadaIcon';
import USAIcon from '../USAIcon/USAIcon';
import { Menu, MenuContent, MenuItem, MenuLabel } from '../../../../components';

import css from './CurrencyDropdown.module.css';

const currencyIcons = {
  USD: USAIcon,
  CAD: CanadaIcon,
};

const CurrencyDropdown = props => {
  const {} = props;
  const dispatch = useDispatch();
  const { uiCurrency } = useSelector(state => state.ui);

  const handleChangeCurrency = e => {
    const currency = e.target.value;
    dispatch(setUiCurrency(currency));
  };
  return (
    <Menu>
      <MenuLabel className={css.profileMenuLabel} isOpenClassName={css.profileMenuIsOpen}>
        {currencyIcons[uiCurrency]({ className: css.icon })}
      </MenuLabel>
      <MenuContent className={css.profileMenuContent}>
        {SUPPORT_CURRENCIES.map(currency => (
          <MenuItem key={currency}>
            <span className={css.menuItemBorder} />
            {currencyIcons[currency]({ className: css.icon })}
            <span>{currency}</span>
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
};

export default CurrencyDropdown;
