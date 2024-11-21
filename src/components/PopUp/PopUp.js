import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import css from './PopUp.module.css';
import { PrimaryButton, SecondaryButton } from '../Button/Button';

function PopUp({ message, onConfirm, onCancel, showForm }) {
  const intl = useIntl();
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedOptionText, setSelectedOptionText] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [vat, setVat] = useState('');
  const [receiver, setReceiver] = useState('');
  const [fiscalCode, setFiscalCode] = useState('');

  const handleOptionChange = (event) => {
    const selectedOption = event.target.value;
    const selectedOptionText = event.target.options[event.target.selectedIndex].text;
    setSelectedOption(selectedOption);
    setSelectedOptionText(selectedOptionText);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setConfirmed(true);
    const flow = showForm ? 1 : 2;
    onConfirm({ selectedOptionText, receiver, email, address, code, vat, fiscalCode, flow });
  };

  const handleReturnClick = () => {
    window.location.reload();
  };

  return (
    <div className={css.popUpOverlay}>
      <div className={css.popUpContent}>
        {confirmed ? (
          <div>
            <p>{intl.formatMessage({ id: 'Event.PopUp.cancel.confirmation' })}</p>
            <PrimaryButton onClick={handleReturnClick} className={css.closeButton}>
              {intl.formatMessage({ id: 'Event.PopUp.cancel.return' })}
            </PrimaryButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={css.popUpForm}>
            <p>{message}</p>
            {showForm ? (
              <>
                <div>
                  <label>
                    {intl.formatMessage({ id: 'Event.PopUp.form.receiver' })}
                    <input
                      type="text"
                      value={receiver}
                      onChange={(e) => setReceiver(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>
                    {intl.formatMessage({ id: 'Event.PopUp.form.address' })}
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>
                    {intl.formatMessage({ id: 'Event.PopUp.form.fiscalCode' })}
                    <input
                      type="text"
                      value={fiscalCode}
                      onChange={(e) => setFiscalCode(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>
                    {intl.formatMessage({ id: 'Event.PopUp.form.vat' })}
                    <input
                      type="text"
                      value={vat}
                      onChange={(e) => setVat(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>
                    {intl.formatMessage({ id: 'Event.PopUp.form.code' })}
                    <input type="text" value={code} onChange={(e) => setCode(e.target.value)} />
                  </label>
                </div>
                <div>
                  <label>
                    {intl.formatMessage({ id: 'Event.PopUp.form.email' })}
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </label>
                </div>
              </>
            ) : (
              <div>
                <label>
                  {intl.formatMessage({ id: 'Event.PopUp.selectOption' })}
                  <select value={selectedOption} onChange={handleOptionChange}>
                    <option value="" disabled>
                      {intl.formatMessage({ id: 'Event.PopUp.selectPlaceholder' })}
                    </option>
                    <option value="option1">
                      {intl.formatMessage({ id: 'Event.PopUp.option1' })}
                    </option>
                    <option value="option2">
                      {intl.formatMessage({ id: 'Event.PopUp.option2' })}
                    </option>
                    <option value="option3">
                      {intl.formatMessage({ id: 'Event.PopUp.option3' })}
                    </option>
                    <option value="option4">
                      {intl.formatMessage({ id: 'Event.PopUp.option4' })}
                    </option>
                    <option value="option5">
                      {intl.formatMessage({ id: 'Event.PopUp.option5' })}
                    </option>
                  </select>
                </label>
              </div>
            )}
            <div className={css.popUpActions}>
              <PrimaryButton type="submit">
                {intl.formatMessage({ id: 'Event.PopUp.confirm' })}
              </PrimaryButton>
              <SecondaryButton type="button" onClick={onCancel}>
                {intl.formatMessage({ id: 'Event.PopUp.cancel' })}
              </SecondaryButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

PopUp.propTypes = {
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  showForm: PropTypes.bool.isRequired,
};

export default PopUp;
