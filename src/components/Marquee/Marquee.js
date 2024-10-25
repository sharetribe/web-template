import React from 'react';
import Marquee from 'react-fast-marquee';

import IconArrow from './icons/IconArrow';
import IconCircle from './icons/IconCircle';

import css from './Marquee.module.css';

function isOdd(num) {
  return num % 2;
}

const JoinTheLuupeMarquee = () => {
  const content = [];
  for (let i = 0; i < 20; i++) {
    content.push(
      <div key={`marquee-item-${i}`}>
        {isOdd(i) ? <IconArrow /> : <IconCircle />}
        IN THE LUUPE
      </div>
    );
  }
  return (
    <Marquee gradient={false} speed={50} className={css.root}>
      {content}
    </Marquee>
  );
};

export default JoinTheLuupeMarquee;
