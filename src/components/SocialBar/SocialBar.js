import React from 'react';
import TikTok from '../Icons/tikitok';
import Instagram from '../Icons/instagram';
import css from './SocialBar.module.css';
import WhatsappIcon from '../Icons/whatsapp';

export default function SocialBar() {
  return (
    <>
      <a
        href="https://www.instagram.com/clubjoy.it/"
        target="_blank"
        rel="noopener noreferrer"
        className={css.customClass}
      >
        <Instagram className={css.customClass} />
      </a>
      <a
        href="https://www.tiktok.com/@clubjoy.it"
        target="_blank"
        rel="noopener noreferrer"
        className={css.customClass}
      >
        <TikTok className={css.customClass} />
      </a>
    </>
  );
}
