import React from 'react';
import classNames from 'classnames';

import css from './IconArrowHead.module.css';

const DIRECTION_RIGHT = 'right';
const DIRECTION_LEFT = 'left';
const DIRECTION_DOWN = 'down';
const DIRECTION_UP = 'up';
const SIZE_BIG = 'big';
const SIZE_SMALL = 'small';
const SIZE_TINY = 'tiny';

/**
 * Icon with arrow head pointing to given direction and with given size.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {('right' | 'left' | 'down' | 'up')} props.direction
 * @param {('small' | 'big' | 'tiny')} props.size
 * @returns {JSX.Element} arrow head icon
 */
const IconArrowHead = props => {
  const { className, rootClassName, direction, size = SIZE_SMALL } = props;
  const classes = classNames(
    rootClassName ? rootClassName : size === SIZE_TINY ? css.rootTinyArrow : css.root,
    className
  );

  const isRight = direction === DIRECTION_RIGHT;
  const isLeft = direction === DIRECTION_LEFT;
  const isDown = direction === DIRECTION_DOWN;
  const isUp = direction === DIRECTION_UP;
  const isBig = size === SIZE_BIG;
  const isSmall = size === SIZE_SMALL;
  const isTiny = size === SIZE_TINY;

  if (isRight && isSmall) {
    return (
      <svg
        className={classes}
        width="9"
        height="13"
        viewBox="0 0 9 13"
        xmlns="http://www.w3.org/2000/svg"
        role="none"
      >
        <path
          d="M7.472 6.97c.26-.26.26-.68 0-.94L2.14.694c-.263-.26-.684-.26-.944 0-.26.26-.26.683 0 .943L6.056 6.5l-4.86 4.862c-.26.26-.26.683 0 .943.26.26.68.26.943 0L7.47 6.97z"
          fillRule="evenodd"
        />
      </svg>
    );
  } else if (isLeft && isSmall) {
    return (
      <svg
        className={classes}
        width="9"
        height="13"
        viewBox="0 0 9 13"
        xmlns="http://www.w3.org/2000/svg"
        role="none"
      >
        <path
          d="M1.195 6.03c-.26.26-.26.68 0 .94l5.333 5.335c.262.26.683.26.943 0 .262-.26.262-.683 0-.943L2.61 6.5l4.86-4.862c.262-.26.262-.683 0-.943-.26-.26-.68-.26-.942 0L1.195 6.03z"
          fillRule="evenodd"
        />
      </svg>
    );
  } else if (isDown && isSmall) {
    return (
      <svg
        className={classes}
        width="13"
        height="9"
        viewBox="0 0 13 9"
        xmlns="http://www.w3.org/2000/svg"
        role="none"
      >
        <path
          d="M6.03 6.805c.26.26.68.26.94 0l5.335-5.333a.668.668 0 0 0-.943-.943L6.5 5.39 1.638.53a.666.666 0 1 0-.943.942L6.03 6.805z"
          fillRule="evenodd"
        />
      </svg>
    );
  } else if (isUp && isSmall) {
    return (
      <svg
        className={classes}
        width="13"
        height="9"
        viewBox="0 0 13 9"
        xmlns="http://www.w3.org/2000/svg"
        role="none"
      >
        <path
          d="M6.97.195a.664.664 0 0 0-.94 0L.695 5.528a.668.668 0 0 0 .943.943L6.5 1.61l4.862 4.86a.666.666 0 1 0 .943-.942L6.97.195z"
          fillRule="evenodd"
        />
      </svg>
    );
  } else if (isRight && isBig) {
    return (
      <svg
        className={classes}
        width="11"
        height="15"
        viewBox="0 0 11 15"
        xmlns="http://www.w3.org/2000/svg"
        role="none"
      >
        <path
          d="M1.6 14c-.17 0-.34-.065-.458-.192-.214-.228-.182-.57.07-.764L8.472 7.5 1.21 1.955c-.252-.194-.284-.535-.07-.763.214-.23.592-.257.846-.064l7.8 5.958c.135.104.212.255.212.414 0 .16-.077.31-.212.414l-7.8 5.958c-.113.086-.25.128-.388.128"
          fillRule="evenodd"
        />
      </svg>
    );
  } else if (isLeft && isBig) {
    return (
      <svg
        className={classes}
        width="11"
        height="15"
        viewBox="0 0 11 15"
        xmlns="http://www.w3.org/2000/svg"
        role="none"
      >
        <path
          d="M9.4 1c.17 0 .34.065.458.192.214.228.182.57-.07.764L2.528 7.5l7.26 5.545c.252.194.284.535.07.763-.214.23-.592.257-.846.064l-7.8-5.958C1.077 7.81 1 7.66 1 7.5c0-.16.077-.31.212-.414l7.8-5.958C9.125 1.042 9.262 1 9.4 1"
          fillRule="evenodd"
        />
      </svg>
    );
  } else if (isDown && isBig) {
    return (
      <svg
        className={classes}
        width="15"
        height="11"
        viewBox="0 0 15 11"
        xmlns="http://www.w3.org/2000/svg"
        role="none"
      >
        <path
          d="M.5 1.1C.5.93.565.76.692.642a.508.508 0 0 1 .764.07L7 7.972 12.545.71a.506.506 0 0 1 .763-.07c.23.214.257.592.064.846l-5.958 7.8A.524.524 0 0 1 7 9.498a.522.522 0 0 1-.414-.212l-5.958-7.8A.638.638 0 0 1 .5 1.098"
          fillRule="evenodd"
        />
      </svg>
    );
  } else if (isUp && isBig) {
    return (
      <svg
        className={classes}
        width="15"
        height="11"
        viewBox="0 0 15 11"
        xmlns="http://www.w3.org/2000/svg"
        role="none"
      >
        <path
          d="M13.5 8.9c0 .17-.065.34-.192.458a.508.508 0 0 1-.764-.07L7 2.028 1.455 9.29a.506.506 0 0 1-.763.07.644.644 0 0 1-.064-.846l5.958-7.8A.524.524 0 0 1 7 .502c.16 0 .31.077.414.212l5.958 7.8c.086.113.128.25.128.388"
          fillRule="evenodd"
        />
      </svg>
    );
  } else if (isRight && isTiny) {
    return (
      <svg
        className={classes}
        width="5"
        height="8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="none"
      >
        <path
          fillRule="evenodd"
          d="M3.903 3.763c.13.131.13.342 0 .473L1.238 6.902a.333.333 0 1 1-.47-.47l2.427-2.433L.767 1.57a.333.333 0 0 1 .471-.471l2.665 2.665Z"
        />
      </svg>
    );
  } else if (isLeft && isTiny) {
    return (
      <svg
        className={classes}
        width="5"
        height="8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="none"
      >
        <path
          fillRule="evenodd"
          d="M1.097 3.763a.335.335 0 0 0 0 .473l2.665 2.666a.333.333 0 1 0 .47-.47L1.806 3.998l2.428-2.43a.333.333 0 0 0-.471-.471L1.097 3.763Z"
        />
      </svg>
    );
  } else if (isDown && isTiny) {
    return (
      <svg
        className={classes}
        width="8"
        height="5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="none"
      >
        <path
          fillRule="evenodd"
          d="M3.764 4.236c.131.13.341.13.472 0l2.666-2.667a.333.333 0 1 0-.471-.471L4 3.528l-2.43-2.43a.333.333 0 1 0-.471.471l2.665 2.667Z"
        />
      </svg>
    );
  } else if (isUp && isTiny) {
    return (
      <svg
        className={classes}
        width="8"
        height="5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="none"
      >
        <path
          fillRule="evenodd"
          d="M3.764 1.098a.334.334 0 0 1 .472 0l2.666 2.667a.333.333 0 1 1-.471.47L4 1.807l-2.43 2.43a.333.333 0 1 1-.471-.471l2.665-2.667Z"
        />
      </svg>
    );
  }
};

export default IconArrowHead;
