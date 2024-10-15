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

  if (detail.key === 'phone') {
    return (
      <div className={css.detailValue}>
        <button 
          onClick={() => window.location.href = dynamicLink} 
          className={classNames(css.gotoLinkButton, buttonCss.primaryButtonRoot)}
        >
          Enquire Now
        </button>
      </div>
    );
  }

  return null;
};

export default CustomLink;
