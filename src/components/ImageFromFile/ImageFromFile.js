import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';

import config from '../../config';
import { AspectRatioWrapper, Promised } from '../../components';

import css from './ImageFromFile.module.css';

// readImage returns a promise which is resolved
// when FileReader has loaded given file as dataURL
const readImage = file =>
  new Promise((resolve, reject) => {
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
class ImageFromFile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      promisedImage: readImage(this.props.file),
    };
  }

  render() {
    const { className, rootClassName, aspectRatioClassName, file, id, children } = this.props;
    const classes = classNames(rootClassName || css.root, className);
    const { aspectWidth = 1, aspectHeight = 1 } = config.listing;

    return (
      <Promised
        key={id}
        promise={this.state.promisedImage}
        renderFulfilled={dataURL => {
          return (
            <div className={classes}>
              <div className={css.threeToTwoWrapper}>
                <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
                  <img src={dataURL} alt={file.name} className={css.rootForImage} />
                </AspectRatioWrapper>
              </div>
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
  }
}

ImageFromFile.defaultProps = {
  className: null,
  children: null,
  rootClassName: null,
  aspectRatioClassName: null,
};

const { any, node, string } = PropTypes;

ImageFromFile.propTypes = {
  className: string,
  rootClassName: string,
  aspectRatioClassName: string,
  file: any.isRequired,
  id: string.isRequired,
  children: node,
};

export default ImageFromFile;
