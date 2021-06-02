/**
 * Note: the order of the imports to these Styleguide examples is
 * significant. We should import indepenedent simple components first,
 * and more complex components later. The order of imports should also
 * match the import order elsewhere to avoid conflicts in module
 * bundling.
 *
 * This order mitigates problems that might arise when trying to import components
 * that have circular dependencies to other components.
 * Note: import-order also affects to the generated CSS bundle file.
 *
 * Read more:
 * https://medium.com/visual-development/how-to-fix-nasty-circular-dependency-issues-once-and-for-all-in-javascript-typescript-a04c987cf0de
 */

// components
import * as AddImages from './components/AddImages/AddImages.example';
import * as Avatar from './components/Avatar/Avatar.example';
import * as BookingBreakdown from './components/BookingBreakdown/BookingBreakdown.example';
import * as BookingDatesForm from './components/BookingPanel/BookingDatesForm/BookingDatesForm.example';
import * as BookingPanel from './components/BookingPanel/BookingPanel.example';
import * as BookingTimeInfo from './components/BookingTimeInfo/BookingTimeInfo.example';
import * as Button from './components/Button/Button.example';
import * as ExpandingTextarea from './components/ExpandingTextarea/ExpandingTextarea.example';
import * as FieldBirthdayInput from './components/FieldBirthdayInput/FieldBirthdayInput.example';
import * as FieldBoolean from './components/FieldBoolean/FieldBoolean.example';
import * as FieldCheckbox from './components/FieldCheckbox/FieldCheckbox.example';
import * as FieldCheckboxGroup from './components/FieldCheckboxGroup/FieldCheckboxGroup.example';
import * as FieldCurrencyInput from './components/FieldCurrencyInput/FieldCurrencyInput.example';
import * as FieldDateInput from './components/FieldDateInput/FieldDateInput.example';
import * as FieldDateRangeController from './components/FieldDateRangeController/FieldDateRangeController.example';
import * as FieldDateRangeInput from './components/FieldDateRangeInput/FieldDateRangeInput.example';
import * as FieldPhoneNumberInput from './components/FieldPhoneNumberInput/FieldPhoneNumberInput.example';
import * as FieldRadioButton from './components/FieldRadioButton/FieldRadioButton.example';
import * as FieldRangeSlider from './components/FieldRangeSlider/FieldRangeSlider.example';
import * as FieldReviewRating from './components/FieldReviewRating/FieldReviewRating.example';
import * as FieldSelect from './components/FieldSelect/FieldSelect.example';
import * as FieldTextInput from './components/FieldTextInput/FieldTextInput.example';
import * as Footer from './components/Footer/Footer.example';
import * as IconAdd from './components/IconAdd/IconAdd.example';
import * as IconBannedUser from './components/IconBannedUser/IconBannedUser.example';
import * as IconCheckmark from './components/IconCheckmark/IconCheckmark.example';
import * as IconClose from './components/IconClose/IconClose.example';
import * as IconEdit from './components/IconEdit/IconEdit.example';
import * as IconEmailAttention from './components/IconEmailAttention/IconEmailAttention.example';
import * as IconEmailSent from './components/IconEmailSent/IconEmailSent.example';
import * as IconEmailSuccess from './components/IconEmailSuccess/IconEmailSuccess.example';
import * as IconEnquiry from './components/IconEnquiry/IconEnquiry.example';
import * as IconKeys from './components/IconKeys/IconKeys.example';
import * as IconKeysSuccess from './components/IconKeysSuccess/IconKeysSuccess.example';
import * as IconReviewStar from './components/IconReviewStar/IconReviewStar.example';
import * as IconReviewUser from './components/IconReviewUser/IconReviewUser.example';
import * as IconSearch from './components/IconSearch/IconSearch.example';
import * as IconSocialMediaFacebook from './components/IconSocialMediaFacebook/IconSocialMediaFacebook.example';
import * as IconSocialMediaInstagram from './components/IconSocialMediaInstagram/IconSocialMediaInstagram.example';
import * as IconSocialMediaTwitter from './components/IconSocialMediaTwitter/IconSocialMediaTwitter.example';
import * as IconSpinner from './components/IconSpinner/IconSpinner.example';
import * as IconSuccess from './components/IconSuccess/IconSuccess.example';
import * as ListingCard from './components/ListingCard/ListingCard.example';
import * as LocationAutocompleteInput from './components/LocationAutocompleteInput/LocationAutocompleteInput.example';
import * as Map from './components/Map/Map.example';
import * as Menu from './components/Menu/Menu.example';
import * as Modal from './components/Modal/Modal.example';
import * as ModalInMobile from './components/ModalInMobile/ModalInMobile.example';
import * as NamedLink from './components/NamedLink/NamedLink.example';
import * as OutsideClickHandler from './components/OutsideClickHandler/OutsideClickHandler.example';
import * as PaginationLinks from './components/PaginationLinks/PaginationLinks.example';
import * as PropertyGroup from './components/PropertyGroup/PropertyGroup.example';
import * as RangeSlider from './components/RangeSlider/RangeSlider.example';
import * as ResponsiveImage from './components/ResponsiveImage/ResponsiveImage.example';
import * as ReviewRating from './components/ReviewRating/ReviewRating.example';
import * as Reviews from './components/Reviews/Reviews.example';
import * as SavedCardDetails from './components/SavedCardDetails/SavedCardDetails.example';
import * as SectionThumbnailLinks from './components/SectionThumbnailLinks/SectionThumbnailLinks.example';
import * as StripeBankAccountTokenInputField from './components/StripeBankAccountTokenInputField/StripeBankAccountTokenInputField.example';
import * as TabNav from './components/TabNav/TabNav.example';
import * as TabNavHorizontal from './components/TabNavHorizontal/TabNavHorizontal.example';
import * as Tabs from './components/Tabs/Tabs.example';
import * as UserCard from './components/UserCard/UserCard.example';
import * as UserDisplayName from './components/UserDisplayName/UserDisplayName.example';

// components under containers
import * as SignupForm from './containers/AuthenticationPage/SignupForm/SignupForm.example';
import * as LoginForm from './containers/AuthenticationPage/LoginForm/LoginForm.example';
import * as StripePaymentForm from './containers/CheckoutPage/StripePaymentForm/StripePaymentForm.example';
import * as EditListingAvailabilityForm from './containers/EditListingPage/EditListingWizard/EditListingAvailabilityPanel/EditListingAvailabilityForm.example';
import * as EditListingDetailsForm from './containers/EditListingPage/EditListingWizard/EditListingDetailsPanel/EditListingDetailsForm.example';
import * as EditListingFeaturesForm from './containers/EditListingPage/EditListingWizard/EditListingFeaturesPanel/EditListingFeaturesForm.example';
import * as EditListingLocationForm from './containers/EditListingPage/EditListingWizard/EditListingLocationPanel/EditListingLocationForm.example';
import * as EditListingPhotosForm from './containers/EditListingPage/EditListingWizard/EditListingPhotosPanel/EditListingPhotosForm.example';
import * as EditListingPoliciesForm from './containers/EditListingPage/EditListingWizard/EditListingPoliciesPanel/EditListingPoliciesForm.example';
import * as EditListingPricingForm from './containers/EditListingPage/EditListingWizard/EditListingPricingPanel/EditListingPricingForm.example';
import * as ReviewForm from './containers/TransactionPage/ReviewForm/ReviewForm.example';
import * as SendMessageForm from './containers/TransactionPage/SendMessageForm/SendMessageForm.example';
import * as ActivityFeed from './containers/TransactionPage/ActivityFeed/ActivityFeed.example';
import * as SelectMultipleFilter from './containers/SearchPage/SelectMultipleFilter/SelectMultipleFilter.example';
import * as BookingDateRangeFilter from './containers/SearchPage/BookingDateRangeFilter/BookingDateRangeFilter.example';
import * as KeywordFilter from './containers/SearchPage/KeywordFilter/KeywordFilter.example';
import * as PriceFilter from './containers/SearchPage/PriceFilter/PriceFilter.example';
import * as FilterForm from './containers/SearchPage/FilterForm/FilterForm.example';
import * as FilterPlain from './containers/SearchPage/FilterPlain/FilterPlain.example';
import * as FilterPopup from './containers/SearchPage/FilterPopup/FilterPopup.example';
import * as EmailVerificationForm from './containers/EmailVerificationPage/EmailVerificationForm/EmailVerificationForm.example';
import * as EnquiryForm from './containers/ListingPage/EnquiryForm/EnquiryForm.example';
import * as ImageCarousel from './containers/ListingPage/ImageCarousel/ImageCarousel.example';
import * as ListingImageGallery from './containers/ListingPage/ListingImageGallery/ListingImageGallery.example';
import * as PasswordRecoveryForm from './containers/PasswordRecoveryPage/PasswordRecoveryForm/PasswordRecoveryForm.example';
import * as PasswordResetForm from './containers/PasswordResetPage/PasswordResetForm/PasswordResetForm.example';
import * as ManageListingCard from './containers/ManageListingsPage/ManageListingCard/ManageListingCard.example';

// containers
import * as Colors from './containers/StyleguidePage/Colors.example';
import * as Typography from './containers/StyleguidePage/Typography.example';

export {
  ActivityFeed,
  AddImages,
  Avatar,
  BookingBreakdown,
  BookingDateRangeFilter,
  BookingDatesForm,
  BookingTimeInfo,
  BookingPanel,
  Button,
  Colors,
  EditListingAvailabilityForm,
  EditListingDetailsForm,
  EditListingFeaturesForm,
  EditListingLocationForm,
  EditListingPhotosForm,
  EditListingPoliciesForm,
  EditListingPricingForm,
  EmailVerificationForm,
  EnquiryForm,
  ExpandingTextarea,
  FieldBirthdayInput,
  FieldBoolean,
  FieldCheckbox,
  FieldCheckboxGroup,
  FieldCurrencyInput,
  FieldDateRangeController,
  FieldDateInput,
  FieldDateRangeInput,
  FieldPhoneNumberInput,
  FieldRadioButton,
  FieldRangeSlider,
  FieldReviewRating,
  FieldSelect,
  FieldTextInput,
  FilterForm,
  FilterPlain,
  FilterPopup,
  Footer,
  IconAdd,
  IconBannedUser,
  IconCheckmark,
  IconClose,
  IconEdit,
  IconEmailAttention,
  IconEmailSent,
  IconEmailSuccess,
  IconEnquiry,
  IconKeys,
  IconKeysSuccess,
  IconReviewStar,
  IconReviewUser,
  IconSearch,
  IconSocialMediaFacebook,
  IconSocialMediaInstagram,
  IconSocialMediaTwitter,
  IconSpinner,
  IconSuccess,
  ImageCarousel,
  KeywordFilter,
  ListingCard,
  ListingImageGallery,
  LocationAutocompleteInput,
  LoginForm,
  ManageListingCard,
  Map,
  Menu,
  Modal,
  ModalInMobile,
  NamedLink,
  OutsideClickHandler,
  PaginationLinks,
  PasswordRecoveryForm,
  PasswordResetForm,
  PriceFilter,
  PropertyGroup,
  RangeSlider,
  ResponsiveImage,
  ReviewForm,
  ReviewRating,
  Reviews,
  SavedCardDetails,
  SectionThumbnailLinks,
  SelectMultipleFilter,
  SendMessageForm,
  SignupForm,
  StripeBankAccountTokenInputField,
  StripePaymentForm,
  TabNav,
  TabNavHorizontal,
  Tabs,
  Typography,
  UserCard,
  UserDisplayName,
};
