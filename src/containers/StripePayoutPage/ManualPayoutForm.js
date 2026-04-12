import React, { useState } from 'react';

const BANKS = [
  { code: 'KCB', label: 'KCB Bank' },
  { code: 'EQBANK', label: 'Equity Bank' },
  { code: 'COOP', label: 'Co-operative Bank' },
  { code: 'NCBA', label: 'NCBA Bank' },
  { code: 'ABSA', label: 'Absa Bank Kenya' },
  { code: 'STANCHART', label: 'Standard Chartered Bank' },
  { code: 'STANBIC', label: 'Stanbic Bank' },
  { code: 'DTBK', label: 'Diamond Trust Bank (DTB)' },
  { code: 'IMB', label: 'I&M Bank' },
  { code: 'FAMILY', label: 'Family Bank' },
  { code: 'PRIME', label: 'Prime Bank' },
  { code: 'NIC', label: 'NIC Bank' },
  { code: 'HFC', label: 'HFC Bank' },
  { code: 'GULF', label: 'Gulf African Bank' },
  { code: 'FIRST_COMMUNITY', label: 'First Community Bank' },
  { code: 'SIDIAN', label: 'Sidian Bank' },
  { code: 'GUARDIAN', label: 'Guardian Bank' },
  { code: 'VICTORIA', label: 'Victoria Commercial Bank' },
  { code: 'CONSOLIDATED', label: 'Consolidated Bank' },
  { code: 'CREDIT', label: 'Credit Bank' },
  { code: 'TRANS_NATIONAL', label: 'Trans National Bank' },
  { code: 'ABC', label: 'African Banking Corporation (ABC)' },
  { code: 'PARAMOUNT', label: 'Paramount Bank' },
  { code: 'HABIB', label: 'Habib Bank AG Zurich' },
  { code: 'BANK_OF_INDIA', label: 'Bank of India' },
  { code: 'BANK_OF_BARODA', label: 'Bank of Baroda' },
  { code: 'CITIBANK', label: 'Citibank' },
];

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #e0e0e0',
  borderRadius: 4,
  fontSize: 16,
  boxSizing: 'border-box',
  backgroundColor: '#fff',
  color: '#333',
  fontFamily: 'inherit',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#666',
  marginBottom: 6,
};

const fieldStyle = {
  marginBottom: 20,
};

const ManualPayoutForm = ({ onSubmit, onDelete, inProgress, saved, existingDetails }) => {
  const [payoutType, setPayoutType] = useState(existingDetails?.payoutType || 'mpesa');
  const [phone, setPhone] = useState(existingDetails?.phone || '');
  const [bank, setBank] = useState(existingDetails?.bank || '');
  const [accountNumber, setAccountNumber] = useState(existingDetails?.accountNumber || '');
  const [accountName, setAccountName] = useState(existingDetails?.accountName || '');
  const [branch, setBranch] = useState(existingDetails?.branch || '');
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (!existingDetails) {
      setPhone('');
      setBank('');
      setAccountNumber('');
      setAccountName('');
      setBranch('');
    }
  }, [existingDetails]);

  const [confirmDelete, setConfirmDelete] = useState(false);

  const isComplete =
    payoutType === 'mpesa'
      ? !!phone && !!accountName
      : !!bank && !!branch && !!accountNumber && !!accountName;

  const handleSubmit = e => {
    e.preventDefault();
    setError(null);
    if (payoutType === 'mpesa' && (!phone || !accountName)) {
      return setError('Please enter your M-Pesa number and full name.');
    }
    if (payoutType === 'bank' && (!bank || !accountNumber || !accountName || !branch)) {
      return setError('Please fill in all bank details.');
    }
    onSubmit({ payoutType, phone, bank, accountNumber, accountName, branch });
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 28, lineHeight: 1.6 }}>
        We'll use these details to send your rental earnings after each completed booking.
      </p>

      {/* Payout method */}
      <div style={fieldStyle}>
        <span style={labelStyle}>Payout method</span>
        <div style={{ display: 'flex', gap: 12 }}>
          {['mpesa', 'bank'].map(type => (
            <div
              key={type}
              onClick={() => setPayoutType(type)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                border: `1px solid ${payoutType === type ? '#aaa' : '#e0e0e0'}`,
                borderRadius: 4,
                cursor: 'pointer',
                backgroundColor: payoutType === type ? '#f5f5f5' : '#fff',
                fontSize: 15,
                color: '#333',
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: `2px solid ${payoutType === type ? '#333' : '#aaa'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {payoutType === type && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#333',
                    }}
                  />
                )}
              </div>
              {type === 'mpesa' ? 'M-Pesa' : 'Bank transfer'}
            </div>
          ))}
        </div>
      </div>

      {/* M-Pesa fields */}
      {payoutType === 'mpesa' && (
        <>
          <div style={fieldStyle}>
            <label style={labelStyle}>Full name (as registered on M-Pesa)</label>
            <input
              type="text"
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              placeholder="e.g. John Kamau"
              style={inputStyle}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>M-Pesa phone number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 0712 345 678"
              style={inputStyle}
            />
          </div>
        </>
      )}

      {/* Bank fields */}
      {payoutType === 'bank' && (
        <>
          <div style={fieldStyle}>
            <label style={labelStyle}>Bank</label>
            <select
              value={bank}
              onChange={e => setBank(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select your bank…</option>
              {BANKS.map(b => (
                <option key={b.code} value={b.code}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Branch name</label>
            <input
              type="text"
              value={branch}
              onChange={e => setBranch(e.target.value)}
              placeholder="e.g. Westlands, Nairobi CBD"
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Account number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              placeholder="Enter account number"
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Account name</label>
            <input
              type="text"
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              placeholder="Name on the account"
              style={inputStyle}
            />
          </div>
        </>
      )}

      {error && (
        <p style={{ fontSize: 13, color: '#d32f2f', marginBottom: 16 }}>{error}</p>
      )}

      {saved && !inProgress && (
        <p style={{ fontSize: 13, color: existingDetails ? '#2e7d32' : '#d32f2f', marginBottom: 16 }}>
          {existingDetails ? '✓ Payout details saved successfully.' : '✓ Payout details removed.'}
        </p>
      )}

      <button
        type="submit"
        disabled={!isComplete || inProgress}
        style={{
          display: 'block',
          width: '100%',
          padding: '14px 28px',
          fontWeight: 500,
          fontSize: 16,
          cursor: isComplete && !inProgress ? 'pointer' : 'default',
          backgroundColor: isComplete ? '#6e42e5' : '#f5f5f5',
          color: isComplete ? '#fff' : '#aaa',
          border: `1px solid ${isComplete ? '#6e42e5' : '#e0e0e0'}`,
          borderRadius: 4,
          marginTop: 8,
          fontFamily: 'inherit',
          transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
        }}
      >
        {inProgress ? 'Saving…' : 'Save payout details'}
      </button>
      {existingDetails && (
        <div style={{ marginTop: 16 }}>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px 28px',
                fontWeight: 500,
                fontSize: 16,
                cursor: 'pointer',
                backgroundColor: '#fff',
                color: '#d32f2f',
                border: '1px solid #d32f2f',
                borderRadius: 4,
                fontFamily: 'inherit',
              }}
            >
              Remove payout details
            </button>
          ) : (
            <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: 4 }}>
              <p style={{ fontSize: 14, color: '#333', marginBottom: 16 }}>
                Are you sure you want to remove your payout details? Your listings will become unbookable until you add new details.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontWeight: 500,
                    fontSize: 15,
                    cursor: 'pointer',
                    backgroundColor: '#f5f5f5',
                    color: '#333',
                    border: '1px solid #e0e0e0',
                    borderRadius: 4,
                    fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { setConfirmDelete(false); onDelete(); }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontWeight: 500,
                    fontSize: 15,
                    cursor: 'pointer',
                    backgroundColor: '#d32f2f',
                    color: '#fff',
                    border: '1px solid #d32f2f',
                    borderRadius: 4,
                    fontFamily: 'inherit',
                  }}
                >
                  Yes, remove
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
};

export default ManualPayoutForm;