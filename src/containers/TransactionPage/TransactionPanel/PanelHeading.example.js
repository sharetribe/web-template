import React, { useState } from 'react';

import { getProcess } from '../../../transactions/transaction';

import PanelHeading from './PanelHeading';

const PROCESS_NAME = 'default-purchase';

const ProcessHeadings = () => {
  const states = getProcess(PROCESS_NAME).states;
  const processStates = Object.values(states);
  const [formData, setFormData] = useState({
    state: processStates[0],
    transactionRole: 'customer',
    listingDeleted: false,
    isCustomerBanned: false,
  });
  const handleChange = e => {
    const name = e.target.name;
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    console.log('handleChange:', name, value);
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const checkboxStyles = { display: 'inline', width: 'auto', marginLeft: 10 };
  return (
    <div>
      <form>
        <p>state: </p>
        <select name="state" value={formData.state} onChange={handleChange}>
          {processStates.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <p>User role:</p>
        <select name="transactionRole" value={formData.transactionRole} onChange={handleChange}>
          <option value="customer">customer</option>
          <option value="provider">provider</option>
        </select>
        <p>
          Listing deleted?
          <input
            type="checkbox"
            name="listingDeleted"
            value={formData.listingDeleted}
            onChange={handleChange}
            style={checkboxStyles}
          />
        </p>
        <p>
          Customer banned?
          <input
            type="checkbox"
            name="isCustomerBanned"
            value={formData.isCustomerBanned}
            onChange={handleChange}
            style={checkboxStyles}
          />
        </p>
      </form>

      <PanelHeading
        processName={PROCESS_NAME}
        processState={formData.state}
        isPendingPayment={states.PENDING_PAYMENT === formData.state}
        transactionRole={formData.transactionRole}
        customerName="Cecilia"
        listingId="listing-id"
        listingTitle="My fancy listing"
        listingDeleted={formData.listingDeleted}
        isCustomerBanned={formData.isCustomerBanned}
      />
    </div>
  );
};

export const ProductProcessHeadings = {
  component: ProcessHeadings,
  props: {},
  group: 'page:TransactionPage',
};
