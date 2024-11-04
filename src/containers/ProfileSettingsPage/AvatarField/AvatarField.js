import React, { useEffect, useState } from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { isUploadImageOverLimitError } from '../../../util/errors';

import { Avatar, ImageFromFile, IconSpinner, H4 } from '../../../components';

import css from './AvatarField.module.css';

const ACCEPT_IMAGES = 'image/*';
const UPLOAD_CHANGE_DELAY = 2000; // Show spinner so that browser has time to load img srcset

function AvatarField({
  user,
  onImageUpload,
  profileImage,
  uploadImageError,
  uploadInProgress,
  form,
}) {
  const [mounted, setMounted] = useState(false);
  const [uploadDelay, setUploadDelay] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setUploadDelay(true);
      const uploadDelayTimeoutId = setTimeout(() => setUploadDelay(false), UPLOAD_CHANGE_DELAY);
      return () => clearTimeout(uploadDelayTimeoutId);
    }
  }, [uploadInProgress]);

  const uploadingOverlay =
    uploadInProgress || uploadDelay ? (
      <div className={css.uploadingImageOverlay}>
        <IconSpinner />
      </div>
    ) : null;

  const hasUploadError = !!uploadImageError && !uploadInProgress;
  const errorClasses = classNames({ [css.avatarUploadError]: hasUploadError });
  const transientUserProfileImage = profileImage.uploadedImage || user.profileImage;
  const transientUser = { ...user, profileImage: transientUserProfileImage };

  // Ensure that file exists if imageFromFile is used
  const fileExists = !!profileImage.file;
  const fileUploadInProgress = uploadInProgress && fileExists;
  const delayAfterUpload = profileImage.imageId && uploadDelay;
  const imageFromFile =
    fileExists && (fileUploadInProgress || delayAfterUpload) ? (
      <ImageFromFile
        id={profileImage.id}
        className={errorClasses}
        rootClassName={css.uploadingImage}
        aspectWidth={1}
        aspectHeight={1}
        file={profileImage.file}
      >
        {uploadingOverlay}
      </ImageFromFile>
    ) : null;

  // Avatar is rendered in hidden during the upload delay
  // Upload delay smoothes image change process:
  // responsive img has time to load srcset stuff before it is shown to user.
  const avatarClasses = classNames(errorClasses, css.avatar, {
    [css.avatarInvisible]: uploadDelay,
  });
  const avatarComponent =
    !fileUploadInProgress && profileImage.imageId ? (
      <Avatar
        className={avatarClasses}
        renderSizes="(max-width: 767px) 96px, 240px"
        user={transientUser}
        disableProfileLink
      />
    ) : null;

  const chooseAvatarLabel =
    profileImage.imageId || fileUploadInProgress ? (
      <div className={css.avatarContainer}>
        {imageFromFile}
        {avatarComponent}
        <div className={css.changeAvatar}>
          <FormattedMessage id="ProfileSettingsForm.changeAvatar" />
        </div>
      </div>
    ) : (
      <div className={css.avatarPlaceholder}>
        <div className={css.avatarPlaceholderText}>
          <FormattedMessage id="ProfileSettingsForm.addYourProfilePicture" />
        </div>
        <div className={css.avatarPlaceholderTextMobile}>
          <FormattedMessage id="ProfileSettingsForm.addYourProfilePictureMobile" />
        </div>
      </div>
    );

  return (
    <div className={css.sectionContainer}>
      <H4 as="h2" className={css.sectionTitle}>
        <FormattedMessage id="ProfileSettingsForm.yourProfilePicture" />
      </H4>
      <Field
        accept={ACCEPT_IMAGES}
        id="profileImage"
        name="profileImage"
        label={chooseAvatarLabel}
        type="file"
        form={null}
        uploadImageError={uploadImageError}
        disabled={uploadInProgress}
      >
        {fieldProps => {
          const { accept, id, input, label, disabled, uploadImageError } = fieldProps;
          const { name, type } = input;
          const onChange = e => {
            const file = e.target.files[0];
            form.change(`profileImage`, file);
            form.blur(`profileImage`);
            if (file != null) {
              const tempId = `${file.name}_${Date.now()}`;
              onImageUpload({ id: tempId, file });
            }
          };

          let error = null;

          if (isUploadImageOverLimitError(uploadImageError)) {
            error = (
              <div className={css.error}>
                <FormattedMessage id="ProfileSettingsForm.imageUploadFailedFileTooLarge" />
              </div>
            );
          } else if (uploadImageError) {
            error = (
              <div className={css.error}>
                <FormattedMessage id="ProfileSettingsForm.imageUploadFailed" />
              </div>
            );
          }

          return (
            <div className={css.uploadAvatarWrapper}>
              <label className={css.label} htmlFor={id}>
                {label}
              </label>
              <input
                accept={accept}
                id={id}
                name={name}
                className={css.uploadAvatarInput}
                disabled={disabled}
                onChange={onChange}
                type={type}
              />
              {error}
            </div>
          );
        }}
      </Field>
      <div className={css.tip}>
        <FormattedMessage id="ProfileSettingsForm.tip" />
      </div>
      <div className={css.fileInfo}>
        <FormattedMessage id="ProfileSettingsForm.fileInfo" />
      </div>
    </div>
  );
}

export default AvatarField;
