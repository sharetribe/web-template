import React, { useState, useRef } from 'react';
import classNames from 'classnames';
import { createRefund, notifyInvoice } from '../../../util/api';
import { PrimaryButton, SecondaryButton } from '../../../components';
import css from './TransactionPanel.module.css';
import { useIntl } from 'react-intl';
import { createClient } from '@supabase/supabase-js';
import PopUpMessage from '../../../components/PopUpMessage/PopUpMessage';
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ProviderButtonsMaybe = (props) => {
  const intl = useIntl();
  const { className, rootClassName, customerObj, transactionId, start } = props;

  const [showPopUp, setShowPopUp] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const timeDiff = startDate - currentDate;
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

  const isWithinFiveDays = Math.abs(daysDiff) <= 5;
  const isAfterOrOnStartDate = currentDate >= startDate;

  const handlePrimaryButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleClosePopUp = () => {
    setShowPopUp(false);
    notifyInvoice({ customerObj });
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      setLoading(true);
      const newFileName = `${props.customerObj.bookingid}`;

      const { error: deleteError } = await supabase.storage
        .from('invoices')
        .remove([`public/${newFileName}`]);

      if (deleteError && deleteError.statusCode !== '404') {
        setErrorMessage('Error deleting existing file.');
        setSuccessMessage('');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.storage
        .from('invoices')
        .upload(`public/${newFileName}`, selectedFile, {
          upsert: true,
        });

      if (error) {
        setErrorMessage('Error uploading file.');
        setSuccessMessage('');
      } else {
        setSuccessMessage(''); //File uploaded successfully
        setErrorMessage('');
        setShowPopUp(true);
      }

      setLoading(false);
      setFile(null);
      fileInputRef.current.value = null;
    }
  };

  const handleSecondaryButtonClick = () => {
    setShowPopUp(true);
  };

  const handleConfirmRefund = (selectedOption) => {
    createRefund({ customerObj, transactionId, selectedOption });
  };

  const classes = classNames(rootClassName || css.actionButtons, className);

  return (
    <div className={css.actionButtonWrapper}>
      <div className={classes}>
        <input
          type="file"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <PrimaryButton onClick={handlePrimaryButtonClick} disabled={!isAfterOrOnStartDate}>
          {loading ? (
            <div className={css.loader}>Caricamento...</div>
          ) : (
            intl.formatMessage({ id: 'ProviderButtons.button.upload.receipt' })
          )}
        </PrimaryButton>

        {successMessage && <div className={css.successMessage}>{successMessage}</div>}

        {errorMessage && <div className={css.errorMessage}>{errorMessage}</div>}
      </div>
      {showPopUp && (
        <PopUpMessage
          message={intl.formatMessage({ id: 'ProviderButtons.button.upload.success' })}
          onCancel={handleClosePopUp}
        />
      )}
    </div>
  );
};

export default ProviderButtonsMaybe;
