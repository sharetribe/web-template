import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IconArrowHead, Menu, MenuContent, MenuItem, MenuLabel } from '../../../../components';
import { setUiCurrency } from '../../../../ducks/ui.duck';
import { SUPPORT_CURRENCIES } from '../../../common/config/constants/currency.constants';
import CanadaIcon from '../CanadaIcon/CanadaIcon';
import USAIcon from '../USAIcon/USAIcon';

import css from './CurrencyDropdown.module.css';

const currencyIcons = {
  USD: USAIcon,
  CAD: CanadaIcon,
};

const CurrencyDropdown = props => {
  const dispatch = useDispatch();
  const { uiCurrency } = useSelector(state => state.ui);

  const handleChangeCurrency = currency => () => {
    dispatch(setUiCurrency(currency));
  };

  return (
    <Menu contentPosition="right" isFullWidthMobile={false}>
      <MenuLabel className={css.profileMenuLabel} isOpenClassName={css.profileMenuIsOpen}>
        {currencyIcons[uiCurrency]({ className: css.icon })}
        <IconArrowHead direction="down" rootClassName={css.arrowIcon} />
      </MenuLabel>
      <MenuContent className={css.profileMenuContent}>
        {SUPPORT_CURRENCIES.map(currency => (
          <MenuItem className={css.currencyOptionWrapper} key={currency}>
            <button
              type="button"
              className={css.currencyOption}
              onClick={handleChangeCurrency(currency)}
            >
              <span className={css.menuItemBorder} />
              {currencyIcons[currency]({ className: css.icon })}
              <span className={css.currencyLabel}>{currency}</span>
            </button>
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
};

export default CurrencyDropdown;
