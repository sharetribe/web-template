import React from 'react';
import { Button } from 'antd';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';

import { FormattedMessage } from '../../../util/reactIntl';
import {
  SCHEMA_TYPE_ENUM,
  SCHEMA_TYPE_MULTI_ENUM,
  SCHEMA_TYPE_TEXT,
  SCHEMA_TYPE_YOUTUBE,
  USER_TYPES,
} from '../../../util/types';
import { pickCustomFieldProps } from '../../../util/fieldHelpers';
import { isValidURL, stripUrl } from '../../../util/urlHelpers';
import { getUserTypeFieldInputs } from '../../../util/userHelpers';
import { richText } from '../../../util/richText';

import { H2, H3, AvatarExtraLarge, NamedLink } from '../../../components';

import CustomListingFields from '../../ListingPage/CustomListingFields';
import SectionMapMaybe from '../../ListingPage/SectionMapMaybe';

import SectionDetailsMaybe from '../SectionDetailsMaybe';
import SectionTextMaybe from '../SectionTextMaybe';
import SectionMultiEnumMaybe from '../SectionMultiEnumMaybe';
import SectionYoutubeVideoMaybe from '../SectionYoutubeVideoMaybe';

import css from '../ProfilePage.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 20;
const PRONOUNS_NOT_LISTED = 'not-listed';
const PREFER_NOT_TO_SAY_PRONOUNS = 'prefer-not-to-say';

const CustomUserFields = props => {
  const { publicData, metadata, userFieldConfig } = props;
  const shouldPickUserField = fieldConfig => {
    const userType = USER_TYPES.SELLER;
    const fieldKey = fieldConfig.key;
    const isBrandAdmin = false;
    const enableField = getUserTypeFieldInputs(userType, fieldKey, isBrandAdmin, false, true);
    const displayInProfile = fieldConfig?.showConfig?.displayInProfile !== false;
    return displayInProfile && enableField;
  };
  const propsForCustomFields =
    pickCustomFieldProps(publicData, metadata, userFieldConfig, 'userType', shouldPickUserField) ||
    [];
  const parsedUserFieldConfig = userFieldConfig.filter(shouldPickUserField);
  return (
    <>
      <SectionDetailsMaybe {...{ ...props, userFieldConfig: parsedUserFieldConfig }} />
      {propsForCustomFields.map(customFieldProps => {
        const { schemaType, ...fieldProps } = customFieldProps;
        return schemaType === SCHEMA_TYPE_MULTI_ENUM ? (
          <SectionMultiEnumMaybe {...fieldProps} />
        ) : schemaType === SCHEMA_TYPE_TEXT ? (
          <SectionTextMaybe {...fieldProps} />
        ) : schemaType === SCHEMA_TYPE_YOUTUBE ? (
          <SectionYoutubeVideoMaybe {...fieldProps} />
        ) : null;
      })}
    </>
  );
};

export function CreativeProfileInfo({ listing, config, intl }) {
  const { publicData, metadata, geolocation } = listing?.attributes || {};
  const listingId = listing?.id;
  const listingConfig = config.listing;
  const listingFieldConfigs = listingConfig.listingFields;
  const categoryConfiguration = config.categoryConfiguration;
  const mapsConfig = config.maps;
  return (
    <>
      <CustomListingFields
        publicData={publicData}
        metadata={metadata}
        listingFieldConfigs={listingFieldConfigs}
        categoryConfiguration={categoryConfiguration}
        intl={intl}
      />
      <SectionMapMaybe
        geolocation={geolocation}
        publicData={publicData}
        listingId={listingId}
        mapsConfig={mapsConfig}
      />
    </>
  );
}

export function UserProfileInfo({ user, config, intl }) {
  const { publicData, metadata } = user?.attributes?.profile || {};
  const { userFields } = config.user;
  return (
    <CustomUserFields
      publicData={publicData}
      metadata={metadata}
      userFieldConfig={userFields}
      intl={intl}
    />
  );
}

function ProfileInfo({
  user,
  creativeProfile,
  queryInProgress,
  showLinkToProfileSettingsPage,
  onToggleFavorites,
  isFavorite,
  config,
}) {
  const userId = user?.id?.uuid;
  const { bio, displayName, publicData } = user?.attributes?.profile || {};
  const { publicData: creativePublicData } = creativeProfile?.attributes || {};
  const { userFields } = config.user;
  const { listingFields } = config.listing;
  const pickFieldValue = (key, publicData, config) => {
    if (!publicData) return null;
    const value = publicData[key];
    const fieldConfig = config.find(field => field.key === key);
    const { schemaType, enumOptions } = fieldConfig;
    const findSelectedOption = enumValue => enumOptions?.find(o => enumValue === `${o.option}`);
    switch (schemaType) {
      case SCHEMA_TYPE_ENUM: {
        const selectedOption = findSelectedOption(value)?.label;
        return selectedOption || null;
      }
      case SCHEMA_TYPE_MULTI_ENUM: {
        const parsedArray = value.slice(0, 3);
        const selectedOptions = parsedArray.map(enumValue => findSelectedOption(enumValue)?.label);
        return !!selectedOptions ? selectedOptions.join(', ') : null;
      }

      case SCHEMA_TYPE_TEXT:
      default:
        return value;
    }
  };
  const rawPronouns = publicData?.pronouns;
  const pronouns = pickFieldValue('pronouns', publicData, userFields);
  const showPronouns =
    rawPronouns !== PREFER_NOT_TO_SAY_PRONOUNS && rawPronouns !== PRONOUNS_NOT_LISTED;
  const portfolioURL = pickFieldValue('portfolioURL', publicData, userFields);
  const creativeSpecialty = pickFieldValue('creativeSpecialty', creativePublicData, listingFields);
  const address = creativeProfile?.attributes?.publicData?.location?.address || '';
  const hasBio = !!bio;
  const hasPortfolioURL = !!portfolioURL;
  const parsedPortfolioURL = `${isValidURL(portfolioURL) ? '' : 'http://'}${portfolioURL}`;
  const parsedPortfolioLabel = stripUrl(portfolioURL);
  const parsedBookingFormURL = `https://theluupe.typeform.com/booking#creatorname=${displayName}&creatorid=${userId}`;

  const bioWithLinks = richText(bio, {
    linkify: true,
    longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
    longWordClass: css.longWord,
  });
  const toggleFavorites = () => onToggleFavorites(isFavorite);
  const favoriteButton = isFavorite ? (
    <Button
      type="text"
      icon={<HeartFilled style={{ fontSize: '30px' }} />}
      onClick={toggleFavorites}
      className={css.favoriteButton}
    />
  ) : (
    <Button
      type="text"
      icon={<HeartOutlined style={{ fontSize: '30px' }} />}
      onClick={toggleFavorites}
      className={css.favoriteButton}
    />
  );

  return (
    <div className={css.profileInfoWrapper}>
      <div className={css.profileInfoAvatar}>
        <AvatarExtraLarge user={user} disableProfileLink />
        <div className={css.mobileSellerHeading}>
          <H2 as="h1" className={css.sellerHeading}>
            {displayName}
          </H2>
          <div className={css.profileInfoActions}>
            {showLinkToProfileSettingsPage ? (
              <div>
                <NamedLink className={css.editLinkMobile} name="ProfileSettingsPage">
                  <FormattedMessage id="ProfilePage.editProfileLinkMobile" />
                </NamedLink>
              </div>
            ) : (
              <div className={css.actionsContainer}>
                <Button type="primary" className={css.actionButton} href={parsedBookingFormURL}>
                  <FormattedMessage id="ProfilePage.requestToBook" />
                </Button>
                {favoriteButton}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={css.profileInfoContent}>
        <div>
          <H2 as="h1" className={css.desktopSellerHeading}>
            {displayName}
          </H2>
          {!queryInProgress && showPronouns && (
            <span className={css.pronounsLabel}>({pronouns})</span>
          )}
        </div>
        {queryInProgress ? (
          <H3 as="h2">
            <FormattedMessage id="ProfilePage.loadingProfile" />
          </H3>
        ) : (
          <>
            <p className={css.creativeSpecialtyLabel}>{creativeSpecialty}</p>
            <p className={css.addressLabel}>{address}</p>
            {hasBio && <span className={css.bioLabel}>{bioWithLinks}</span>}
            {hasPortfolioURL && (
              <Button
                type="link"
                target="_blank"
                href={parsedPortfolioURL}
                className={css.portfolioLink}
              >
                {parsedPortfolioLabel}
              </Button>
            )}
          </>
        )}
      </div>
      <div className={css.profileInfoActionsDesktop}>
        {showLinkToProfileSettingsPage ? (
          <div>
            <NamedLink className={css.editLinkDesktop} name="ProfileSettingsPage">
              <FormattedMessage id="ProfilePage.editProfileLinkDesktop" />
            </NamedLink>
          </div>
        ) : (
          <div className={css.actionsContainer}>
            {favoriteButton}
            <Button type="primary" className={css.actionButton} href={parsedBookingFormURL}>
              <FormattedMessage id="ProfilePage.requestToBook" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
export default ProfileInfo;
