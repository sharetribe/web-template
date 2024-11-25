/**
 * Independent components
 * These components do not include any other components
 *
 * This order mitigates problems that might arise when trying to import components
 * that have circular dependencies to other components.
 * Note: import-order also affects to the generated CSS bundle file.
 *
 * Read more:
 * https://medium.com/visual-development/how-to-fix-nasty-circular-dependency-issues-once-and-for-all-in-javascript-typescript-a04c987cf0de
 */
import loadable from '@loadable/component';

// Icons
export { default as IconAdd } from './IconAdd/IconAdd';
export { default as IconAlert } from './IconAlert/IconAlert';
export { default as IconArrowHead } from './IconArrowHead/IconArrowHead';
export { default as IconBannedUser } from './IconBannedUser/IconBannedUser';
export { default as IconCheckmark } from './IconCheckmark/IconCheckmark';
export { default as IconClose } from './IconClose/IconClose';
export { default as IconDelete } from './IconDelete/IconDelete';
export { default as IconDisputeOrder } from './IconDisputeOrder/IconDisputeOrder';
export { default as IconEdit } from './IconEdit/IconEdit';
export { default as IconEmailAttention } from './IconEmailAttention/IconEmailAttention';
export { default as IconEmailSent } from './IconEmailSent/IconEmailSent';
export { default as IconEmailSuccess } from './IconEmailSuccess/IconEmailSuccess';
export { default as IconInquiry } from './IconInquiry/IconInquiry';
export { default as IconKeys } from './IconKeys/IconKeys';
export { default as IconKeysSuccess } from './IconKeysSuccess/IconKeysSuccess';
export { default as IconReviewStar } from './IconReviewStar/IconReviewStar';
export { default as IconReviewUser } from './IconReviewUser/IconReviewUser';
export { default as IconSearch } from './IconSearch/IconSearch';
export { default as IconSocialMediaFacebook } from './IconSocialMediaFacebook/IconSocialMediaFacebook';
export { default as IconSocialMediaInstagram } from './IconSocialMediaInstagram/IconSocialMediaInstagram';
export { default as IconSocialMediaTwitter } from './IconSocialMediaTwitter/IconSocialMediaTwitter';
export { default as IconSpinner } from './IconSpinner/IconSpinner';
export { default as IconSuccess } from './IconSuccess/IconSuccess';

// Typography
export { Heading, H1, H2, H3, H4, H5, H6  } from './Heading/Heading';

// Other independent components
export { default as AspectRatioWrapper } from './AspectRatioWrapper/AspectRatioWrapper';
export { default as ExternalLink } from './ExternalLink/ExternalLink';
export { default as ExpandingTextarea } from './ExpandingTextarea/ExpandingTextarea';
export { default as Form } from './Form/Form';
export { default as LimitedAccessBanner } from './LimitedAccessBanner/LimitedAccessBanner';
export { default as Logo } from './Logo/Logo';
export { default as NamedLink } from './NamedLink/NamedLink';
export { default as NamedRedirect } from './NamedRedirect/NamedRedirect';
export { default as NotificationBadge } from './NotificationBadge/NotificationBadge';
export { default as OutsideClickHandler } from './OutsideClickHandler/OutsideClickHandler';
export { default as Promised } from './Promised/Promised';
export { default as PropertyGroup } from './PropertyGroup/PropertyGroup';
export { default as RangeSlider } from './RangeSlider/RangeSlider';
export { default as ResponsiveImage } from './ResponsiveImage/ResponsiveImage';
export { default as ResponsiveBackgroundImageContainer } from './ResponsiveBackgroundImageContainer/ResponsiveBackgroundImageContainer';
export { default as TimeRange } from './TimeRange/TimeRange';
export { default as UserDisplayName } from './UserDisplayName/UserDisplayName';
export { default as ValidationError } from './ValidationError/ValidationError';

/**
 * Composite components
 * These components include other components
 */

//////////////////////////////////////////////////////////
// First components that include only atomic components //
//////////////////////////////////////////////////////////

export { default as Button, PrimaryButton, PrimaryButtonInline, SecondaryButton, SecondaryButtonInline, InlineTextButton, SocialLoginButton } from './Button/Button';
export { default as ImageFromFile } from './ImageFromFile/ImageFromFile';
export { default as LinkedLogo } from './Logo/LinkedLogo';
export { default as ListingLink } from './ListingLink/ListingLink';
export { default as PaginationLinks } from './PaginationLinks/PaginationLinks';
export { default as ReviewRating } from './ReviewRating/ReviewRating';

// Menu
export { default as MenuItem } from './MenuItem/MenuItem';
export { default as MenuContent } from './MenuContent/MenuContent';
export { default as MenuLabel } from './MenuLabel/MenuLabel';
export { default as Menu } from './Menu/Menu';

// Modal
export { default as Modal } from './Modal/Modal';
export { default as ModalInMobile } from './ModalInMobile/ModalInMobile';

// Fields (for Final Form)
export { default as FieldCheckbox } from './FieldCheckbox/FieldCheckbox';
export { default as FieldCurrencyInput } from './FieldCurrencyInput/FieldCurrencyInput';
export { default as FieldNumber } from './FieldNumber/FieldNumber';
export { default as FieldRadioButton } from './FieldRadioButton/FieldRadioButton';
export { default as FieldReviewRating } from './FieldReviewRating/FieldReviewRating';
export { default as FieldSelect } from './FieldSelect/FieldSelect';
export { default as FieldSelectTree } from './FieldSelectTree/FieldSelectTree';
export { default as FieldTextInput } from './FieldTextInput/FieldTextInput';

// Fields that use other Fields
export { default as FieldBoolean } from './FieldBoolean/FieldBoolean';
export { default as FieldCheckboxGroup } from './FieldCheckboxGroup/FieldCheckboxGroup';
export { default as FieldPhoneNumberInput } from './FieldPhoneNumberInput/FieldPhoneNumberInput';
export { default as LocationAutocompleteInput, FieldLocationAutocompleteInput } from './LocationAutocompleteInput/LocationAutocompleteInput';

// NOTE: these are code-splitted since these components are heavy and needed only on couple of pages
export const FieldDateRangePicker = loadable(() => import(/* webpackChunkName: "FieldDateRangePicker" */ './DatePicker/FieldDateRangePicker/FieldDateRangePicker'));
export const FieldSingleDatePicker = loadable(() => import(/* webpackChunkName: "FieldSingleDatePicker" */ './DatePicker/FieldSingleDatePicker/FieldSingleDatePicker'));
export const FieldDateRangeController = loadable(() => import(/* webpackChunkName: "FieldDateRangeController" */ './DatePicker/FieldDateRangeController/FieldDateRangeController'));

// Tab navigation
export { default as TabNav } from './TabNav/TabNav';
export { LinkTabNavHorizontal, ButtonTabNavHorizontal } from './TabNavHorizontal/TabNavHorizontal';
export { default as Tabs } from './Tabs/Tabs';
export { default as UserNav } from './UserNav/UserNav';

///////////////////////////////////////////////
// These components include other components //
///////////////////////////////////////////////

export { default as Avatar, AvatarSmall, AvatarMedium, AvatarLarge } from './Avatar/Avatar';
export { default as CustomExtendedDataField } from './CustomExtendedDataField/CustomExtendedDataField';
export { default as OrderBreakdown } from './OrderBreakdown/OrderBreakdown';
export { default as OrderPanel } from './OrderPanel/OrderPanel';
export { default as ListingCard } from './ListingCard/ListingCard';
export { default as Map } from './Map/Map';
export { default as Page } from './Page/Page';
export { default as Reviews } from './Reviews/Reviews';
export { default as SavedCardDetails } from './SavedCardDetails/SavedCardDetails';
export { default as StripeConnectAccountStatusBox } from './StripeConnectAccountStatusBox/StripeConnectAccountStatusBox';
export { default as StripePaymentAddress } from './StripePaymentAddress/StripePaymentAddress';

// Forms
export { default as StripeConnectAccountForm } from './StripeConnectAccountForm/StripeConnectAccountForm';

//////////////////////////////////////////////
// Page sections and modal content wrappers //
//////////////////////////////////////////////

export { default as LayoutComposer, LayoutSingleColumn, LayoutSideNavigation } from './LayoutComposer';
export { default as MaintenanceMode } from './MaintenanceMode/MaintenanceMode';
export { default as ModalMissingInformation } from './ModalMissingInformation/ModalMissingInformation';
