import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';

import {
  IconArrowHead,
  IconSpinner,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
} from '../../../../components';
import { setUiCurrency } from '../../../../ducks/ui.duck';
import { updateUserCurrency } from '../../../../ducks/user.duck';
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
  const [isOpen, setIsOpen] = useState(false);
  const { uiCurrency } = useSelector(state => state.ui);
  const { updateProfileInProgress, currentUser } = useSelector(state => state.user);

  const toggleOpen = enforceOpen => {
    setIsOpen(enforceOpen);
  };

  const handleChangeCurrency = currency => event => {
    if (currency === uiCurrency) return;

    dispatch(setUiCurrency(currency));
    setIsOpen(false);
    if (!currentUser) {
      return;
    }
    dispatch(updateUserCurrency(currency));
  };

  const isDisabled = updateProfileInProgress;
  const classes = classNames({ [css.disabledDropdown]: isDisabled });

  return (
    <Menu
      onToggleActive={toggleOpen}
      isOpen={isOpen}
      className={classes}
      contentPosition="right"
    >
      <MenuLabel className={css.profileMenuLabel} isOpenClassName={css.profileMenuIsOpen}>
        <div className={css.currencyIcon}>
          {isDisabled ? (
            <IconSpinner className={css.icon} />
          ) : (
            currencyIcons[uiCurrency]({ className: css.icon })
          )}
          <IconArrowHead
            direction="down"
            rootClassName={classNames(css.arrowIcon, { [css.isOpenIcon]: isOpen })}
          />
        </div>
      </MenuLabel>
      <MenuContent className={classNames(css.profileMenuContent, classes)}>
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
