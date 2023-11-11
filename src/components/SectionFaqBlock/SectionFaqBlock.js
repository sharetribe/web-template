import React, { useState } from 'react';
import { string } from 'prop-types';
import css from './SectionFaqBlock.module.css';
import ImgPlus from '../../assets/images/btn-plus.svg';
import ImgMinus from '../../assets/images/btn-minus.svg';

const SectionFaqBlock = () => {
  return (
    <div className={css.root}>
      <div className={css.title}><h4>Category</h4></div>
      <div className={css.content}>
        <div className={css.items}>
          <div className={css.item_normal}>
            <div className={css.item_title}>Lorem ipsum dolor sit amet consectetur.</div>
            <div className={css.item_button}>
              <img src={ImgPlus} />
            </div>
          </div>
          <div className={css.item_opened}>
            <div className={css.item_opened_title}>
              <div className={css.item_title}>Lorem ipsum dolor sit amet consectetur.</div>
              <div className={css.item_button}>
                <img src={ImgMinus} />
              </div>
            </div>
            <div className={css.item_content}>
              Lorem ipsum dolor sit amet consectetur. Urna condimentum tristique gravida pulvinar
              sit. Quisque integer a aliquam eleifend ultricies. Lorem ipsum dolor sit amet
              consectetur. Urna condimentum tristique gravida pulvinar sit. Quisque integer a
              aliquam eleifend ultricies.
            </div>
          </div>

          <div className={css.item_opened}>
            <div className={css.item_opened_title}>
              <div className={css.item_title}>Lorem ipsum dolor sit amet consectetur.</div>
              <div className={css.item_button}>
                <img src={ImgMinus} />
              </div>
            </div>
            <div className={css.item_content}>
              Lorem ipsum dolor sit amet consectetur. Urna condimentum tristique gravida pulvinar
              sit. Quisque integer a aliquam eleifend ultricies. Lorem ipsum dolor sit amet
              consectetur. Urna condimentum tristique gravida pulvinar sit. Quisque integer a
              aliquam eleifend ultricies.
            </div>
          </div>

          <div className={css.item_normal}>
            <div className={css.item_title}>Lorem ipsum dolor sit amet consectetur.</div>
            <div className={css.item_button}>
              <img src={ImgPlus} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SectionFaqBlock;
