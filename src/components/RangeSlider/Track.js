import React from 'react';
import classNames from 'classnames';

import css from './Track.module.css';

/**
 * A component that renders a track for a range slider.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {ReactNode} props.children - The children to render
 * @param {Array<number>} props.handles - The handles to render
 * @param {Function} props.valueToPosition - The function to convert the value to the position
 * @returns {JSX.Element} the track component that has the handles and the range between them
 */
const Track = props => {
  const { rootClassName, className, children, handles = [], valueToPosition } = props;
  const positionFromIndex = index => valueToPosition(handles[index]);

  const classes = classNames(rootClassName || css.root, className);
  return (
    <div className={classes}>
      <div className={css.track} />

      {handles.reduce((ranges, h, index) => {
        return index < handles.length - 1
          ? [
              ...ranges,
              <div
                key={`range_${index}-${index + 1}`}
                className={css.range}
                style={{
                  left: `${valueToPosition(h)}px`,
                  width: `${positionFromIndex(index + 1) - valueToPosition(h)}px`,
                }}
              />,
            ]
          : ranges;
      }, [])}

      {children}
    </div>
  );
};

export default Track;
