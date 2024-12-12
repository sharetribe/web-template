import React, { useState } from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';

import { AspectRatioWrapper, Promised } from '../../components';

import css from './ImageFromFile.module.css';

// readImage returns a promise which is resolved
// when FileReader has loaded given file as dataURL
const readImage = file =>
  new Promise((resolve, reject) => {
    if (!window?.FileReader) {
      reject(new Error(`No FileReader found from window scope.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => {
      // eslint-disable-next-line
      console.error('Error (', e, `) happened while reading ${file.name}: ${e.target.result}`);
      reject(new Error(`Error reading ${file.name}: ${e.target.result}`));
    };
    reader.readAsDataURL(file);
  });

/**
 * Create image component from the given image file.
 * Note: currently this relies on dataURL.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.id
 * @param {number?} props.aspectWidth
 * @param {number?} props.aspectHeight
 * @param {File?} props.file from <input type="file" />
 * @param {ReactNode?} props.children
 * @returns {JSX.Element} SVG icon
 */
const ImageFromFile = props => {
  const [promisedImage, setPromisedImage] = useState(readImage(props.file));
  const { className, rootClassName, aspectWidth = 1, aspectHeight = 1, file, id, children } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <Promised
      key={id}
      promise={promisedImage}
      renderFulfilled={dataURL => {
        return (
          <div className={classes}>
            <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
              <img src={dataURL} alt={file.name} className={css.rootForImage} />
            </AspectRatioWrapper>
            {children}
          </div>
        );
      }}
      renderRejected={() => (
        <div className={classes}>
          <FormattedMessage id="ImageFromFile.couldNotReadFile" />
        </div>
      )}
    />
  );
};

export default ImageFromFile;
