import React from 'react';
import loadable from '@loadable/component';

import getPageDataLoadingAPI from '../containers/pageDataLoadingAPI';
import NotFoundPage from '../containers/NotFoundPage/NotFoundPage';
import PreviewResolverPage from '../containers/PreviewResolverPage/PreviewResolverPage';

// routeConfiguration needs to initialize containers first
// Otherwise, components will import form container eventually and
// at that point css bundling / imports will happen in wrong order.
import { NamedRedirect } from '../components';

const pageDataLoadingAPI = getPageDataLoadingAPI();

const AuthenticationPage = loadable(() => import(/* webpackChunkName: "AuthenticationPage" */ '../containers/AuthenticationPage/AuthenticationPage'));
const CheckoutPage = loadable(() => import(/* webpackChunkName: "CheckoutPage" */ '../containers/CheckoutPage/CheckoutPage'));
const CMSPage = loadable(() => import(/* webpackChunkName: "CMSPage" */ '../containers/CMSPage/CMSPage'));
const ContactDetailsPage = loadable(() => import(/* webpackChunkName: "ContactDetailsPage" */ '../containers/ContactDetailsPage/ContactDetailsPage'));
const EditListingPage = loadable(() => import(/* webpackChunkName: "EditListingPage" */ '../containers/EditListingPage/EditListingPage'));
const EmailVerificationPage = loadable(() => import(/* webpackChunkName: "EmailVerificationPage" */ '../containers/EmailVerificationPage/EmailVerificationPage'));
const InboxPage = loadable(() => import(/* webpackChunkName: "InboxPage" */ '../containers/InboxPage/InboxPage'));
const LandingPage = loadable(() => import(/* webpackChunkName: "LandingPage" */ '../containers/LandingPage/LandingPage'));
const ListingPageCoverPhoto = loadable(() => import(/* webpackChunkName: "ListingPageCoverPhoto" */ /* webpackPrefetch: true */ '../containers/ListingPage/ListingPageCoverPhoto'));
const ListingPageCarousel = loadable(() => import(/* webpackChunkName: "ListingPageCarousel" */ /* webpackPrefetch: true */ '../containers/ListingPage/ListingPageCarousel'));
const ManageListingsPage = loadable(() => import(/* webpackChunkName: "ManageListingsPage" */ '../containers/ManageListingsPage/ManageListingsPage'));
const PasswordChangePage = loadable(() => import(/* webpackChunkName: "PasswordChangePage" */ '../containers/PasswordChangePage/PasswordChangePage'));
const PasswordRecoveryPage = loadable(() => import(/* webpackChunkName: "PasswordRecoveryPage" */ '../containers/PasswordRecoveryPage/PasswordRecoveryPage'));
const PasswordResetPage = loadable(() => import(/* webpackChunkName: "PasswordResetPage" */ '../containers/PasswordResetPage/PasswordResetPage'));
const PaymentMethodsPage = loadable(() => import(/* webpackChunkName: "PaymentMethodsPage" */ '../containers/PaymentMethodsPage/PaymentMethodsPage'));
const PrivacyPolicyPage = loadable(() => import(/* webpackChunkName: "PrivacyPolicyPage" */ '../containers/PrivacyPolicyPage/PrivacyPolicyPage'));
const ProfilePage = loadable(() => import(/* webpackChunkName: "ProfilePage" */ '../containers/ProfilePage/ProfilePage'));
const ProfileSettingsPage = loadable(() => import(/* webpackChunkName: "ProfileSettingsPage" */ '../containers/ProfileSettingsPage/ProfileSettingsPage'));
const SearchPageWithMap = loadable(() => import(/* webpackChunkName: "SearchPageWithMap" */ /* webpackPrefetch: true */  '../containers/SearchPage/SearchPageWithMap'));
const SearchPageWithGrid = loadable(() => import(/* webpackChunkName: "SearchPageWithGrid" */ /* webpackPrefetch: true */  '../containers/SearchPage/SearchPageWithGrid'));
const StripePayoutPage = loadable(() => import(/* webpackChunkName: "StripePayoutPage" */ '../containers/StripePayoutPage/StripePayoutPage'));
const TermsOfServicePage = loadable(() => import(/* webpackChunkName: "TermsOfServicePage" */ '../containers/TermsOfServicePage/TermsOfServicePage'));
const TransactionPage = loadable(() => import(/* webpackChunkName: "TransactionPage" */ '../containers/TransactionPage/TransactionPage'));
const HelpCenterPage = loadable(() => import(/* webpackChunkName: "HelpCenterPage" */ '../containers/HelpCenterPage/HelpCenterPage'));
const BlogPage = loadable(() => import(/* webpackChunkName: "BlogPage" */ '../containers/BlogPage/BlogPage'));
const BlogArticlePage = loadable(() => import(/* webpackChunkName: "BlogArticlePage" */ '../containers/BlogArticlePage/BlogArticlePage'));
const BlogArticleSinglePage = loadable(() => import(/* webpackChunkName: "BlogArticleSinglePage" */ '../containers/BlogArticleSinglePage/BlogArticleSinglePage'));
const HelpDetailPage = loadable(() => import(/* webpackChunkName: "HelpDetailPage" */ '../containers/HelpDetailPage/HelpDetailPage'));
const BookingPage = loadable(() => import(/* webpackChunkName: "BookingPage" */ '../containers/BookingPage/BookingPage'));
const BecomeHostPage = loadable(() => import(/* webpackChunkName: "BecomeHostPage" */ '../containers/BecomeHostPage/BecomeHostPage'));
const PolicyPage = loadable(() => import(/* webpackChunkName: "PolicyPage" */ '../containers/PolicyPage/PolicyPage'));
const CancelPolicyPage = loadable(() => import(/* webpackChunkName: "CancelPolicyPage" */ '../containers/PolicyPage/CancelPolicyPage'));
const RefundPolicyPage = loadable(() => import(/* webpackChunkName: "RefundPolicyPage" */ '../containers/PolicyPage/RefundPolicyPage'));
const FaqPage = loadable(() => import(/* webpackChunkName: "FaqPage" */ '../containers/FaqPage/FaqPage'));
const ContactUsPage = loadable(() => import(/* webpackChunkName: "ContactUs" */ '../containers/ContactUsPage/ContactUsPage'));
const MarketPlacePage1 = loadable(() => import(/* webpackChunkName: "MarketPlace version 1" */ '../containers/MarketPlacePage1/MarketPlacePage1'));
const Experiences = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */ '../containers/Experiences/Experiences'));
const ListingDetailPage = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */ '../containers/ListingDetailPage/ListingDetailPage'));

// Dashboard
const ExperiencesHomePage = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */ '../containers/Dashboard/ExperiencesPages/ExperiencesHomePage'));
const ExperiencesExplorePage = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */ '../containers/Dashboard/ExperiencesPages/ExperiencesExplorePage'));
const BillingPage = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */ '../containers/Dashboard/BillingPages/BillingPage'));
const DashboardProfilePage = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */ '../containers/Dashboard/ProfilePages/ProfilePage'));
const DashboardUsersPage = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */ '../containers/Dashboard/UsersPage/UsersPage'));
const DashboardPollsPage = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */ '../containers/Dashboard/PollsPages/PollsPage'));
const DashboardPollsDetailPage = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */ '../containers/Dashboard/PollsPages/PollsDetailPage'));
const DashboardFavoriteDetailPage = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */ '../containers/Dashboard/FavouritePages/FavoriteDetailPage'));
const DashboardFavoriteResultsPage = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */ '../containers/Dashboard/FavouritePages/FavoriteResultsPage'));
const VirtualEscapeRoomPage = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */'../containers/Dashboard/ModalPages/VirtualEscapeRoomPage'));
const ConfirmationWizardPage = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */'../containers/Dashboard/ModalPages/WizardPage'));

// Dashboard Modal pages
const RSVPListPage = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */'../containers/Dashboard/RSVPListPages/RSVPListPage'));
const RSVPListConfirmedPage = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */'../containers/Dashboard/RSVPListPages/RSVPListConfirmedPage'));
const RSVPListProgressingPage = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */'../containers/Dashboard/RSVPListPages/RSVPListProgressingPage'));
const InviteGuestPage = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */'../containers/Dashboard/InviteGuestPage/InviteGuestPage'));

const BookingDateTimePage = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */ '../containers/BookingDatetimePage/BookingDatetimePage'));
const BookingPaymentPage = loadable(() => import(/* webpackChunkName: "MarketPlace version 2" */ '../containers/BookingPaymentPage/BookingPaymentPage'));

// Styleguide helps you to review current components and develop new ones
const StyleguidePage = loadable(() => import(/* webpackChunkName: "StyleguidePage" */ '../containers/StyleguidePage/StyleguidePage'));

export const ACCOUNT_SETTINGS_PAGES = [
  'ContactDetailsPage',
  'PasswordChangePage',
  'StripePayoutPage',
  'PaymentMethodsPage',
];

// https://en.wikipedia.org/wiki/Universally_unique_identifier#Nil_UUID
const draftId = '00000000-0000-0000-0000-000000000000';
const draftSlug = 'draft';

const RedirectToLandingPage = () => <NamedRedirect name="LandingPage" />;

// NOTE: Most server-side endpoints are prefixed with /api. Requests to those
// endpoints are indended to be handled in the server instead of the browser and
// they will not render the application. So remember to avoid routes starting
// with /api and if you encounter clashing routes see server/index.js if there's
// a conflicting route defined there.

// Our routes are exact by default.
// See behaviour from Routes.js where Route is created.
const routeConfiguration = (layoutConfig) => {
  const SearchPage = layoutConfig.searchPage?.variantType === 'map'
    ? SearchPageWithMap
    : SearchPageWithGrid;
  const ListingPage = layoutConfig.listingPage?.variantType === 'carousel'
    ? ListingPageCarousel
    : ListingPageCoverPhoto;

  return [
    {
      path: '/p/:pageId',
      name: 'CMSPage',
      component: CMSPage,
      loadData: pageDataLoadingAPI.CMSPage.loadData,
    },
    {
      path: '/s',
      name: 'SearchPage',
      component: SearchPage,
      loadData: pageDataLoadingAPI.SearchPage.loadData,
    },
    {
      path: '/l',
      name: 'ListingBasePage',
      component: RedirectToLandingPage,
    },
    {
      path: '/l/:slug/:id',
      name: 'ListingPage',
      component: ListingPage,
      loadData: pageDataLoadingAPI.ListingPage.loadData,
    },
    {
      path: '/l/:slug/:id/checkout',
      name: 'CheckoutPage',
      auth: true,
      component: CheckoutPage,
      setInitialValues: pageDataLoadingAPI.CheckoutPage.setInitialValues,
    },
    {
      path: '/l/:slug/:id/:variant',
      name: 'ListingPageVariant',
      auth: true,
      authPage: 'LoginPage',
      component: ListingPage,
      loadData: pageDataLoadingAPI.ListingPage.loadData,
    },
    {
      path: '/l/new',
      name: 'NewListingPage',
      auth: true,
      component: () => (
        <NamedRedirect
          name="EditListingPage"
          params={{ slug: draftSlug, id: draftId, type: 'new', tab: 'details' }}
        />
      ),
    },
    {
      path: '/l/:slug/:id/:type/:tab',
      name: 'EditListingPage',
      auth: true,
      component: EditListingPage,
      loadData: pageDataLoadingAPI.EditListingPage.loadData,
    },
    {
      path: '/l/:slug/:id/:type/:tab/:returnURLType',
      name: 'EditListingStripeOnboardingPage',
      auth: true,
      component: EditListingPage,
      loadData: pageDataLoadingAPI.EditListingPage.loadData,
    },

    // Canonical path should be after the `/l/new` path since they
    // conflict and `new` is not a valid listing UUID.
    {
      path: '/l/:id',
      name: 'ListingPageCanonical',
      component: ListingPage,
      loadData: pageDataLoadingAPI.ListingPage.loadData,
    },
    {
      path: '/u',
      name: 'ProfileBasePage',
      component: RedirectToLandingPage,
    },
    {
      path: '/u/:id',
      name: 'ProfilePage',
      component: ProfilePage,
      loadData: pageDataLoadingAPI.ProfilePage.loadData,
    },
    {
      path: '/profile-settings',
      name: 'ProfileSettingsPage',
      auth: true,
      authPage: 'LoginPage',
      component: ProfileSettingsPage,
    },

    // Note: authenticating with IdP (e.g. Facebook) expects that /login path exists
    // so that in the error case users can be redirected back to the LoginPage
    // In case you change this, remember to update the route in server/api/auth/loginWithIdp.js
    {
      path: '/login',
      name: 'LoginPage',
      component: AuthenticationPage,
      extraProps: { tab: 'login' },
    },
    {
      path: '/signup',
      name: 'SignupPage',
      component: AuthenticationPage,
      extraProps: { tab: 'signup' },
      loadData: pageDataLoadingAPI.AuthenticationPage.loadData,
    },
    {
      path: '/confirm',
      name: 'ConfirmPage',
      component: AuthenticationPage,
      extraProps: { tab: 'confirm' },
    },
    {
      path: '/recover-password',
      name: 'PasswordRecoveryPage',
      component: PasswordRecoveryPage,
    },
    {
      path: '/inbox',
      name: 'InboxBasePage',
      auth: true,
      authPage: 'LoginPage',
      component: () => <NamedRedirect name="InboxPage" params={{ tab: 'sales' }} />,
    },
    {
      path: '/inbox/:tab',
      name: 'InboxPage',
      auth: true,
      authPage: 'LoginPage',
      component: InboxPage,
      loadData: pageDataLoadingAPI.InboxPage.loadData,
    },
    {
      path: '/order/:id',
      name: 'OrderDetailsPage',
      auth: true,
      authPage: 'LoginPage',
      component: TransactionPage,
      extraProps: { transactionRole: 'customer' },
      loadData: (params, ...rest) =>
        pageDataLoadingAPI.TransactionPage.loadData({ ...params, transactionRole: 'customer' }, ...rest),
      setInitialValues: pageDataLoadingAPI.TransactionPage.setInitialValues,
    },
    {
      path: '/order/:id/details',
      name: 'OrderDetailsPageRedirect',
      auth: true,
      authPage: 'LoginPage',
      component: props => <NamedRedirect name="OrderDetailsPage" params={{ id: props.params?.id }} />,
    },
    {
      path: '/sale/:id',
      name: 'SaleDetailsPage',
      auth: true,
      authPage: 'LoginPage',
      component: TransactionPage,
      extraProps: { transactionRole: 'provider' },
      loadData: pageDataLoadingAPI.TransactionPage.loadData,
    },
    {
      path: '/sale/:id/details',
      name: 'SaleDetailsPageRedirect',
      auth: true,
      authPage: 'LoginPage',
      component: props => <NamedRedirect name="SaleDetailsPage" params={{ id: props.params?.id }} />,
    },
    {
      path: '/listings',
      name: 'ManageListingsPage',
      auth: true,
      authPage: 'LoginPage',
      component: ManageListingsPage,
      loadData: pageDataLoadingAPI.ManageListingsPage.loadData,
    },
    {
      path: '/account',
      name: 'AccountSettingsPage',
      auth: true,
      authPage: 'LoginPage',
      component: () => <NamedRedirect name="ContactDetailsPage" />,
    },
    {
      path: '/account/contact-details',
      name: 'ContactDetailsPage',
      auth: true,
      authPage: 'LoginPage',
      component: ContactDetailsPage,
      loadData: pageDataLoadingAPI.ContactDetailsPage.loadData,
    },
    {
      path: '/account/change-password',
      name: 'PasswordChangePage',
      auth: true,
      authPage: 'LoginPage',
      component: PasswordChangePage,
    },
    {
      path: '/account/payments',
      name: 'StripePayoutPage',
      auth: true,
      authPage: 'LoginPage',
      component: StripePayoutPage,
      loadData: pageDataLoadingAPI.StripePayoutPage.loadData,
    },
    {
      path: '/account/payments/:returnURLType',
      name: 'StripePayoutOnboardingPage',
      auth: true,
      authPage: 'LoginPage',
      component: StripePayoutPage,
      loadData: pageDataLoadingAPI.StripePayoutPage.loadData,
    },
    {
      path: '/account/payment-methods',
      name: 'PaymentMethodsPage',
      auth: true,
      authPage: 'LoginPage',
      component: PaymentMethodsPage,
      loadData: pageDataLoadingAPI.PaymentMethodsPage.loadData,
    },
    {
      path: '/terms-of-service',
      name: 'TermsOfServicePage',
      component: TermsOfServicePage,
      loadData: pageDataLoadingAPI.TermsOfServicePage.loadData,
    },
    {
      path: '/privacy-policy',
      name: 'PrivacyPolicyPage',
      component: PrivacyPolicyPage,
      loadData: pageDataLoadingAPI.PrivacyPolicyPage.loadData,
    },
    {
      path: '/styleguide',
      name: 'Styleguide',
      component: StyleguidePage,
    },
    {
      path: '/styleguide/g/:group',
      name: 'StyleguideGroup',
      component: StyleguidePage,
    },
    {
      path: '/styleguide/c/:component',
      name: 'StyleguideComponent',
      component: StyleguidePage,
    },
    {
      path: '/styleguide/c/:component/:example',
      name: 'StyleguideComponentExample',
      component: StyleguidePage,
    },
    {
      path: '/styleguide/c/:component/:example/raw',
      name: 'StyleguideComponentExampleRaw',
      component: StyleguidePage,
      extraProps: { raw: true },
    },
    {
      path: '/page-not-found',
      name: 'NotFoundPage',
      component: props => <NotFoundPage {...props} />,
    },

    // Do not change this path!
    //
    // The API expects that the application implements /reset-password endpoint
    {
      path: '/reset-password',
      name: 'PasswordResetPage',
      component: PasswordResetPage ,
    },

    // Do not change this path!
    //
    // The API expects that the application implements /verify-email endpoint
    {
      path: '/verify-email',
      name: 'EmailVerificationPage',
      auth: true,
      authPage: 'LoginPage',
      component: EmailVerificationPage,
      loadData: pageDataLoadingAPI.EmailVerificationPage.loadData,
    },
    // Do not change this path!
    //
    // The API expects that the application implements /preview endpoint
    {
      path: '/preview',
      name: 'PreviewResolverPage',
      component: PreviewResolverPage ,
    },
    // Custom Routings
    {
      path: '/',
      name: 'LandingPage',
      component: LandingPage,
      loadData: pageDataLoadingAPI.LandingPage.loadData,
    },
    {
      path: '/blog',
      name: 'BlogPage',
      component: BlogPage,
    },
    {
      path: '/blog/articles',
      name: 'BlogArticlePage',
      component: BlogArticlePage,
    },
    {
      path: '/blog/article',
      name: 'BlogArticleSinglePage',
      component: BlogArticleSinglePage,
    },
    {
      path: '/gethelp',
      name: 'ContactUsPage',
      component: ContactUsPage,
    },
    {
      path: '/helpcenter',
      name: 'HelpCenterPage',
      component: HelpCenterPage,
      loadData: pageDataLoadingAPI.HelpCenterPage.loadData,
    },
    {
      path: '/helpcenter/detail',
      name: 'HelpDetailPage',
      component: HelpDetailPage,
      loadData: pageDataLoadingAPI.HelpDetailPage.loadData,
    },
    {
      path: '/about-us',
      name: 'BookingPage',
      component: BookingPage,
      loadData: pageDataLoadingAPI.BookingPage.loadData,
    },
    {
      path: '/join-us',
      name: 'BecomeHostPage',
      component: BecomeHostPage,
      loadData: pageDataLoadingAPI.BecomeHostPage.loadData,
    },
    {
      path: '/privacy-policy',
      name: 'PolicyPage',
      component: PolicyPage,
      loadData: pageDataLoadingAPI.PolicyPage.loadData,
    },
    {
      path: '/policy/cancel',
      name: 'CancelPolicyPage',
      component: CancelPolicyPage,
      loadData: pageDataLoadingAPI.PolicyPage.loadData,
    },
    {
      path: '/refund-policy',
      name: 'RefundPolicyPage',
      component: RefundPolicyPage,
      loadData: pageDataLoadingAPI.PolicyPage.loadData,
    },
    {
      path: '/faq',
      name: 'FaqPage',
      component: FaqPage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    // {
    //   path: '/marketplace1',
    //   name: 'MarketPlacePage1',
    //   component: MarketPlacePage1,
    //   loadData: pageDataLoadingAPI.FaqPage.loadData,
    // },
    {
      path: '/experiences/category',
      name: 'ExperiencesPage',
      component: Experiences,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    {
      path: '/listingdetail',
      name: 'ListingDetailPage',
      component: ListingDetailPage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    {
      path: '/bookingdetail/datetime',
      name: 'BookingDatetimePage',
      component: BookingDateTimePage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    {
      path: '/bookingdetail/payment',
      name: 'BookingPaymentPage',
      component: BookingPaymentPage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    {
      path: '/dashboard/experiences',
      name: 'ExperiencesHomePage',
      component: ExperiencesHomePage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    {
      path: '/dashboard/experiences/explore',
      name: 'ExperiencesExplorePage',
      component: ExperiencesExplorePage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    {
      path: '/dashboard/modal/rsvp_list',
      name: 'RSVPListPage',
      component: RSVPListPage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    {
      path: '/dashboard/modal/rsvp_confirmed',
      name: 'RSVPListConfirmedPage',
      component: RSVPListConfirmedPage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    {
      path: '/dashboard/modal/rsvp_progressing',
      name: 'RSVPListProgressingPage',
      component: RSVPListProgressingPage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    {
      path: '/dashboard/modal/virtual_esc_room',
      name: 'VirtualEscapeRoomPage',
      component: VirtualEscapeRoomPage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    {
      path: '/dashboard/modal/status',
      name: 'ConfirmationWizardPage',
      component: ConfirmationWizardPage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    {
      path: '/dashboard/modal/invite',
      name: 'InviteGuestPage',
      component: InviteGuestPage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    {
      path: '/dashboard/billing',
      name: 'BillingPage',
      component: BillingPage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    {
      path: '/dashboard/profile',
      name: 'DashboardProfilePage',
      component: DashboardProfilePage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    {
      path: '/dashboard/users',
      name: 'DashboardUsersPage',
      component: DashboardUsersPage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    {
      path: '/dashboard/polls/explore',
      name: 'DashboardPollsPage',
      component: DashboardPollsPage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    {
      path: '/dashboard/polls',
      name: 'DashboardPollsDetailPage',
      component: DashboardPollsDetailPage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    {
      path: '/dashboard/favourites',
      name: 'DashboardFavoriteDetailPage',
      component: DashboardFavoriteDetailPage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
    {
      path: '/dashboard/favourites/search',
      name: 'DashboardFavoriteResultsPage',
      component: DashboardFavoriteResultsPage,
      loadData: pageDataLoadingAPI.FaqPage.loadData,
    },
  ];
};

export default routeConfiguration;
