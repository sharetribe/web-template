import React, { Component } from 'react';
import { func, number, object, string } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import { getStartOf } from '../../util/dates';
import { checkCoupon } from '../../util/api';
import { FieldTextInput, SecondaryButton } from '../../components';
import css from './VoucherForm.module.css';

class VoucherForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentMonth: getStartOf(new Date(), 'month', props.timeZone),
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
    };

    checkCoupon(requestBody)
      .then((response) => {
        if (!response.valid) {
          this.setState({
            errorMessage: (
              <p className={css.voucherTitleBox}>
                {this.props.intl.formatMessage({ id: 'BookingTimeForm.coupon.notValid' })}
              </p>
            ),
          });
          return;
        }
        this.props.form.batch(() => {
          this.props.form.change('voucherFee', response);
        });
        this.setState({ errorMessage: '' });
      })
      .catch((error) => {
        console.error('Error checking voucher:', error);
        let errorMessage = (
          <p className={css.voucherTitleBox}>
            {this.props.intl.formatMessage({ id: 'BookingTimeForm.coupon.notValid' })}
          </p>
        );
        if (error && error.response && error.response.status === 400) {
          errorMessage = (
            <p>{this.props.intl.formatMessage({ id: 'BookingTimeForm.coupon.serverError' })}</p>
          );
        }

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

    const voucherInsertion = (
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
        <SecondaryButton type="button" onClick={this.handleVoucherSubmit} style={{ width: '100%' }}>
          {intl.formatMessage({ id: 'BookingTimeForm.coupon.button' })}
        </SecondaryButton>
        {errorMessage && <p className={css.errorMessage}>{errorMessage}</p>}
      </div>
    );

    return (
      <div className={classNames(rootClassName || css.root, className)}>{voucherInsertion}</div>
    );
  }
}

export default VoucherForm;
