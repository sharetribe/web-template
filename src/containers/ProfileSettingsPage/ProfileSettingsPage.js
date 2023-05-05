import React from 'react';
import { bool, func, object, shape, string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { ensureCurrentUser } from '../../util/data';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { H3, Page, UserNav, NamedLink, LayoutSingleColumn } from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import ProfileSettingsForm from './ProfileSettingsForm/ProfileSettingsForm';

import { updateProfile, uploadImage } from './ProfileSettingsPage.duck';
import css from './ProfileSettingsPage.module.css';

const onImageUploadHandler = (values, fn) => {
  const { id, imageId, file } = values;
  if (file) {
    fn({ id, imageId, file });
  }
};

export const ProfileSettingsPageComponent = props => {
  const config = useConfiguration();
  const {
    currentUser,
    image,
    onImageUpload,
    onUpdateProfile,
    scrollingDisabled,
    updateInProgress,
    updateProfileError,
    uploadImageError,
    uploadInProgress,
    intl,
  } = props;

  const handleSubmit = values => {
    const { firstName, lastName, bio: rawBio } = values;

    // Ensure that the optional bio is a string
    const bio = rawBio || '';

    const profile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      bio,
    };
    const uploadedImage = props.image;

    // Update profileImage only if file system has been accessed
    const updatedValues =
      uploadedImage && uploadedImage.imageId && uploadedImage.file
        ? { ...profile, profileImageId: uploadedImage.imageId }
        : profile;

    onUpdateProfile(updatedValues);
  };

  const user = ensureCurrentUser(currentUser);
  const { firstName, lastName, bio } = user.attributes.profile;
  const profileImageId = user.profileImage ? user.profileImage.id : null;
  const profileImage = image || { imageId: profileImageId };

  const profileSettingsForm = user.id ? (
    <ProfileSettingsForm
      className={css.form}
      currentUser={currentUser}
      initialValues={{ firstName, lastName, bio, profileImage: user.profileImage }}
      profileImage={profileImage}
      onImageUpload={e => onImageUploadHandler(e, onImageUpload)}
      uploadInProgress={uploadInProgress}
      updateInProgress={updateInProgress}
      uploadImageError={uploadImageError}
      updateProfileError={updateProfileError}
      onSubmit={handleSubmit}
      marketplaceName={config.marketplaceName}
    />
  ) : null;

  const title = intl.formatMessage({ id: 'ProfileSettingsPage.title' });

  return (
    <Page className={css.root} title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer currentPage="ProfileSettingsPage" />
            <UserNav currentPage="ProfileSettingsPage" />
          </>
        }
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <div className={css.headingContainer}>
            <H3 as="h1" className={css.heading}>
              <FormattedMessage id="ProfileSettingsPage.heading" />
            </H3>
            {user.id ? (
              <NamedLink
                className={css.profileLink}
                name="ProfilePage"
                params={{ id: user.id.uuid }}
              >
                <FormattedMessage id="ProfileSettingsPage.viewProfileLink" />
              </NamedLink>
            ) : null}
          </div>
          {profileSettingsForm}
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

ProfileSettingsPageComponent.defaultProps = {
  currentUser: null,
  uploadImageError: null,
  updateProfileError: null,
  image: null,
  config: null,
};

ProfileSettingsPageComponent.propTypes = {
  currentUser: propTypes.currentUser,
  image: shape({
    id: string,
    imageId: propTypes.uuid,
    file: object,
    uploadedImage: propTypes.image,
  }),
  onImageUpload: func.isRequired,
  onUpdateProfile: func.isRequired,
  scrollingDisabled: bool.isRequired,
  updateInProgress: bool.isRequired,
  updateProfileError: propTypes.error,
  uploadImageError: propTypes.error,
  uploadInProgress: bool.isRequired,

  // from useConfiguration()
  config: object,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    image,
    uploadImageError,
    uploadInProgress,
    updateInProgress,
    updateProfileError,
  } = state.ProfileSettingsPage;
  return {
    currentUser,
    image,
    scrollingDisabled: isScrollingDisabled(state),
    updateInProgress,
    updateProfileError,
    uploadImageError,
    uploadInProgress,
  };
};

const mapDispatchToProps = dispatch => ({
  onImageUpload: data => dispatch(uploadImage(data)),
  onUpdateProfile: data => dispatch(updateProfile(data)),
});

const ProfileSettingsPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  injectIntl
)(ProfileSettingsPageComponent);

export default ProfileSettingsPage;
