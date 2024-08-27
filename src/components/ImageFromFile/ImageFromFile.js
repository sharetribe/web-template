import React, { useState } from 'react';
import { any, node, number, string } from 'prop-types';
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

// Create elements out of given thumbnail file
const ImageFromFile = props => {
  const [promisedImage, setPromisedImage] = useState(readImage(props.file));
  const { className, rootClassName, aspectWidth, aspectHeight, file, id, children } = props;
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

ImageFromFile.defaultProps = {
  className: null,
  children: null,
  rootClassName: null,
  aspectWidth: 1,
  aspectHeight: 1,
};

ImageFromFile.propTypes = {
  className: string,
  rootClassName: string,
  aspectWidth: number,
  aspectHeight: number,
  file: any.isRequired,
  id: string.isRequired,
  children: node,
};

export default ImageFromFile;
