/**
 * Functional component to help with uploading
 * multiple images/files
 *
 * See: https://react-dropzone.js.org
 */
import classNames from 'classnames';
import { string } from 'prop-types';
import React, { useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Field } from 'react-final-form';
import {
  ExternalLink,
  IconClose,
  IconLink,
  ImageFromS3,
  InlineTextButton,
  ResponsiveImage,
} from '../../components';
import { FormattedMessage } from '../../util/reactIntl';

import css from './FieldDropzone.module.css';

const ACCEPT_FILES = {
  'image/jpeg': [],
  'image/png': [],
  'image/gif': [],
  'application/msword': [],
  'application/pdf': [],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
};
export const FILE_DOCUMENT_TYPES = ['pdf', 'doc', 'docx'];
const USE_FC_ACCESS_API = false;
const MAX_SIZE = 20 * 1024 * 1024; // 20MB in bytes

export const checkFileType = url => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Extract the filename from the pathname
    const fileName = pathname.substring(pathname.lastIndexOf('/') + 1);

    let fileType;
    // Check the file extension and return corresponding file type
    if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) {
      fileType = 'jpg';
    } else if (pathname.endsWith('.pdf')) {
      fileType = 'pdf';
    } else if (pathname.endsWith('.doc')) {
      fileType = 'doc';
    } else if (pathname.endsWith('.docx')) {
      fileType = 'docx';
    } else if (pathname.endsWith('.png')) {
      fileType = 'png';
    } else {
      fileType = 'unknown'; // Return "unknown" for unsupported file types
    }
    return `${fileName},${fileType}`;
  } catch (err) {
    console.error('Invalid URL:', err);
    return ''; // Return an empty string on error
  }
};

const RemoveButton = props => {
  const { file, disabled, onRemoveFile, removeButtonClassName } = props;

  const handleDelete = () => {
    if (!disabled) {
      // const fileIndexOrImgId = file.id ? file?.id?.uuid || file?.id : file.index;
      onRemoveFile(file);
    }

    return;
  };

  return (
    <InlineTextButton
      type="button"
      className={classNames(removeButtonClassName, css.removeButton)}
      onClick={handleDelete}
    >
      <IconClose className={css.removeIcon} />
    </InlineTextButton>
  );
};

export const PreviewLink = props => {
  const { file } = props;
  return file?.link ? (
    <ExternalLink className={css.previewLink} href={file}>
      <IconLink className={css.previewLinkIcon} />
    </ExternalLink>
  ) : null;
};

const Thumb = props => {
  const { file, removeFile, disabled, ...rest } = props;

  if (!file) {
    return null;
  }
  let getFileType = '';
  let getFileName = '';
  if (file && typeof file === 'string') {
    getFileType = checkFileType(file).split(',')[1];
    getFileName = checkFileType(file).split(',')[0];
  }

  const fileExtension = file?.name?.split('.').reverse()[0];
  const isFileDocument = FILE_DOCUMENT_TYPES.includes(getFileType.toString());

  const renderDocument = (
    <div className={css.thumbFile}>
      <span className={css.thumbFileText}>{getFileName}</span>
    </div>
  );

  const renderPreviewImage = <img src={file?.preview} className={css.thumbImage} alt={file?.name}/>;
  const renderImage = (
    <ImageFromS3
      id={file}
      rootClassName={css.thumbImage}
      aspectWidth={1}
      aspectHeight={1}
      file={file}
    />
  );

  const renderFile = isFileDocument
    ? renderDocument
    : file?.preview
      ? renderPreviewImage
      : renderImage;

  return (
    <li className={css.thumb} key={file?.name}>
      <div className={css.actionButtons}>
        <PreviewLink file={file} />
        <RemoveButton file={file} onRemoveFile={removeFile} disabled={disabled} {...rest} />
      </div>
      <div className={css.thumbInner}>{renderFile}</div>
    </li>
  );
};

const FieldDropzoneComponent = props => {
  const isMounted = useRef(false);
  const { input, disabled, files, setFiles, acceptFiles, onChange, removeButtonClassName } = props;

  if (!files || !setFiles) {
    throw new Error('files and setFiles props are required');
  }

  useEffect(() => {
    // We need to avoid running onChange
    // function on first mount
    if (isMounted.current) {
      input.onChange(files);

      if (onChange) {
        onChange(files);
      }
    } else {
      isMounted.current = true;
    }
  }, [files]);

  const accept = acceptFiles || ACCEPT_FILES;

  const { getRootProps, getInputProps } = useDropzone({
    accept,
    useFsAccessApi: USE_FC_ACCESS_API,
    maxSize: MAX_SIZE,
    disabled,
    onDrop: acceptedFiles => {
      const newFiles = acceptedFiles.map((file, index) =>
        Object.assign(file, {
          index,
          preview: URL.createObjectURL(file),
        })
      );
      const hasOldFiles = files && files.length > 0;

      setFiles(hasOldFiles ? [...files, ...newFiles] : newFiles);
    },
  });

  const removeFile = fileIndexOrImgId => {
    // const newFiles = files.filter(file =>
    //   file.id
    //     ? file.id.uuid
    //       ? file.id.uuid !== fileIndexOrImgId
    //       : file.id !== fileIndexOrImgId
    //     : file.index !== fileIndexOrImgId
    // );
    const newFiles = files.filter(file => file !== fileIndexOrImgId);
    setFiles(newFiles);
  };

  const renderThumbs = files.map((file, index) => {
    return (
      <Thumb
        key={index}
        file={file}
        disabled={disabled}
        removeFile={removeFile}
        removeButtonClassName={removeButtonClassName}
      />
    );
  });

  const renderThumbsContainer =
    files.length > 0 ? <ul className={css.thumbsContainer}>{renderThumbs}</ul> : null;

  const browseMessage = (
    <span className={css.browseMessage}>
      <FormattedMessage id="FieldDropzone.browseMessage" />
    </span>
  );

  const addImagesWrapperClasses = classNames(css.addImagesWrapper, {
    [css.addImagesWrapperDisabled]: disabled,
  });

  return (
    <div className={css.addImages}>
      <div className={addImagesWrapperClasses} {...getRootProps()}>
        <input {...getInputProps()} />
        <p className={css.addImagesMessage}>
          <FormattedMessage id="FieldDropzone.addImagesMessage" values={{ browseMessage }} />
        </p>
      </div>
      {renderThumbsContainer}
    </div>
  );
};

const FieldDropzone = props => {
  const { rootClassName, className, id, label, disabled, acceptFiles, ...rest } = props;

  if (label && !id) {
    throw new Error('id required when a label is given');
  }

  const inputProps = { id, ...rest };
  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={classes}>
      {label ? (
        <label className={css.label} htmlFor={id}>
          {label}
        </label>
      ) : null}
      <Field
        component={FieldDropzoneComponent}
        disabled={disabled}
        acceptFiles={acceptFiles}
        {...inputProps}
      />
    </div>
  );
};

FieldDropzone.defualtProps = {
  rootClassName: null,
  className: null,
  id: null,
  label: null,
};

FieldDropzone.propTypes = {
  rootClassName: string,
  className: string,
  id: string.isRequired,
  label: string,
};

export default FieldDropzone;
