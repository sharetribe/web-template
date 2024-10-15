import React from 'react';
import classNames from 'classnames';

import css from './CustomKeys.module.css';
import buttonCss from '../Button/Button.module.css';

function generateDynamicLink(detail) {
    const baseUrl = "https://justconstruct-leads.vercel.app/";
    const ownerPhone = detail.value; // Assuming detail.value contains the phone number
    const dynamicLink = `${baseUrl}EnquiryForm?OwnerPhone=${encodeURIComponent(ownerPhone)}`;
    return dynamicLink;
}

const CustomLink = ({ detail, publicData }) => {
  const dynamicLink = generateDynamicLink(detail);

  return (
    <div className={css.detailValue}>
      <span className={css.detailLabel}>{detail.label}</span>
      {detail.key === 'phone' ? (
        <button 
          onClick={() => window.location.href = dynamicLink} 
          className={classNames(css.gotoLinkButton, buttonCss.primaryButtonRoot)}
        >
          Enquire Now
        </button>
      ) : (
        <>
          <span className={css.colon}>:</span>
          <span>{detail.value}</span>
        </>
      )}
    </div>
  );
};

export default CustomLink;
