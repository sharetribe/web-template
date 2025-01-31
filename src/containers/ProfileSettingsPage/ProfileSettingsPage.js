import React from 'react';
import { bool, func, object, shape, string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { propTypes, USER_TYPES } from '../../util/types';
import { PROFILE_PAGE_PENDING_APPROVAL_VARIANT } from '../../util/urlHelpers';
import { ensureCurrentUser } from '../../util/data';
import {
  initialValuesForUserFields,
  isUserAuthorized,
  pickUserFieldsData,
  isCreativeSeller,
} from '../../util/userHelpers';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { H3, Page, UserNav, NamedLink, LayoutSideNavigation } from '../../components';

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

const ViewProfileLink = props => {
  const { userUUID, isUnauthorizedUser } = props;
  return userUUID && isUnauthorizedUser ? (
    <NamedLink
      className={css.profileLink}
      name="ProfilePageVariant"
      params={{ id: userUUID, variant: PROFILE_PAGE_PENDING_APPROVAL_VARIANT }}
    >
      <FormattedMessage id="ProfileSettingsPage.viewProfileLink" />
    </NamedLink>
  ) : userUUID ? (
    <NamedLink className={css.profileLink} name="ProfilePage" params={{ id: userUUID }}>
      <FormattedMessage id="ProfileSettingsPage.viewProfileLink" />
    </NamedLink>
  ) : null;
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

  const { userFields, userTypes = [] } = config.user;

  const handleSubmit = values => {
    const {
      firstName,
      lastName,
      displayName,
      bio: rawBio,
      userType: initialUserType,
      applyAsSeller,
      location: newLocation,
      ...rest
    } = values;
    const displayNameMaybe = displayName ? { displayName: displayName.trim() } : {};
    const userType = applyAsSeller ? USER_TYPES.SELLER : initialUserType.trim();
    const location = newLocation && {
      address: newLocation?.selectedPlace?.address,
      geolocation: {
        lat: newLocation?.selectedPlace?.origin?.lat,
        lng: newLocation?.selectedPlace?.origin?.lng,
      },
      building: '',
    };
    // Ensure that the optional bio is a string
    const bio = rawBio || '';
    const profile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      ...displayNameMaybe,
      bio,
      publicData: {
        userType,
        ...pickUserFieldsData(rest, 'public', userType, userFields),
      },
      privateData: {
        ...pickUserFieldsData(rest, 'private', userType, userFields),
        ...(!!location && { location }),
      },
      protectedData: {
        ...pickUserFieldsData(rest, 'protected', userType, userFields),
      },
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
  const {
    firstName,
    lastName,
    displayName,
    bio,
    publicData,
    protectedData,
    privateData,
    metadata,
  } = user?.attributes.profile;
  // I.e. the status is active, not pending-approval or banned
  const isUnauthorizedUser = currentUser && !isUserAuthorized(currentUser);

  const { userType } = publicData || {};
  const profileImageId = user.profileImage ? user.profileImage.id : null;
  const profileImage = image || { imageId: profileImageId };
  const userTypeConfig = userTypes.find(config => config.userType === userType);
  const isDisplayNameIncluded = userTypeConfig?.defaultUserFields?.displayName !== false;
  // ProfileSettingsForm decides if it's allowed to show the input field.
  const displayNameMaybe = isDisplayNameIncluded && displayName ? { displayName } : {};
  const withProfileListing = !!metadata?.profileListingId;
  const withCreativeProfile = isCreativeSeller(userType) && withProfileListing;

  const title = intl.formatMessage({ id: 'ProfileSettingsPage.title' });
  const profileSettingsForm = user.id ? (
    <ProfileSettingsForm
      className={css.form}
      currentUser={currentUser}
      initialValues={{
        firstName,
        lastName,
        ...displayNameMaybe,
        bio,
        profileImage: user.profileImage,
        userType,
        applyAsSeller: false,
        ...initialValuesForUserFields(publicData, 'public', userType, userFields),
        ...initialValuesForUserFields(protectedData, 'protected', userType, userFields),
        ...initialValuesForUserFields(privateData, 'private', userType, userFields),
      }}
      profileImage={profileImage}
      onImageUpload={e => onImageUploadHandler(e, onImageUpload)}
      uploadInProgress={uploadInProgress}
      updateInProgress={updateInProgress}
      uploadImageError={uploadImageError}
      updateProfileError={updateProfileError}
      onSubmit={values => handleSubmit(values)}
      marketplaceName={config.marketplaceName}
      userFields={userFields}
      userTypes={userTypes}
      sellerStatus={metadata?.sellerStatus}
    />
  ) : null;

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation
        topbar={
          <>
            <TopbarContainer />
            <UserNav currentPage="ProfileSettingsPage" />
          </>
        }
        sideNav={null}
        useProfileSettingsNav
        withCreativeProfile={withCreativeProfile}
        currentPage="ProfileSettingsPage"
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <div className={css.headingContainer}>
            <H3 as="h1" className={css.heading}>
              <FormattedMessage id="ProfileSettingsPage.heading" />
            </H3>

            <ViewProfileLink userUUID={user?.id?.uuid} isUnauthorizedUser={isUnauthorizedUser} />
          </div>
          {profileSettingsForm}
        </div>
      </LayoutSideNavigation>
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
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(ProfileSettingsPageComponent);

export default ProfileSettingsPage;
