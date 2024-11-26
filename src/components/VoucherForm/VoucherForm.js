import React, { Component } from 'react';
import { func, number, object, string } from 'prop-types';
import classNames from 'classnames';
import { checkCoupon } from '../../util/api';
import { FieldTextInput, SecondaryButton } from '..';
import css from './VoucherForm.module.css';

class VoucherForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      voucherCode: '',
      errorMessage: '',
    };
  }

  handleVoucherChange = (event) => {
    this.setState({ voucherCode: event.target.value, errorMessage: '' });
  };

  handleVoucherSubmit = () => {
    const { voucherCode } = this.state;
    if (!voucherCode) {
      this.setState({
        errorMessage: (
          <p>{this.props.intl.formatMessage({ id: 'BookingTimeForm.coupon.empty' })}</p>
        ),
      });
      return;
    }

    const requestBody = {
      code: voucherCode,
      listingId: this.props.listingId.uuid,
    };

    checkCoupon(requestBody)
      .then((response) => {
        if (!response.valid) {
          const { codeType } = response;
          let errorMessage;

          if (codeType === 'giftCard') {
            errorMessage = (
              <p className={css.voucherTitleBox}>
                {this.props.intl.formatMessage({ id: 'BookingTimeForm.coupon.notValidGiftCard' })}
              </p>
            );
          } else if (codeType === 'welfareCard') {
            errorMessage = (
              <p className={css.voucherTitleBox}>
                {this.props.intl.formatMessage({
                  id: 'BookingTimeForm.coupon.notValidWelfareCard',
                })}
              </p>
            );
          } else {
            errorMessage = (
              <p className={css.voucherTitleBox}>
                {this.props.intl.formatMessage({ id: 'BookingTimeForm.coupon.notValid' })}
              </p>
            );
          }

          this.setState({ errorMessage });
          return;
        }

        this.props.form.batch(() => {
          this.props.form.change('voucherFee', response);
          this.props.form.change('lineItems', this.props.lineItems);
        });
        this.setState({ errorMessage: '' });
      })
      .catch((error) => {
        console.error('Error checking voucher:', error);
        const errorMessage = (
          <p className={css.voucherTitleBox}>
            {this.props.intl.formatMessage({ id: 'BookingTimeForm.coupon.notValid' })}
          </p>
        );

        this.setState({
          errorMessage,
        });
      })
      .finally(() => {
        this.setState({ voucherCode: '' });
      });
  };

  render() {
    const { rootClassName, className, formId, form, values, intl } = this.props;
    const { errorMessage, voucherCode } = this.state;

    return (
      <div className={classNames(rootClassName || css.root, className)}>
        <div className={css.fieldDateInput}>
          <p className={css.voucherTitleBox}>
            {intl.formatMessage({ id: 'BookingTimeForm.coupon.title' })}
          </p>
          <input
            type="text"
            placeholder={intl.formatMessage({ id: 'BookingTimeForm.coupon.placeholder' })}
            value={voucherCode}
            onChange={this.handleVoucherChange}
          />
          <SecondaryButton
            type="button"
            onClick={this.handleVoucherSubmit}
            style={{ width: '100%' }}
          >
            {intl.formatMessage({ id: 'BookingTimeForm.coupon.button' })}
          </SecondaryButton>
          {errorMessage && <p className={css.errorMessage}>{errorMessage}</p>}
        </div>
      </div>
    );
  }
}

export default VoucherForm;