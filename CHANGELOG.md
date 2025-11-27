# Change Log

We are not following semantic versioning in this template app since any change could potentially be
a breaking change for forked customization projects. We are still experimenting with what is a good
way to update this template, but currently, we follow a pattern:

- Major version change (v**X**.0.0): Changes to several pages and other components. Consider
  implementing this without merging upstream (we'll provide instructions).
- Minor version change (v0.**X**.0): New features and changes to a single page. These are likely to
  cause conflicts.
- Patch (v0.0.**X**): Bug fixes and small changes to components.

---

## Upcoming version 2025-XX-XX

- [add] Add accessibility improvements (Modals, filters, etc.).
  [#716](https://github.com/sharetribe/web-template/pull/716)
- [change] Upgrade Sharetribe SDK to 1.22.0.
  [#715](https://github.com/sharetribe/web-template/pull/715)
- [fix] ListingPageCoverPhoto: fix payoutDetailsWarning message.
  [#714](https://github.com/sharetribe/web-template/pull/714)
- [fix] AuthenticationPage: fix a bug with long words in the title on mobile layout.
  [#711](https://github.com/sharetribe/web-template/pull/711)
- [add] Add currently available translations for DE, ES, FR.
  [#710](https://github.com/sharetribe/web-template/pull/710)

## [v10.3.0] 2025-11-20

- [add] Add currently available translations for DE, ES, FR.
  [#708](https://github.com/sharetribe/web-template/pull/708)
- [add] Add support for Console-configured private custom user fields
  [#700](https://github.com/sharetribe/web-template/pull/700)
- [change] make crossorigin attributes have an explicit default value.
  [#703](https://github.com/sharetribe/web-template/pull/703)
- [fix] LocationAutocompleteInputImpl: do not select current location automatically if it is the
  only prediction. [#704](https://github.com/sharetribe/web-template/pull/704)
- [add] Add currently available translations for DE, ES, FR.
  [#706](https://github.com/sharetribe/web-template/pull/706)

[v10.3.0]: https://github.com/sharetribe/web-template/compare/v10.2.0...v10.3.0

## [v10.2.0] 2025-11-19

- [add] Added ability to delete user account in a new account settings page.
  [#660](https://github.com/sharetribe/web-template/pull/660/)
- [change] SignupForm: check that the password is not copy-pasted to other fields.
  [#702](https://github.com/sharetribe/web-template/pull/702)
- [fix] ManageListingsPage.duck.js: fix a bug with pagination links not being rendered.
  [#701](https://github.com/sharetribe/web-template/pull/701)
- [add] Additional accesibility improvements to text and icon colors in search CTA.
  [#696](https://github.com/sharetribe/web-template/pull/696)
- [add] Improve template accessibility further

  - Improved contrast for various colors throughout the Template
  - Increased area around clickable elements
  - Updated various component roles

  [#691](https://github.com/sharetribe/web-template/pull/691)

  [v10.2.0]: https://github.com/sharetribe/web-template/compare/v10.1.2...v10.2.0

## [v10.1.2] 2025-11-10

- [fix] ListingPage.duck.js: fix a bug with time slots fetching. This affects bookable listings with
  hour or fixed durations. [#697](https://github.com/sharetribe/web-template/pull/697)
- [add] Add currently available translations for DE, ES, FR.
  [#695](https://github.com/sharetribe/web-template/pull/695)

  [v10.1.2]: https://github.com/sharetribe/web-template/compare/v10.1.1...v10.1.2

## [v10.1.1] 2025-11-06

- [fix] RequestQuotePage: pass authorDisplayName to RequestQuoteForm.
  [#693](https://github.com/sharetribe/web-template/pull/693)

  [v10.1.1]: https://github.com/sharetribe/web-template/compare/v10.1.0...v10.1.1

## [v10.1.0] 2025-11-06

- [add] Add support for regular negotiation flow where provider creates listings representing offers
  (e.g. projects) and customer can request for a quote.
  [#685](https://github.com/sharetribe/web-template/pull/685)
- [fix] Add line break to TopbarMobileMenu.signupOrLogin translation
  [#690](https://github.com/sharetribe/web-template/pull/690)

  [v10.1.0]: https://github.com/sharetribe/web-template/compare/v10.0.0...v10.1.0

## [v10.0.0] 2025-11-04

This major release introduces Redux Toolkit for state management. This is a big change and you
should carefully check the changes before taking update from this repository.

- [change] Start using Redux Toolkit for state management.

  - All the \*.duck.js files have been converted to Redux Toolkit slices.
  - The signature of 'configureStore' function has been changed.

  [#682](https://github.com/sharetribe/web-template/pull/682)

- [fix] Added missing getAriaLabel to various components used in Styleguide
  [#687](https://github.com/sharetribe/web-template/pull/687)
- [add] Add noindex metadata to closed listings.
  [#688](https://github.com/sharetribe/web-template/pull/688)
- [fix] coordinate parsing: "-0" was not parsed correctly to Number.
  [#686](https://github.com/sharetribe/web-template/pull/686)
- [fix] showPaymentDetailsForUser: handle case when currentUser is null.
  [#684](https://github.com/sharetribe/web-template/pull/684)
- [add] Add currently available translations for DE, ES, FR.
  [#683](https://github.com/sharetribe/web-template/pull/683)
- [fix] Only set TransactionPage pageHeading if processName resolves
  [#681](https://github.com/sharetribe/web-template/pull/681)

  [v10.0.0]: https://github.com/sharetribe/web-template/compare/v9.1.0...v10.0.0

## [v9.1.0] 2025-10-23

- [add] Improve template accessibility

  - Improve contrast in grey texts
  - Add translations for aria-labels
  - Unify page title and heading texts

  [#673](https://github.com/sharetribe/web-template/pull/673)

- [change] Update browserlist-db aka caniuse-lite.
  [#679](https://github.com/sharetribe/web-template/pull/679)
- [add] Add currently available translations for DE, ES, FR.
  [#678](https://github.com/sharetribe/web-template/pull/678)
- [fix] BookingDateRangeFilter: don't add focus to the current date on mount.
  [#677](https://github.com/sharetribe/web-template/pull/677)
- [fix] Fix a bug with coordinate values in the URL.
  [#676](https://github.com/sharetribe/web-template/pull/676)
- [fix] Fix some Marketplace texts. [#675](https://github.com/sharetribe/web-template/pull/675)

  [v9.1.0]: https://github.com/sharetribe/web-template/compare/v9.0.0...v9.1.0

## [v9.0.0] 2025-10-14

This major release introduces a new transaction process: default-negotiation. It adds support for
reverse negotiation with customer-driven negotiation loop. The process is meant for regular
negotiation too - we'll implement that side later. This is a big change and it touches also features
used by other processes - you should carefully check the changes before taking update from this
repository.

- [add] Add a new process: default-negotiation. There are also 2 new unit types associated with this
  new process: request and offer.With those unit types, this process can be used for regular and
  reverse negotiation, but this pull request only implments the reverse negotiation (unitType:
  request) with customer-driven negotiation loop.
  [#648](https://github.com/sharetribe/web-template/pull/648)

- [fix] IntegerRangeFilter & PriceFilter: add faulty mode for input elements.
  [#670](https://github.com/sharetribe/web-template/pull/670)
- [fix] CheckoutPageWithPayment: don't show location if it's unknown for bookings.
  [#671](https://github.com/sharetribe/web-template/pull/671)
- [add] Update README about translation files.
  [#668](https://github.com/sharetribe/web-template/pull/668)
- [add] Add currently available translations for DE, ES.
  [#666](https://github.com/sharetribe/web-template/pull/666)
- [add] Add currently available translations for DE, ES, FR.
  [#664](https://github.com/sharetribe/web-template/pull/664)

  [v9.0.0]: https://github.com/sharetribe/web-template/compare/v8.8.0...v9.0.0

## [v8.8.0] 2025-09-11

- [add] Add ability to sort user inbox messages
  [#656](https://github.com/sharetribe/web-template/pull/656)
- [add] Update one Marketplace text (to be aligned with the corresponding copy in Email texts).
  [#661](https://github.com/sharetribe/web-template/pull/661)
- [add] Add currently available translations for DE, ES, FR.
  [#658](https://github.com/sharetribe/web-template/pull/658)
- [add] Add accessibility improvements to components related to

  - search pages
  - listing page
  - listing editing pages
  - transaction page

  [#649](https://github.com/sharetribe/web-template/pull/649)

- [change] Remove pickup fee line-item from the order breakdown.
  [#655](https://github.com/sharetribe/web-template/pull/655)
- [add] Update EditListingPage README.md to describe the data gathered and updated.
  [#654](https://github.com/sharetribe/web-template/pull/654)
- [fix] SearchPage.shared.js: category ids are always strings, so we need to convert query params to
  strings. [#653](https://github.com/sharetribe/web-template/pull/653)
- [fix] SearchPage: fix a bug with integer range values. The range end value was not exclusive.
  [#652](https://github.com/sharetribe/web-template/pull/652)
- [fix] IntegerRangeFilter: fix a bug with small text on grid layout.
  [#650](https://github.com/sharetribe/web-template/pull/650)

- [add] render potential errors in EditListingStylePanel.
  [#647](https://github.com/sharetribe/web-template/pull/647)

  [v8.8.0]: https://github.com/sharetribe/web-template/compare/v8.7.0...v8.8.0

## [v8.7.0] 2025-07-30

- [add] Add currently available translations for DE, ES, FR.
  [#644](https://github.com/sharetribe/web-template/pull/644)
- [add] Added support for Provider and Customer minimum commission handling
  [#631](https://github.com/sharetribe/web-template/pull/635)
- [add] Add some accessibility improvements to Topbar, Footer, and AuthenticationPage.
  [#639](https://github.com/sharetribe/web-template/pull/639)
- [add] Add currently available translations for DE, ES, FR.
  [#641](https://github.com/sharetribe/web-template/pull/641)
- [fix] SearchPageWithMap: existing pagination page needs to be reset with map-based search. When
  bounds change, the search results are different and the previous pagination page number is not
  valid anymore. [#640](https://github.com/sharetribe/web-template/pull/640)

  [v8.7.0]: https://github.com/sharetribe/web-template/compare/v8.6.0...v8.7.0

## [v8.6.0] 2025-07-17

- [fix] EditListingDeliveryPanel: additional shipping fee was not asked and the related shipping fee
  was missing, when selecting multiple items.
  [#636](https://github.com/sharetribe/web-template/pull/636)
- [add] Add support for listing types that do not require images.
  [#624](https://github.com/sharetribe/web-template/pull/624)
- [fix] Remove mentions to legacy templates from README.md
  [#630](https://github.com/sharetribe/web-template/pull/630)
- [fix] Small fixes

  - [fix] Renamed onRecoverableError param
  - [add] Improved schema for ProfilePage
  - [add] Added role, aria-label, and titles to social media icons
  - [change] Limited editing and added communication for operators using the 'log-in as' feature
  - [fix] Removed additional padding on primary integer filters
  - [fix] Added word-break to Message and OwnMessage in ActivityFeed.js

  [#631](https://github.com/sharetribe/web-template/pull/631)

  [v8.6.0]: https://github.com/sharetribe/web-template/compare/v8.5.0...v8.6.0

## [v8.5.0] 2025-06-10

- [add] Add conditional visibility for the following elements depending on Console configuration:

  - Visibility for create listings links for unauthenticated users configured in Top bar
  - Visibility for elements configured in User types:
    - Create listings and Manage listings links
    - Payment method and payout detail tab links
    - Inbox links for orders and sales
    - Profile page review tabs

  [#614](https://github.com/sharetribe/web-template/pull/614)

- [fix] Fix an issue with the date filter in the Search CTA component, which was not observing
  nightly search configuration correctly.[#625](https://github.com/sharetribe/web-template/pull/625)

[v8.5.0]: https://github.com/sharetribe/web-template/compare/v8.4.2...v8.5.0

## [v8.4.2] 2025-06-02

- [fix] Set the font size for the input fields in the Search as CTA component to 16px to prevent
  unintentional zooming on mobile.[#622](https://github.com/sharetribe/web-template/pull/622)
- [fix] BookingFixedDurationForm: start time generation didn't count consecutive time-slots
  correctly when multiple seats were allowed.
  [#620](https://github.com/sharetribe/web-template/pull/620)
- [add] Improve one copy text. [#621](https://github.com/sharetribe/web-template/pull/621)
- [add] Add currently available translations for DE, ES, FR.
  [#619](https://github.com/sharetribe/web-template/pull/619)

  [v8.4.2]: https://github.com/sharetribe/web-template/compare/v8.4.1...v8.4.2

## [v8.4.1] 2025-05-26

- [fix] Modify two translation keys that were using an incorrect namespace.
  [#617](https://github.com/sharetribe/web-template/pull/617)
- [fix] Add missing location prop to grid search page
  [#615](https://github.com/sharetribe/web-template/pull/615)
- [fix] Corrected anchor link scrolling behavior on Privacy Policy and Terms of Service pages, when
  opened as modals (in signup/login). [#612](https://github.com/sharetribe/web-template/pull/612)

  [v8.4.1]: https://github.com/sharetribe/web-template/compare/v8.4.0...v8.4.1

## [v8.4.0] 2025-05-20

- [add] Added a "Search as CTA" component for embedding a search bar on any dynamic content page
  [#561](https://github.com/sharetribe/web-template/pull/561)
- [add] Pass email from login to forgot password
  [#609](https://github.com/sharetribe/web-template/pull/609)
- [fix] EditListingPhotosForm: removing all images from a listing caused the screen to go blank
  [#608](https://github.com/sharetribe/web-template/pull/608)

  [v8.4.0]: https://github.com/sharetribe/web-template/compare/v8.3.2...v8.4.0

## [v8.3.2] 2025-05-12

- [fix] SearchPageWithMap: secondary filter count was not taking into use filters that were limited
  to category or listing type [#606](https://github.com/sharetribe/web-template/pull/606)
- [fix] Handle multiple search page routes outside search page and clarify path param usage
  [#605](https://github.com/sharetribe/web-template/pull/605)

  [v8.3.2]: https://github.com/sharetribe/web-template/compare/v8.3.1...v8.3.2

## [v8.3.1] 2025-05-06

- [fix] Fix listing type path param usage
  [#599](https://github.com/sharetribe/web-template/pull/599)
- [fix] Avatar: use correct pending-approval variant link when user is pending approval.
  [#601](https://github.com/sharetribe/web-template/pull/601)
- [add] Add currently available translations for DE, ES, FR.
  [#597](https://github.com/sharetribe/web-template/pull/597)

  [v8.3.1]: https://github.com/sharetribe/web-template/compare/v8.3.0...v8.3.1

## [v8.3.0] 2025-04-30

- [add] Add support to search pages for filtering listing search based on listing type
  [#583](https://github.com/sharetribe/web-template/pull/583)
- [fix] BookingFixedDurationForm: undefined booking length with single fixed price variant.
  [#595](https://github.com/sharetribe/web-template/pull/595)
- [fix] EditListingPricingPanel: Add initial value for the startTimeInterval.
  [#594](https://github.com/sharetribe/web-template/pull/594)
- [add] Add currently available translations for DE, ES, FR.
  [#593](https://github.com/sharetribe/web-template/pull/593)

  [v8.3.0]: https://github.com/sharetribe/web-template/compare/v8.2.0...v8.3.0

## [v8.2.0] 2025-04-29

- [add] Check that some of the environment variables are set (and crash the app if not):

  - REACT_APP_SHARETRIBE_SDK_CLIENT_ID
  - SHARETRIBE_SDK_CLIENT_SECRET
  - REACT_APP_MARKETPLACE_NAME
  - REACT_APP_MARKETPLACE_ROOT_URL

  [#589](https://github.com/sharetribe/web-template/pull/589)

- [add] Separate translation keys for listing with price variations. This affects ListingCard,
  ManageListingCard, SearchMapInfoCard, SearchMapPriceLabel.
  [#591](https://github.com/sharetribe/web-template/pull/591)
- [fix] Convert non-string category URL param to string
  [#590](https://github.com/sharetribe/web-template/pull/590)
- [add] Add currently available translations for DE, ES, FR.
  [#587](https://github.com/sharetribe/web-template/pull/587)

  [v8.2.0]: https://github.com/sharetribe/web-template/compare/v8.1.0...v8.2.0

## [v8.1.0] 2025-04-24

- [add] Add support for price variations for bookable listings.
  [#582](https://github.com/sharetribe/web-template/pull/582)
- [add] Add currently available translations for DE, ES.
  [#584](https://github.com/sharetribe/web-template/pull/584)
- [change] update deeply nested dependency: path-to-regexp
  [#580](https://github.com/sharetribe/web-template/pull/580)
- [fix] SectionDetails (ListingPage & ProfilePage): fix line-height and padding for the details row.
  [#576](https://github.com/sharetribe/web-template/pull/576)
- [fix] OrderPanel: purchase and inquiries did not check closed status of the listing.
  [#573](https://github.com/sharetribe/web-template/pull/573)

  [v8.1.0]: https://github.com/sharetribe/web-template/compare/v8.0.1...v8.1.0

## [v8.0.1] 2025-04-03

- [add] Add currently available translations for FR.
  [#571](https://github.com/sharetribe/web-template/pull/571)
- [change] Remove Google Maps legacy Places API support
  [#570](https://github.com/sharetribe/web-template/pull/569)
- [fix] Topbar/LinksMenu: align the menu label correctly.
  [#569](https://github.com/sharetribe/web-template/pull/569)
- [fix] BookingFixedDurationForm: form was using wrong translation keys.
  [#568](https://github.com/sharetribe/web-template/pull/568)
- [fix] Fix the transition of the SavedCardDetails menu.
  [#567](https://github.com/sharetribe/web-template/pull/567)

  [v8.0.1]: https://github.com/sharetribe/web-template/compare/v8.0.0...v8.0.1

## [v8.0.0] 2025-03-26

This major release adds support for bookings with a fixed duration. The feature is touching so many
parts of the codebase, that we decided to bump the major version.

- [add] Add support for bookings with a fixed duration.
  [#560](https://github.com/sharetribe/web-template/pull/560)
- [fix] Fix the positioning of the camera control otpions on Google Maps
  [#565](https://github.com/sharetribe/web-template/pull/565)
- [fix] Fix currently available translations for FR.
  [#559](https://github.com/sharetribe/web-template/pull/559)

  [v8.0.0]: https://github.com/sharetribe/web-template/compare/v7.3.0...v8.0.0

## [v7.3.0] 2025-02-19

- [fix] Remove obsolete Flex CLI references
  [#550](https://github.com/sharetribe/web-template/pull/550)
- [fix] BookingTimeForm (hourly booking): calendar day was not localized causing isDayBlocked fn to
  choose past day, if listing's time zone was to the west of the browser's location / time zone.
  [#556](https://github.com/sharetribe/web-template/pull/556)
- [fix] AuthenticationPage: fix a bug with autenticated users accessing the auth pages.
  [#555](https://github.com/sharetribe/web-template/pull/555)
- [fix] CheckoutPageWithPayment & PaymentMethodsPage had a typo in a variable name.
  [#554](https://github.com/sharetribe/web-template/pull/554)
- [fix] DatePicker: fix a bug with the calendar transition.
  [#553](https://github.com/sharetribe/web-template/pull/553)
- [add] Add fixed bookings and price variant name support to booking process email templates.
  [#552](https://github.com/sharetribe/web-template/pull/552)
- [fix] LocationAutocompleteInput: fix a bug with Google Maps API loading order with Webpack Dev
  Server. [#548](https://github.com/sharetribe/web-template/pull/548)

  [v7.3.0]: https://github.com/sharetribe/web-template/compare/v7.2.0...v7.3.0

## [v7.2.0] 2025-01-30

- [add] Add support for the new Google Places API
  [#539](https://github.com/sharetribe/web-template/pull/539)
- [fix] SearchPageWithMap: duplicate class caused positioning issue on localhost:3000.
  [#546](https://github.com/sharetribe/web-template/pull/546)
- [fix] TopbarDesktop: fix a typo (non-existent element attribute), when the search form was not
  shown. [#545](https://github.com/sharetribe/web-template/pull/545)
- [change] priceForSchemaMaybe: render offer price when price is 0. This helps customizations, but
  it's not enough for no-code features to support 0 price for inquiries.
  [#544](https://github.com/sharetribe/web-template/pull/544)
- [fix] TabNavHorizontal: Dark skin tab focus styles overriding hover font color.
  [#543](https://github.com/sharetribe/web-template/pull/543)
- [fix] Private marketplace: allow search crawlers to access the `/sitemap` route.
  [#541](https://github.com/sharetribe/web-template/pull/541)

  [v7.2.0]: https://github.com/sharetribe/web-template/compare/v7.1.0...v7.2.0

## [v7.1.0] 2025-01-23

- [add] Add support for hiding the Topbar search based on configuration.
  [#531](https://github.com/sharetribe/web-template/pull/531)
- [fix] TransactionPage: fetchMonthlyTimeSlots didn't work correctly with day unitType.
  [#536](https://github.com/sharetribe/web-template/pull/536)
- [change] Google's search schema requires a price that uses dot as decimal separator.
  [#535](https://github.com/sharetribe/web-template/pull/535)

  [v7.1.0]: https://github.com/sharetribe/web-template/compare/v7.0.0...v7.1.0

## [v7.0.0] 2025-01-15

This major release takes the React v18.3.1 into use.

- [fix] EditListingWizard: fix a bug with YouTube field.
  [#533](https://github.com/sharetribe/web-template/pull/533)
- [fix] CustomExtendedDataField.module.css: add missing customMediaQuery import.
  [#532](https://github.com/sharetribe/web-template/pull/532)
- [change] This updates Sharetribe Web Template to use React v18 (v18.3.1). Some highlights:

  - Several dependency libraries have been updated.
  - Hydration is much more strict now. First render on client-side must match the server-side
    render.

  [#523](https://github.com/sharetribe/web-template/pull/523)

- [add] Add currently available translations for DE.
  [#529](https://github.com/sharetribe/web-template/pull/529)
- [fix] a link inside the inquiry message was invisible for the sender of the inquiry.
  [#528](https://github.com/sharetribe/web-template/pull/528)
- [add] Add currently available translations for DE, ES, FR.
  [#527](https://github.com/sharetribe/web-template/pull/527)
- [fix] AvailabilityPlanForm had a hard-coded "Delete" text.
  [#525](https://github.com/sharetribe/web-template/pull/525)
- [add] Add currently available translations for DE, ES, FR.
  [#524](https://github.com/sharetribe/web-template/pull/524)
- [change] Update the wording of the numberTooSmall error message for consistency.
  [#522](https://github.com/sharetribe/web-template/pull/522)

  [v7.0.0]: https://github.com/sharetribe/web-template/compare/v6.3.0...v7.0.0

## [v6.3.0] 2025-01-08

- [fix] fix a bug with seats handling in email templates.
  [#518](https://github.com/sharetribe/web-template/pull/518)
- [add] Add support for using multiple seats on default-booking process.
  [#502](https://github.com/sharetribe/web-template/pull/502)
- [fix] ListingPageVariant: the #author anchor was not pointing to ListingPageVariant.
  [#515](https://github.com/sharetribe/web-template/pull/515)
- [fix] target element didn't seem to work well with scroll-margin.
  [#513](https://github.com/sharetribe/web-template/pull/513)
- [change] Require account type when creating a Stripe account
  [#512](https://github.com/sharetribe/web-template/pull/512)
- [add] Add currently available translations for DE, ES, FR.
  [#511](https://github.com/sharetribe/web-template/pull/511)

  [v6.3.0]: https://github.com/sharetribe/web-template/compare/v6.2.0...v6.3.0

## [v6.2.0] 2024-11-26

- [add] Remove bank account collection from the template, so that it is collected in the Stripe
  Onboarding flow instead. [#470](https://github.com/sharetribe/web-template/pull/470)
- [add] Add currently available translations for DE, ES, FR.
  [#508](https://github.com/sharetribe/web-template/pull/508)
- [add] Add support for currencies not supported by Stripe in inquiry processes.
  [#493](https://github.com/sharetribe/web-template/pull/493)
- SingeDatePicker: don't update value to dateData if it has the same timestamp has not changed.
  [#507](https://github.com/sharetribe/web-template/pull/507)
- [change] Node v23.2 is failing. This adds engine rule for node (">=18.20.1 <23.2.0") for now.
  [#505](https://github.com/sharetribe/web-template/pull/505)
- [change] Update mapbox-gl-js (v1.0.0 => v3.7.0) and mapbox-sdk-js (0.6.0 => 0.16.1) Note: Mapbox
  license changed in v2 (and pricing for non-mapbox related map tiles)
  https://github.com/mapbox/mapbox-gl-js/releases/tag/v2.0.0

  [#488](https://github.com/sharetribe/web-template/pull/488)

- [change] Update default email template copy texts
  [#501](https://github.com/sharetribe/web-template/pull/501)
- [fix] ConfirmSignupForm: show spinner. (Handling for confirmInProgress state was missing.)
  [#504](https://github.com/sharetribe/web-template/pull/504)
- [fix] Topbar: if multiple custom links has the same text, the virtual DOM is confused.
  [#502](https://github.com/sharetribe/web-template/pull/502)
- [fix] PaymentMethodsPage: full page load did not fetch defaultPaymentMethod.
  [#500](https://github.com/sharetribe/web-template/pull/500)
- [change] Relax the Referrer-Policy to "origin".
  [#498](https://github.com/sharetribe/web-template/pull/498)
- [fix] Open discard modal on ManageListingsPage only if scrolling is disabled. Fixes an issue where
  opening the discard draft modal on mobile scrolled the page to the very bottom.
  [#497](https://github.com/sharetribe/web-template/pull/497)

  [v6.2.0]: https://github.com/sharetribe/web-template/compare/v6.1.0...v6.2.0

## [v6.1.0] 2024-11-06

- [add] Add currently available translations for DE, ES, FR.
  [#495](https://github.com/sharetribe/web-template/pull/495)
- [add] Add support for discarding draft listings on ManageListingsPage
  [474](https://github.com/sharetribe/web-template/pull/474)
- [fix] ManageListingCard: Menu has a regression bug on mobile layout. Note: if Menu component needs
  to use full screenwidth on mobile, add preferScreenWidthOnMobile.
  [#494](https://github.com/sharetribe/web-template/pull/494)
- [change] Refactor SingleDatePicker and DateRangePicker by combining date and its formatting. It
  updates dateData if passed-in input value changes.
  [#492](https://github.com/sharetribe/web-template/pull/492)

  [v6.1.0]: https://github.com/sharetribe/web-template/compare/v6.0.1...v6.1.0

## [v6.0.1] 2024-11-01

- [fix] GA4 integration had a copy-paste bug.
  [#489](https://github.com/sharetribe/web-template/pull/489)
- [fix] FieldDateTimeInput.module.css: fix typo.
  [#487](https://github.com/sharetribe/web-template/pull/487)
- [change] Update default email templates to use ICU's `j` pattern for datetimes.
  [#478](https://github.com/sharetribe/web-template/pull/478)
- [change] Update default email templates to get link and button colors from asset.
  [#478](https://github.com/sharetribe/web-template/pull/478)

  [v6.0.1]: https://github.com/sharetribe/web-template/compare/v6.0.0...v6.0.1

## [v6.0.0] 2024-10-29

This major release takes the React v17.0.2 into use.

The biggest change is taking a new DatePicker into use and removing the outdated datepicker library:
React Dates. The change was necessary as the React Dates still uses deprecated React life cycle
functions componentWillReceiveProps & componentWillUpdate.

Another notable change with the React v17 was with the callback functions of useEffect hook, which
became asynchronous. You should to check other v17 changes from v17 changelog to verify if your
customizations are affected somehow.

The last highlight is that we started to use nonce for script-src on Content Security Policy.

- [change] This updates Sharetribe Web Template to use React v17.0.2.

  Some highlights:

  - The callback functions of **_useEffect_ hook** has become asynchronous!
  - There has been changes to event delegation on React component tree.

    - https://legacy.reactjs.org/blog/2020/10/20/react-v17.html#changes-to-event-delegation
    - This change didn't seem to have practical consequences on this repository.

  [#477](https://github.com/sharetribe/web-template/pull/477)

- [add] CSP: start using nonce with script-src. This also removes data from script-src.
  [#485](https://github.com/sharetribe/web-template/pull/485)
- [add] Remove React Dates datepicker library and add a new built-in DatePicker.

  There are 3 new datepicker fields to be used with React Final Forms:

  - FieldDateRangePicker
  - FieldSingleDatePicker
  - FieldDateRangeController

  This swap is done because componentWillReceiveProps & componentWillUpdate functions, which are
  used by the outdated React Dates library, are deprecated and removed from future React versions.

  [#453](https://github.com/sharetribe/web-template/pull/453)

- [fix] UserCard: make the styles of contact link consistent with the other links.
  [#484](https://github.com/sharetribe/web-template/pull/484)
- [fix] CheckoutPage.duck.js: fix minor typo with handleSuccess function.
  [#483](https://github.com/sharetribe/web-template/pull/483)
- [add] Filter out bot requests that scan websites for vulnerabilities before they reach React app.
  [#479](https://github.com/sharetribe/web-template/pull/479)
- [change] Update copy text for Publishing listing permission to Posting listing.
  [#482](https://github.com/sharetribe/web-template/pull/482)

  [v6.0.0]: https://github.com/sharetribe/web-template/compare/v5.8.0...v6.0.0

## [v5.8.0] 2024-10-22

- [add] Add currently available translations for DE, ES, FR.
  [#475](https://github.com/sharetribe/web-template/pull/475)
- [add] Block images can be wrapped in a link if a link is configured via assets.
  [#464](https://github.com/sharetribe/web-template/pull/464)
- [add] Add support for aligning content blocks based on asset
  [#469](https://github.com/sharetribe/web-template/pull/469)
- [add] Update moment-timezone library to v0.5.46.
  [#472](https://github.com/sharetribe/web-template/pull/472)
- [add] Update caniuselite, which is used by browserlist.
  [#471](https://github.com/sharetribe/web-template/pull/471)
- [add] Add support for the youtubeVideoUrl schema type: listingPage and profilePage can now display
  an embedded Youtube video [#467](https://github.com/sharetribe/web-template/pull/467)
- [add] Add currently available translations for DE, ES, FR.
  [#466](https://github.com/sharetribe/web-template/pull/466)

  [v5.8.0]: https://github.com/sharetribe/web-template/compare/v5.7.0...v5.8.0

## [v5.7.0] 2024-10-08

- [add] Access control: Viewing rights.

  When a user's viewing rights have been revoked:

  - SearchPage redirects to NoAccessPage
  - ListingPage redirects to NoAccessPage unless the user is viewing their own listing. Reviews are
    not displayed.
  - ProfilePage redirects to NoAccessPage unless the user is viewing their own profile. Reviews are
    not displayed.
  - TransactionPage does not show the OrderPanel for transactions at the inquiry state of booking or
    purchase processes.

  [#459](https://github.com/sharetribe/web-template/pull/459)

  [v5.7.0]: https://github.com/sharetribe/web-template/compare/v5.6.1...v5.7.0

## [v5.6.1] 2024-10-07

- [fix] Updated JSON asset schema structure from Console: Removed the enabled field, now using only
  the type attribute for CTA status.
- [add] Add currently available translations for DE, ES, FR.
  [#461](https://github.com/sharetribe/web-template/pull/461)

  [v5.6.1]: https://github.com/sharetribe/web-template/compare/v5.6.0...v5.6.1

## [v5.6.0] 2024-10-01

- [add] Add support for CTAs on NoAccessPage
  [#455](https://github.com/sharetribe/web-template/pull/455)
- [add] Add currently available translations for DE, ES, FR.
  [#458](https://github.com/sharetribe/web-template/pull/458)
- [fix] Topbar: malformed custom link causes a 500 error on server.
  [#457](https://github.com/sharetribe/web-template/pull/457)
- [fix] ListingPage.shared.js: import for convertMoneyToNumber was not made for priceForSchemaMaybe
  function. [#456](https://github.com/sharetribe/web-template/pull/456)
- [add] Access control: Transaction rights

  - When a user does not have the "initiateTransactions" permission in their
    `effectivePermissionSet` relationship and they try to initiate an order or send an inquiry, they
    are redirected to the NoAccessPage.

  [#450](https://github.com/sharetribe/web-template/pull/450)

- [fix] InquiryForm: test code was committed earlier.
  [#452](https://github.com/sharetribe/web-template/pull/452)
- [fix] EmailVerification: enforce that currentUser is fetched after verification.
  [#451](https://github.com/sharetribe/web-template/pull/451)
- [fix] ListingPage: fix 0 as value of listing fields.
  [#449](https://github.com/sharetribe/web-template/pull/449)
- [fix] EditListingDetailsPanel: fix 0 as value of listing fields.
  [#448](https://github.com/sharetribe/web-template/pull/448)
- [fix] Currencies that the Stripe does not support should not cause 500 errors.
  [#447](https://github.com/sharetribe/web-template/pull/447)

  [v5.6.0]: https://github.com/sharetribe/web-template/compare/v5.5.0...v5.6.0

## [v5.5.0] 2024-09-03

- [add] Add currently available translations for DE, ES, FR.
  [#445](https://github.com/sharetribe/web-template/pull/445)
- [change] Make the propType blockId optional for all Block types.
  [#444](https://github.com/sharetribe/web-template/pull/444)
- [change] Update Sentry (v6.19.7 -> v8.26.0). Add ignoreErrors setup, add CSP directives and avoid
  some errors. [#441](https://github.com/sharetribe/web-template/pull/441)
- [fix] ListingPage: the optional chaining for processType variable was faulty.
  [#443](https://github.com/sharetribe/web-template/pull/443)
- [change] Updates to the configuration script. Marketplace name is now prompted in the mandatory
  settings. [#440](https://github.com/sharetribe/web-template/pull/440)
- [change] Update one copy text. [#439](https://github.com/sharetribe/web-template/pull/439)

  [v5.5.0]: https://github.com/sharetribe/web-template/compare/v5.4.0...v5.5.0

## [v5.4.0] 2024-08-20

- [change] auth.duck.js: login flow should wait for currentUser entity be loaded.
  [#436](https://github.com/sharetribe/web-template/pull/436)
- [add] Access control: private marketplace mode

  - Fetch a new asset: /general/access-control.json to check private: true/false flag
  - Make SearchPage, ListingPage, ProfilePage, Styleguide require authentication
  - Ensure currentUser entity is loaded before loadData on client-side
  - Restrict data load & add redirections for SearchPage, ListingPage, and ProfilePage

  [#434](https://github.com/sharetribe/web-template/pull/434)

- [add] Access control: 'pending-approval' state for users.

  - Users will get "state", which is exposed through currentUser's attribute
  - A new state is "pending-approval", which restricts user from initiating transactions and posting
    listings.
  - In addition, 'banned' users will also have state 'banned'.
  - Extra: Routes.js: do not allow banned users to auth pages
  - [fix]: InboxPage.duck.js: include deleted and banned attributes
  - [fix]: ModalMissingInformation: only 'active' users get this modal shown
  - [fix]: Inquiry modal: open the modal after authentication
  - Some util-file imports have been reordered (might cause conflicts)

  [#428](https://github.com/sharetribe/web-template/pull/428)

- [fix] SearchPage: SearchFiltersMobile (modal) should be above topbar.
  [#432](https://github.com/sharetribe/web-template/pull/432)

  [v5.4.0]: https://github.com/sharetribe/web-template/compare/v5.3.0...v5.4.0

## [v5.3.0] 2024-08-13

- [change] ProfilePage: redirect Stripe's crawler to landing page (profile page might be empty).
  [#430](https://github.com/sharetribe/web-template/pull/430)
- [add] Add currently available translations for DE, ES, FR.
  [#429](https://github.com/sharetribe/web-template/pull/429)
- [add] Handle API's new permission model & permission to post listings

  - CurrentUser fetch includes a new relationship: effectivePermissionSet
  - There is a new Page component: NoAccessPage
  - If user has no posting rights: they can't create or edit a draft listing and they can't open a
    previously closed published listing. Instead, they are redirected to NoAccessPage

  [#426](https://github.com/sharetribe/web-template/pull/426)

- [fix] Routes.js: reTry can be undefined in some cases (reTry.scrollIntoView)
  [#427](https://github.com/sharetribe/web-template/pull/427)
- [change] ProfilePage: remove withViewport and refactor a bit.
  [#424](https://github.com/sharetribe/web-template/pull/424)
- [change] Update express.js (v4.19.2) and nodemon (3.1.4).
  [#421](https://github.com/sharetribe/web-template/pull/421)
- [add] richText.js: support parentheses on autolinked URLs.
  [#419](https://github.com/sharetribe/web-template/pull/419)
- [fix] Safari has a bug related to reading array directly from JSON-LD script tag.
  [#418](https://github.com/sharetribe/web-template/pull/418)
- [fix] There could be rare time-windows when indexing has not caught up with deleted & closed
  listings. This might result those listings to be included to listing queries.
  [#417](https://github.com/sharetribe/web-template/pull/417)

  [v5.3.0]: https://github.com/sharetribe/web-template/compare/v5.2.1...v5.3.0

## [v5.2.1] 2024-07-02

- [fix] fix: calculateShippingFee (when shippingPriceInSubunitsAdditionalItems is 0, no shipping fee
  was included) [#414](https://github.com/sharetribe/web-template/pull/414)
- [fix] Remove stock from schema if there's no stock in use.
  [#405](https://github.com/sharetribe/web-template/pull/405)
- [fix] Remove left-behind slash from inquiry-new-inquiry email template reference.
  [#406](https://github.com/sharetribe/web-template/pull/406)
- [fix] The subject line of purchase-new-order email had a wrong variable name.
  [#413](https://github.com/sharetribe/web-template/pull/413)
- [change] Fix another typo in FR translations.
  [#409](https://github.com/sharetribe/web-template/pull/409)
- [change] Fix a typo in FR translations.
  [#408](https://github.com/sharetribe/web-template/pull/408)
- [add] Add currently available translations for de, es, fr.
  [#404](https://github.com/sharetribe/web-template/pull/404)
- [fix] The example files of SignupForm and ConfirmSignupForm had wrong data.
  [#403](https://github.com/sharetribe/web-template/pull/403)
- [change] FilterComponent: relax generated name-attribute for inputs: allow camelCase.
  [#402](https://github.com/sharetribe/web-template/pull/402)

  [v5.2.1]: https://github.com/sharetribe/web-template/compare/v5.2.0...v5.2.1

## [v5.2.0] 2024-05-28

- [add] add currently available translations for de, es, fr.
  [#400](https://github.com/sharetribe/web-template/pull/400)
- [add] This adds user types. User fields can be tied to user types

  - User fields contain multiple default user fields
    - Only displayName and phoneNumber can be toggle on/off
      - You can also toggle wether those are shown on sign up forms.
  - Custom user fields can be tied to user types.
  - AuthenticationPage: SignupForm and ConfirmSignupForm show a dropdown to select user type if it's
    not preselected
    - Default
  - New route **_SignupForUserTypePage_** with path `/signup/:userType`
    - This route preselects one user type for the sign up forms.
    - If preselected userType is there (`/signup/:userType`), then
      - Dropdown selector is not shown.
      - Toggling between login & signup tabs should keep the userType in memory
      - Using SSO, saves the preselected user type to a temporary cookie (to be used in
        ConfirmSignupForm after returning from ID provider's website)
    - An unknown (e.g. outdated) userType in the route will show 404 page.

  [#399](https://github.com/sharetribe/web-template/pull/399)

- [add] Toggle the visibility of unselected options on SectionMultiEnumMaybe through hosted assets.
  [#382](https://github.com/sharetribe/web-template/pull/382)
- [fix] Update SDK to v1.21.1. Fixes bug with extended data with a key `length` and a number type
  value. [#398](https://github.com/sharetribe/web-template/pull/398)
- [fix] util/sanitize.js: handle publicData = null case which happens with banned user
  [#397](https://github.com/sharetribe/web-template/pull/397)
- [fix] en.json: typo on 'ModalMissingInformation.verifyEmailText'
  [#396](https://github.com/sharetribe/web-template/pull/396)
- [fix] Ensure that there is listingType, transactionProcessAlias and unitType defined.
  [#394](https://github.com/sharetribe/web-template/pull/394)
- [fix] en.json: typo on 'StripeConnectAccountForm.stripeToSText'
  [#395](https://github.com/sharetribe/web-template/pull/395)
- [change] StripeConnectAccount: use 'collectionOptions' instead of deprecated 'collect'. The
  future_requirements uses 'include' by default.
  [#392](https://github.com/sharetribe/web-template/pull/392)
- [fix] mergeDefaultTypesAndFieldsForDebugging was set to true, which is wrong. The 0 handling with
  min and max was wrong. [#393](https://github.com/sharetribe/web-template/pull/393)

  [v5.2.0]: https://github.com/sharetribe/web-template/compare/v5.1.0...v5.2.0

## [v5.1.0] 2024-05-21

- [add] support for extended data fields with type `long`
  [#364](https://github.com/sharetribe/web-template/pull/364)
- [change] the login-as feature has changed:

  - Use `sdk.loginAs` instead of `sdk.login`, which is deprecated for this purpose
  - Use `authInfo.isLoggedInAs` instead of relying on auth token's `scope` to determine if current
    session is operator user logged in as marketplace user.
  - Note: when taking update from upstream, check also commit be7e2b9b4.

  [#386](https://github.com/sharetribe/web-template/pull/386)

- [fix] the email template for default-purchase process
  (purchase-order-canceled-from-disputed-provider-html.html) contained copy-paste related typo.
  [#390](https://github.com/sharetribe/web-template/pull/389)
- [add] Autolink text on the UI. Those links must start with 'http' to be recognized.

  - ListingPage > Listing's description
  - ListingPage > Listing fields with schema type ‘text’
  - ListingPage > User's bio on <UserCard>
  - ProfilePage > User's bio
  - ProfilePage > User fields with schema type ‘text’
  - TransactionPage > Messages
  - TransactionPage > inquiryMessage

  [#385](https://github.com/sharetribe/web-template/pull/385)

- [change] handle listings with draft and pending-approval state with login-as feature.
  [#387](https://github.com/sharetribe/web-template/pull/387)
- [Add] Get the color of the PrimeryButton from branding asset.
  [#379](https://github.com/sharetribe/web-template/pull/379)
- [change] Add preview resolution for listing in PreviewResolverPage
  [#384](https://github.com/sharetribe/web-template/pull/384)
- [add] Support for a target path parameter (target_path) in the login as user functionality
  [#383](https://github.com/sharetribe/web-template/pull/383)
- [change] listingMinimumPriceSubUnits: update code comments (0 is not valid value in hosted asset).
  [#381](https://github.com/sharetribe/web-template/pull/381)
- [fix] Styleguide shows multiple versions of some components. The 'id' attributes need to be
  unique. [#380](https://github.com/sharetribe/web-template/pull/380)
- [change] Update SDK to v1.21.0 [#386](https://github.com/sharetribe/web-template/pull/386)

  [v5.1.0]: https://github.com/sharetribe/web-template/compare/v5.0.1...v5.1.0

## [v5.0.1] 2024-04-30

- [fix] Fix: currentUser was not passed to billing details, which resulted email address missing on
  Stripe side. [#377](https://github.com/sharetribe/web-template/pull/377)
- [fix] currentUserHasListings info. This is an old bug that emerged when we introduced draft status
  to listing. The fetched listing might not be a published one but a draft listing. The ownListings
  API endpoint is not queryable to get only published listings but luckily we have introduced
  authorId filter to listings end point later on.
  [#376](https://github.com/sharetribe/web-template/pull/376)
- [add] Update translations for de.json, es.json, and fr.json.
  [#374](https://github.com/sharetribe/web-template/pull/374)
- [change] Update one copy text. [#373](https://github.com/sharetribe/web-template/pull/373)
- [change] EditListingDetailsForm: pass categoryLevel as argument to translations.
  [#372](https://github.com/sharetribe/web-template/pull/372)
- [fix] Fix: when changing categories, clear previously saved ones
  [#371](https://github.com/sharetribe/web-template/pull/371)
- [fix] util/search.js: fix pickInitialValuesForFieldSelectTree.
  [#369](https://github.com/sharetribe/web-template/pull/369)

  [v5.0.1]: https://github.com/sharetribe/web-template/compare/v5.0.0...v5.0.1

## [v5.0.0] 2024-04-23

This major release prepares the codebase for the new concepts: user fields and categories. The
biggest changes are on PRs: #314 and #337.

Note: We will also introduce user types later on, but that concept might still change a bit from
what we have in this release.

- [add] Add support for hosted category configuration

  - Prepare for a future asset: listing-categories.json
  - Prepare for a future changes to assets: listing-search.json and listing-fields.json
  - Collect (nested) category info on EditListingDetailsPanel
    - Saved to publicData as categoryLevel1, categoryLelvel2, categoryLevel3.
    - Allow listing fields to be limited to categories in addition to listing types.
  - Show listing fields on the ListingPage (category restrictions apply)
  - Show category filter on the SearchPage
  - Show listing fields on the SearchPage if category restrictions allow

  [#314](https://github.com/sharetribe/web-template/pull/314)

- [change] Fix a typo in translation keys.
  [#365](https://github.com/sharetribe/web-template/pull/365)
- [change] Update browserlist-db aka caniuse-lite.
  [#363](https://github.com/sharetribe/web-template/pull/363)
- [change] Update moment-timezone library to v0.5.45
  [#362](https://github.com/sharetribe/web-template/pull/362)
- [add] Update translations for de.json, es.json, and fr.json.
  [#361](https://github.com/sharetribe/web-template/pull/361)
- [add] Add support for user fields, which will be released later as a new hosted asset.

  - The hosted asset will support enums, multi-enums, and text fields in the same manner as listing
    fields.
  - User fields will be stored in public data at this point.
  - The ProfilePage will display these fields by default.
  - The ProfileSettingsPage is the default location for adding or editing user fields.
  - The AuthenticationPage (SignupForm and ConfirmSignupForm) can also collect user field data.

  [#337](https://github.com/sharetribe/web-template/pull/337)

- [change] Update Node.js version to >= 18.20.1 (engine) 20.12.1 (circleci)
  [#360](https://github.com/sharetribe/web-template/pull/360)
- [change] formatMoney should use correct formattingOptions (JPY gets correct formatting)
  [#356](https://github.com/sharetribe/web-template/pull/356)
- [change] Twitter's brand and logo has changed to X.
  [#355](https://github.com/sharetribe/web-template/pull/355)
- [fix] Verify that browser's clock is not more than a minute out of sync.
  [#354](https://github.com/sharetribe/web-template/pull/354)
- [change] configStripe.js: update code-comment for dayCountAvailableForBooking.
  [#352](https://github.com/sharetribe/web-template/pull/352)
- [add] Add a readme for the Topbar component
  [#353](https://github.com/sharetribe/web-template/pull/353)
- [fix] Some email templates were not using the correct helper to format currencies and dates based
  on localization. [#351](https://github.com/sharetribe/web-template/pull/351)

  [v5.0.0]: https://github.com/sharetribe/web-template/compare/v4.1.2...v5.0.0

## [v4.1.2] 2024-03-26

- [fix] SSO signups didn't show hosted Terms & Privacy policy assets due to missing loadData.
  [#349](https://github.com/sharetribe/web-template/pull/349)
- [fix] Input inside sticky element caused scroll effect on keystrokes, when scroll-padding was
  used. [#347](https://github.com/sharetribe/web-template/pull/347)
- [fix] KeywordsFilter: add missing attribute: htmlFor
  [#343](https://github.com/sharetribe/web-template/pull/343)

  [v4.1.2]: https://github.com/sharetribe/web-template/compare/v4.1.1...v4.1.2

## [v4.1.1] 2024-03-13

- [fix] configDefault.js: fix Fb & twitter examples.
  [#339](https://github.com/sharetribe/web-template/pull/339)
- [fix] Daylight saving time bug on those time zones that change exactly at midnight.
  [#338](https://github.com/sharetribe/web-template/pull/338)
- [add] Update translations for de.json, es.json, and fr.json.
  [#335](https://github.com/sharetribe/web-template/pull/335)
- [fix] TopbarDesktop: when CustomLinksMenu is not in use, reduce the min-width of search input.
  [#334](https://github.com/sharetribe/web-template/pull/334)

  [v4.1.1]: https://github.com/sharetribe/web-template/compare/v4.1.0...v4.1.1

## [v4.1.0] 2024-02-26

- [add] new component CustomLinksMenu added to the Topbar. It shows custom links if there's enough
  space available, or adds a new menu component that includes those links in a dropdown list.
  [#320](https://github.com/sharetribe/web-template/pull/320)
- [add] Mention Sharetribe Experts in the README.md
  [#332](https://github.com/sharetribe/web-template/pull/332)
- [fix] AuthenticationPage: fix mobile layout issue when content was too long
  [#330](https://github.com/sharetribe/web-template/pull/330)
- [add] Update translations for de.json, es.json, and fr.json.
  [#328](https://github.com/sharetribe/web-template/pull/328)
- [change] Update social login button labels to be aligned with branding guides
  [#327](https://github.com/sharetribe/web-template/pull/327)
- [fix] Show an error message on authentication page in case identity provider authentication fails
  [#326](https://github.com/sharetribe/web-template/pull/326)
- [change] Upgrade Sharetribe SDK to 1.20.1
  [#326](https://github.com/sharetribe/web-template/pull/326)
- [change] Update the copy of TransactionPage.default-purchase.customer.purchased.extraInfo
  [#323](https://github.com/sharetribe/web-template/pull/323)
- [add] PageBuilder/SectionContainer: break long words (e.g. links) so that mobile layout does not
  break. [#322](https://github.com/sharetribe/web-template/pull/322)
- [change] OrderBreakdown: ensure that only those line-items are shown that have been included for
  the currentUser's role (customer vs provider).
  [#321](https://github.com/sharetribe/web-template/pull/321)
- [fix] A listing using the inquiry transaction process should not show the payout details warning
  to the user. [#319](https://github.com/sharetribe/web-template/pull/319)
- [add] Update translations for de.json, es.json, and fr.json.
  [#317](https://github.com/sharetribe/web-template/pull/317)
- [fix] When delivery method is not set, it's still better to maintain the value as string, because
  it's used as an argument in translations.
  [#316](https://github.com/sharetribe/web-template/pull/316)

  [v4.1.0]: https://github.com/sharetribe/web-template/compare/v4.0.0...v4.1.0

## [v4.0.0] 2024-02-07

Breaking change: if you have customized your transaction process, you need to update the email
templates. The new customer commission (#293) adds changes to emails that contain a receipt aka
order breakdown information. In addition, also PR 310 touches the email templates.

This also prepares the codebase for future configuration possibilities:

- Postponing the requirement for a provider to give payout details (but it is still needed)
- Makes certain listing features optional (location, delivery method)
- Adds infinity stock (It is just emulated through a big number 10^15)

- [add] Update de.json asset. [#313](https://github.com/sharetribe/web-template/pull/313)
- [add] Update fr.json asset. [#311](https://github.com/sharetribe/web-template/pull/311)
- [add] Update translation assets for German, French, and Spanish.
  [#309](https://github.com/sharetribe/web-template/pull/309)
- [change] Update default email templates (no need to use triple handlebars anymore).
  [#310](https://github.com/sharetribe/web-template/pull/310)
- [add] Add stock types: infiniteOneItem and infiniteMultipleItems (faked through 10^15)
  [#299](https://github.com/sharetribe/web-template/pull/299)
- [change] Make location and delivery method configurable on EditListingWizard. This just prepares
  the codebase for an upcoming feature, when the configuration is ready on Console.
  [#298](https://github.com/sharetribe/web-template/pull/298)
- [change] Make the requirement of payout details configurable on EditListingWizard. This just
  prepares the codebase for an upcoming feature, when the configuration is ready on Console.
  [#297](https://github.com/sharetribe/web-template/pull/297)
- [fix] The destructuring of undefined commissionAsset can't be against null.
  [#308](https://github.com/sharetribe/web-template/pull/308)
- [change] Allow distinguishing customer and provider commission translations in OrderBreakdown and
  email templates [#307](https://github.com/sharetribe/web-template/pull/307)
- [change] Add environment variable REACT_APP_MARKETPLACE_NAME and add code-comments to built-in
  configs about hosted configs, which might overwrite them. Check that the line doesn't use
  'Biketribe' if you take update from the upstream!
  [#305](https://github.com/sharetribe/web-template/pull/305)
- [change] Updated a small patch of outdated libraries: express, body-parser, moment,
  moment-timezone, helmet, nodemon, decimal.js, concurrently, classnames, jose, passport
  [#304](https://github.com/sharetribe/web-template/pull/304)
- [add] CSP: add new rules: _.analytics.google.com and _.giphy.com
  [#303](https://github.com/sharetribe/web-template/pull/303)
- [change] Fetch customer commission from assets and add handling. This update introduces changes to
  the transaction process email templates, so the transaction process needs to be updated in
  Sharetribe backend. [#293](https://github.com/sharetribe/web-template/pull/293)
- [change] ext/ directory: update email translation defaults for no-delivery-method scenario.
  [#292](https://github.com/sharetribe/web-template/pull/292)
- [change] Code-split FieldDateInput, FieldDateRangeInput, FieldDateRangeController. The consequence
  is that react-dates library is code-splitted too.
  [#290](https://github.com/sharetribe/web-template/pull/290)
- [change] Move IconCard under SaveCardDetails (might be code-splitted later).
  [#283](https://github.com/sharetribe/web-template/pull/283)
- [change] Code-split Topbar component and move it under TopbarContainer.
  [#282](https://github.com/sharetribe/web-template/pull/282)
- [fix] AuthenticationPage/lodash: do not import the whole library.
  [#288](https://github.com/sharetribe/web-template/pull/288)
- [change] PageBuilder/YoutubeEmbed: add rel=0 search param (related videos only from same channel).
  This also adds width and height to iframe element.
  [#286](https://github.com/sharetribe/web-template/pull/286)
- [fix] FieldRadioButton: disabled style was missing.
  [#284](https://github.com/sharetribe/web-template/pull/284)
- [fix] Add missing imports to an email template file
  [#279](https://github.com/sharetribe/web-template/pull/279)

  [v4.0.0]: https://github.com/sharetribe/web-template/compare/v3.5.0...v4.0.0

## [v3.5.0] 2023-12-12

- [fix] OrderPanel: showed price for inquiry on mobile layout even if price was marked hidden
  [#278](https://github.com/sharetribe/web-template/pull/278)
- [add] Add a specific message for too-many-request error on ListingPage and CheckoutPage
  [#277](https://github.com/sharetribe/web-template/pull/277)
- [fix] Add missing update to yarn.lock file.
  [#272](https://github.com/sharetribe/web-template/pull/272)
- [fix] Final Form: iOS 17.0.x initializes unreliably Object.assign. This is fixed in iOS 17.1, but
  for the transition period, we decided to introduce a patch to remedy the situation.
  [#271](https://github.com/sharetribe/web-template/pull/271)
- [add] Update translation assets for French.
  [#269](https://github.com/sharetribe/web-template/pull/269)
- [add] Limit listing fields to specific listing types through Console.
  [#268](https://github.com/sharetribe/web-template/pull/268)
- [add] Update translation assets for French.
  [#267](https://github.com/sharetribe/web-template/pull/267)
- [fix] TransactionPage.duck.js: add another delayed refresh call for tx after transition.
  [#265](https://github.com/sharetribe/web-template/pull/265)
- [change] ListingPage: always render multi-enum sections.
  [#264](https://github.com/sharetribe/web-template/pull/264)
- [add] SectionFooter: add title attributes to social media icons.
  [#261](https://github.com/sharetribe/web-template/pull/261)
- [add] PageBuilder: add backgroundImage overlay to shade the image darker.
  [#262](https://github.com/sharetribe/web-template/pull/262)
- [fix] they keys of built-in filters could have clashed with listing field keys.
  [#260](https://github.com/sharetribe/web-template/pull/260)
- [fix] Use the correct translation asset in email templates.
  [#259](https://github.com/sharetribe/web-template/pull/259)
- [fix] When stockType is oneItem: don't show shipping fee for additional items.
  [#258](https://github.com/sharetribe/web-template/pull/258)
- [fix] configHelpers: undefined enumOptions was not handled properly.
  [#257](https://github.com/sharetribe/web-template/pull/257)

  [v3.5.0]: https://github.com/sharetribe/web-template/compare/v3.4.0...v3.5.0

## [v3.4.0] 2023-10-23

- [change] Update Console URL from https://flex-console.sharetribe.com to
  https://console.sharetribe.com [#249](https://github.com/sharetribe/web-template/pull/249)
- [change] Remove Flex branding from code comments.
  [#248](https://github.com/sharetribe/web-template/pull/248)
- [change] PageBuilder: make sectionId and blockId optional.
  [#254](https://github.com/sharetribe/web-template/pull/254)
- [fix] PaginationLinks: fix pagination limit handling.
  [#253](https://github.com/sharetribe/web-template/pull/253)
- [add] Add more config assets: analytics, googleSearchConsole, maps, localization.
  [#252](https://github.com/sharetribe/web-template/pull/252)
- [add] SectionHero component added to the PageBuilder.
  [#244](https://github.com/sharetribe/web-template/pull/244)
- [fix] Map integration is mandatory, but let's not allow error loops if not available.
  [#250](https://github.com/sharetribe/web-template/pull/250)

  [v3.4.0]: https://github.com/sharetribe/web-template/compare/v3.3.0...v3.4.0

## [v3.3.0] 2023-10-17

- [add] Change transaction process reference to contain updated email templates, which support email
  texts (a content management concept for email templates).
  [#240](https://github.com/sharetribe/web-template/pull/240)
- [fix] CheckoutPage: Fix wrong pending state name at checkout page.
  [#246](https://github.com/sharetribe/web-template/pull/246)
- [add] This removes old express-sitemap setup and adds starts generating sitemap package.

  - Robots.txt and sitemap-\* resources will be generated on request
  - There's a small in-memory cache in use for these files.

  [#243](https://github.com/sharetribe/web-template/pull/243)

- [fix] Prev PR (#241) changed the structure of config.stripe unintentionally.
  [#242](https://github.com/sharetribe/web-template/pull/242)
- [fix] Ensure that stripe currencies have valid subunit divisors and add subunit divisors for BGN,
  CZK, PLN, RON. [#241](https://github.com/sharetribe/web-template/pull/241)
- [change] configHelpers.js: remove trailing slash from marketplaceRootURL
  [#239](https://github.com/sharetribe/web-template/pull/239)
- [fix] webmanifest error should use log and not return 500 if rendering dynamic data fails.
  [#238](https://github.com/sharetribe/web-template/pull/238)

  [v3.3.0]: https://github.com/sharetribe/web-template/compare/v3.2.0...v3.3.0

## [v3.2.0] 2023-10-04

- [fix] mac OS Sonoma seems to have issues with time zone handling.
  [#235](https://github.com/sharetribe/web-template/pull/235)
- [add] Update translation assets for French, Spanish, and Germany.
  [#236](https://github.com/sharetribe/web-template/pull/236)
- [change] remove caret from react-image-gallery dependency.
  [#234](https://github.com/sharetribe/web-template/pull/234)
- [add] Plausible analytics integration. This can be used through environment variable:
  REACT_APP_PLAUSIBLE_DOMAINS [#228](https://github.com/sharetribe/web-template/pull/228)
- [add] Prepare for appIcon property to come from branding asset. This generates site.webmanifest
  file and apple-touch-icon link. [#215](https://github.com/sharetribe/web-template/pull/215)
- [add] Prepare for configurable Logo variants. Console will support height variants of 24, 36, and
  48 pixels. [#214](https://github.com/sharetribe/web-template/pull/214)
- [change] FieldPhoneNumberInput: change formatter from fi locale to only format E.164. This does
  not change input strings that don't start with a '+'.
  [#233](https://github.com/sharetribe/web-template/pull/233)

  [v3.2.0]: https://github.com/sharetribe/web-template/compare/v3.1.1...v3.2.0

## [v3.1.1] 2023-09-22

- [fix] Single listing type caused problem on the EditListingWizard.
  [#231](https://github.com/sharetribe/web-template/pull/231)
- [fix] ManageListingCard: fix wrong (non-existent) classname.
  [#230](https://github.com/sharetribe/web-template/pull/230)
- [add] util/api.js: Added rudimentary support for other HTTP Methods. There's a new 'request'
  function, which is easier to extend. [#229](https://github.com/sharetribe/web-template/pull/229)

[v3.1.1]: https://github.com/sharetribe/web-template/compare/v3.1.0...v3.1.1

## [v3.1.0] 2023-09-21

- [fix] Add 2 missing error translations to en.json file.
  [#225](https://github.com/sharetribe/web-template/pull/225)
- [add] Show warning if environment variable key that starts with REACT_APP contains word "SECRET".
  [#224](https://github.com/sharetribe/web-template/pull/224)
- [change] SearchPage.duck.js: use minStock and stockMode for listing.queries if dates filter is not
  in use. [#217](https://github.com/sharetribe/web-template/pull/217)
- [fix] Handle missing hosted configurations to show Maintenance Mode page
  [#223](https://github.com/sharetribe/web-template/pull/223)
- [add] Add German translation as a reference (de.json) and update other lang files.
  [#222](https://github.com/sharetribe/web-template/pull/222)
- [change] Update browserlist DB (i.e. caniuse-lite entry in yarn.lock file)
  [#221](https://github.com/sharetribe/web-template/pull/221)
- [add] Add Spanish translations as a reference (es.json)
  [#220](https://github.com/sharetribe/web-template/pull/220)
- [fix] EditListingDetailsPanel: namespace listing field inputs to avoid conflicts in input names.
  [#216](https://github.com/sharetribe/web-template/pull/216)
- [add] Add French translations as a reference (fr.json)
  [#219](https://github.com/sharetribe/web-template/pull/219)
- [add] Add a create-listing link to blank slates of SearchPage and ManageListingsPage.
  [#218](https://github.com/sharetribe/web-template/pull/218)
- [change] TransactionPanel/InquiryMessageMaybe: highlight initial inquiry message more.
  [#213](https://github.com/sharetribe/web-template/pull/213)

[v3.1.0]: https://github.com/sharetribe/web-template/compare/v3.0.1...v3.1.0

## [v3.0.1] 2023-09-06

- [fix] CheckoutPage/ErrorMessages: add missing css import.
  [#211](https://github.com/sharetribe/web-template/pull/211)

[v3.0.1]: https://github.com/sharetribe/web-template/compare/v3.0.0...v3.0.1

## [v3.0.0] 2023-09-04

This is a major version release. Mainly due to a new process and big changes to the CheckoutPage.

- [add] This PR adds a 3rd process (default-inquiry) to the template.

  - As a consequence, CheckoutPage has been refactored heavily
  - This removes en.json file (Biketribe-themed translations) and
  - This renames defaultMicrocopy.json (with generic copy-texts) to be the new en.json file
  - This PR branch evolved to be v3 development branch. It included the following PRs too.
  - Read more about the changes from PR:

  [195](https://github.com/sharetribe/web-template/pull/195)

- [fix] small UI bug fixes. (The biggest is the removing defaultBranding.brandImageURL)
  [#209](https://github.com/sharetribe/web-template/pull/209)
- [change] Change email template name of default inquiry process.
  [#208](https://github.com/sharetribe/web-template/pull/208)
- [change] IconSpinner: add delay prop to reduce fast flicker of spinner on fast connections.
  [#207](https://github.com/sharetribe/web-template/pull/207)
- [change] EditListingDetailsPanel: rename setNoAvailabilityForProductListings as
  setNoAvailabilityForUnbookableListings [#206](https://github.com/sharetribe/web-template/pull/206)
- [fix] ListingPage: use updated CSS rules with react-image-gallery.
  [#205](https://github.com/sharetribe/web-template/pull/205)
- [change] Use getSdk function to initialize SDK on server/index.js and server/api/login-as.js.
  [#201](https://github.com/sharetribe/web-template/pull/201)
- [fix] Add default sort options to en.json (microcopy)
  [#204](https://github.com/sharetribe/web-template/pull/204)
- [delete] Remove en.json file (Biketribe-themed translations) and rename defaultMicrocopy.json to
  be the new en.json file. [#203](https://github.com/sharetribe/web-template/pull/203)
- [change] Updates to the copy texts in the defaultMicrocopy.json file.
  [#199](https://github.com/sharetribe/web-template/pull/199)
- [fix] asset data denormalization: null values were not handled correctly.
  [#200](https://github.com/sharetribe/web-template/pull/200)

[v3.0.0]: https://github.com/sharetribe/web-template/compare/v2.2.0...v3.0.0

## [v2.2.0] 2023-08-09

- [fix] CheckoutPage: totalPrice caused an error after inquiry transition.
  [#197](https://github.com/sharetribe/web-template/pull/197)
- [fix] there is was a race condition, if logged in user tries to log in again.
  [#194](https://github.com/sharetribe/web-template/pull/194)
- [fix] Add subdomain wildcard for sentry. (Sentry has started to use subdomains for sending data)
  [#193](https://github.com/sharetribe/web-template/pull/193)
- [add] More tests to cover multiple transaction processes, unit types, and page variants
  [#192](https://github.com/sharetribe/web-template/pull/192)
- [fix] zero commission was throwing error due to 0 being falsy.
  [#191](https://github.com/sharetribe/web-template/pull/191)
- [fix] Inline formatting was wrong for links in PageBuilder and ListingPage descriptions
  [#190](https://github.com/sharetribe/web-template/pull/190)

[v2.2.0]: https://github.com/sharetribe/web-template/compare/v2.1.1...v2.2.0

## [v2.1.1] 2023-06-26

- [fix] New message email template contained an old link that was not in use on the new Template.
  [#187](https://github.com/sharetribe/web-template/pull/187)
- [fix] Add missing translation: StripeConnectAccountForm.missingStripeKey
  [#186](https://github.com/sharetribe/web-template/pull/186)

[v2.1.1]: https://github.com/sharetribe/web-template/compare/v2.1.0...v2.1.1

## [v2.1.0] 2023-06-22

- [fix] Use ternary as picker for site verification for Google Search Console.
  [#184](https://github.com/sharetribe/web-template/pull/184)
- [add] Add support for site verification for Google Search Console.
  [#183](https://github.com/sharetribe/web-template/pull/183)
- [change] Prepare that keywords filter config might come from listing-search asset.
  [#182](https://github.com/sharetribe/web-template/pull/182)
- [fix] localization asset: Add localization asset (it won't be available yet).
  [#180](https://github.com/sharetribe/web-template/pull/180)
- [fix] EditListingDeliveryPanel:

  - Shipping price 0 was shown as undefined.
  - Add safeguard: delivery panel can't handle currency change yet.

  [#181](https://github.com/sharetribe/web-template/pull/181)

- [fix] WeeklyCalendar: fix typo

  - AvailableExecptions > AvailableExceptionsInfo
  - NotAvailableExecptions > NotAvailableExceptionsInfo

  [#179](https://github.com/sharetribe/web-template/pull/179)

- [fix] SearchPageWithMap: include extra query parameters for onMapMoveEnd callback as they might
  contain 'keywords'. [#178](https://github.com/sharetribe/web-template/pull/178)
- [fix] SectionCarousel was overflown, when scrollbars were enforced.
  [#177](https://github.com/sharetribe/web-template/pull/177)
- [add] Import moment locales dynamically as a fallback.
  [#171](https://github.com/sharetribe/web-template/pull/171)
- [fix] This adds a few fixes to reported bugs

  - BookingTimeForm: do not allow line-item fetch with negative time range.
  - Listing fields: id might clash with publicData keys set by this client app
  - BookingDatesForm: fix test (missing timeZone prop)
  - The marketplaceColor was not added to SSR and that caused a flickering on page load
    https://github.com/sharetribe/web-template/commit/2f4d8bffaad26bb2ad2ed6844d9edb62761e6be4

  [#176](https://github.com/sharetribe/web-template/pull/176)

[v2.1.0]: https://github.com/sharetribe/web-template/compare/v2.0.0...v2.1.0

## [v2.0.0] 2023-06-02

This major release takes configurations from hosted assets.

- Upgrade _**sharetribe-flex-sdk**_
- Use _**multi-asset fetch**_ to retrieve config assets on React app:
  - **translations**: '/content/translations.json',
  - **footer**: '/content/footer.json',
  - **branding**: '/design/branding.json',
  - **layout**: '/design/layout.json',
  - **listingTypes**: '/listings/listing-types.json',
  - **listingFields**: '/listings/listing-fields.json',
  - **search**: '/listings/listing-search.json',
  - **transactionSize**: '/transactions/minimum-transaction-size.json',
- Take **commission.json** asset into use (provider commission) on server routes:

  - /api/transaction-line-items/
  - /api/initiate-privileged/
  - /api/transition-privileged/

- Show `MaintenanceMode` component if mandatory configs are not found from hosted assets
- Add `SectionFooter` to PageBuilder and use it from `FooterContainer`.
- Delete the old Footer component
- Add defaultMicrocopy.json. It talks about _listings_ instead of Biketribe _bikes_.
  - The _**en.json**_ is a good themed starting point to be copied for a _translation.json_ aka
    Console > Content > Microcopy
  - If translation.json is not set, _**defaultMicrocopy.json**_ is used instead.

This also includes some bug fixes.

- ListingPage.duck.js: timeUnit should use 'hour', when necessary.
- Include a couple of scaled image variants on SearchPage to speed up listing page rendering.
- PageBuilder: add `word-break` and `hyphens` to Link and Headings
- PageBuilder: don't show spinner if there is content available
- PageBuilder/SectionContainer: change default element from `<div>` to `<section>`
- EditListingAvailabilityPanel: fix WeekPicker popup causing overflow on mobile screen
- EditListingWizard: fix wrong default tabs for purchase and restrict editing if both listingType
  and unitType do not match

### Changes / PRs

- [add] Take hosted configurations into use.

  - Upgrade sharetribe-flex-sdk
  - Use multi-asset fetch to retrieve config assets
  - Add SectionFooter and FooterContainer
  - Delete the old Footer component
  - Take _commission.json_ asset into use (provider commission) on server routes:
    - /api/transaction-line-items/
    - /api/initiate-privileged/
    - /api/transition-privileged/

  [#161](https://github.com/sharetribe/web-template/pull/161)

- [fix] ListingImageGallery: Mobile Safari was not showing thumbnail stripe correctly, if the
  content overflew. [#158](https://github.com/sharetribe/web-template/pull/158)
- [change] Update README.md [#157](https://github.com/sharetribe/web-template/pull/157)

[v2.0.0]: https://github.com/sharetribe/web-template/compare/v1.0.0...v2.0.0

## [v1.0.0] 2023-04-25

This is the official release of Sharetribe Web Template, which combines the features of FTW-daily,
FTW-hourly and FTW-product into one configurable web template. It makes it easy to do things like
change the default transaction process (it supports two different processes, booking and purchase,
out of the box), switch between layout options, add custom fields and filters, and much more, all
through simple JSON configurations. The new template also features a new availability management
experience, redesigned email notifications, and several other improvements.

### Changes on top of the **beta** release

- [change] Update default booking transaction process and email templates.
  [#155](https://github.com/sharetribe/web-template/pull/155)
- [change] AuthenticationPage: long email address caused overflow on mobile layout.
  [#154](https://github.com/sharetribe/web-template/pull/154)
- [fix] Fix booking email templates to show correct end date in day-based bookings
  [#153](https://github.com/sharetribe/web-template/pull/153)
- [change] OrderPanel: separate mobile CTA buttons per process type
  [#152](https://github.com/sharetribe/web-template/pull/152)
- [fix] EditListingWizard: fix handling for outdated (old) listings.
  [#151](https://github.com/sharetribe/web-template/pull/151)
- [change] ListingImageGallery: thumbnail stripe was not overflowing correctly on mobile screens
  [#150](https://github.com/sharetribe/web-template/pull/150)
- [change] ListingImageGallery: prefer the aspect ratio of the first image with limits (2/1 ... 4/3)
  [#149](https://github.com/sharetribe/web-template/pull/149)
- [fix] ListingImageGallery: don't use sizes on fullscreen mode.
  [#148](https://github.com/sharetribe/web-template/pull/148)
- [fix] Mobile font-size had degraded to too small.
  [#147](https://github.com/sharetribe/web-template/pull/147)
- [fix] Email templates: Show booking time based on line item type in booking templates
  [#145](https://github.com/sharetribe/web-template/pull/145)
- [change] Listing field of type enum should be explicitly handled as strings.
  [#146](https://github.com/sharetribe/web-template/pull/146)
- [fix] ListingImageGallery was not setting image dimensions aka sizes.
  [#144](https://github.com/sharetribe/web-template/pull/144)
- [change] change the default aspect ratio of listing cards to 4/3.
  [#143](https://github.com/sharetribe/web-template/pull/143)
- [change] Add a new automatic transition to the default-booking transaction process and adjust the
  timing of the complete transition [#142](https://github.com/sharetribe/web-template/pull/142)
- [fix] Email templates: fix layout-breaking condition in purchase templates.
  [141](https://github.com/sharetribe/web-template/pull/141)
- [fix] Fix indentation in default transaction process email templates.
  [#140](https://github.com/sharetribe/web-template/pull/140)
- [fix] SearchPage error transparency and PageBuilder bg colors of sections.
  [#139](https://github.com/sharetribe/web-template/pull/139)
- [fix] EditListingDetailsForm: set listingFieldsConfig default prop to empty array to fix a bug
  with initial null value not getting a default in props destructuring.
  [#138](https://github.com/sharetribe/web-template/pull/138)
- [change] Update helmet library from v4.6.0 to v6.0.1. This causes some breaking changes:

  - https://github.com/helmetjs/helmet/blob/main/CHANGELOG.md#500---2022-01-02
  - https://github.com/helmetjs/helmet/blob/main/CHANGELOG.md#600---2022-08-26

  From these, we turned the _crossOriginEmbedderPolicy_ off due to issue with Youtube embed and
  _useDefault_ flag too as these are tracked explicitly in csp.js

  [#137](https://github.com/sharetribe/web-template/pull/137)

- [change] Split redirection use case away from REACT_APP_SHARETRIBE_USING_SSL into
  SERVER_SHARETRIBE_REDIRECT_SSL environment variable.
  [#136](https://github.com/sharetribe/web-template/pull/136)
- [change] Add shutdown process for server when receiving close signals.
  [#135](https://github.com/sharetribe/web-template/pull/135)
- [fix] SearchPages: show message if date range is invalid and ignore it.
  [#134](https://github.com/sharetribe/web-template/pull/134)

[v1.0.0]: https://github.com/sharetribe/web-template/compare/v1.0.0-beta...v1.0.0

## v1.0.0-beta 2023-03-29

This is the Sharetribe Web Template, which combines the features of FTW-daily, FTW-hourly and
FTW-product into one configurable web template. It makes it easy to do things like change the
default transaction process (it supports two different processes, booking and purchase, out of the
box), switch between layout options, add custom fields and filters, and much more, all through
simple JSON configurations. The new template also features a new availability management experience,
redesigned email notifications, and several other improvements.

For now, this is a beta release: the official Docs site doesn't yet mention the new template. In the
coming weeks, the new Template will replace Saunatime as the Template that powers the Demo sites,
and the Docs will be updated to reflect the fact that this is the new default Template.

### Changes

- [change] Comment out additional listingTypes. Those are useful for testing purposes, but multiple
  listingTypes are not fully supported on search page yet.
  [#130](https://github.com/sharetribe/web-template/pull/130)
- [change] Add new email templates to default processes.
  [#122](https://github.com/sharetribe/web-template/pull/122)
- [fix] add fonts.googleapis.com to CSP connect-src.
  [#129](https://github.com/sharetribe/web-template/pull/129)
- [fix] search config for dates uses dateRangeMode not mode.
  [#128](https://github.com/sharetribe/web-template/pull/128)
- [Change] Rename 'listingExtendedData' and its variants to 'listingFields'.
  [#127](https://github.com/sharetribe/web-template/pull/127)
- [Change] Rename 'tire-size listing fields as 'tire' and update README.md.
  [#126](https://github.com/sharetribe/web-template/pull/126)
- [Change] Update README.md. Add links to beta version of Docs.
  [#125](https://github.com/sharetribe/web-template/pull/125)
- [fix] Heading was not imported correctly after changes to styling.
  [#124](https://github.com/sharetribe/web-template/pull/124)
- [change] rename some color-related CSS Properties.
  [#122](https://github.com/sharetribe/web-template/pull/122)
- [fix] Do not show stock in EditListingWizard if stockType is 'oneItem'.
  [#121](https://github.com/sharetribe/web-template/pull/121)
- [change] Update README.md and some code comments.
  [#120](https://github.com/sharetribe/web-template/pull/120)
- [delete] remove outdated translation files (fr.json, es.json, de.json). We'll introduce them
  again, when they are updated to match the current set of translation keys.
  [#119](https://github.com/sharetribe/web-template/pull/119)
- [fix] CheckoutPage: save unitType from publicData, not unitType in listingType config.
  [#118](https://github.com/sharetribe/web-template/pull/118)
- [fix] typos, naming and improve the quantity handling if something is configured wrongly.
  [#117](https://github.com/sharetribe/web-template/pull/117)
- [change] Pages/SectionCarousel: show next card a bit on mobile (fix margin-right)
  [#116](https://github.com/sharetribe/web-template/pull/116)
- [change] refactor CSS Properties for Grey colors (remove --matterColor\*)
  [#115](https://github.com/sharetribe/web-template/pull/115)
- [change] Refactor configurations to better work with upcoming config assets.

  - SearchPage layout: 'map' and 'grid'
  - SearchPageWithList renamed as SearchPageWithGrid
  - ListingPage layout: 'carousel' and 'coverPhoto'
  - ListingPageFullImage renamed as ListingPageCarousel
  - ListingPageHeroImage renamed as ListingPageCoverPhoto
  - Also other config files were affected

  [#114](https://github.com/sharetribe/web-template/pull/114)

- [fix] Remove dublicate ids from styleguide page.
  [#113](https://github.com/sharetribe/web-template/pull/113)
- [change] Rename global duck files to start with lower case letter.
  [#112](https://github.com/sharetribe/web-template/pull/112)
- [change] Update tests to use React Testing Library instead of Enzyme.
  [#28](https://github.com/sharetribe/web-template/pull/28)
- [change] Small changes to Signup form according to review feedback.
  [#111](https://github.com/sharetribe/web-template/pull/111)
- [change] Update code comments in configMaps.js
  [#110](https://github.com/sharetribe/web-template/pull/110)
- [fix] EditListingDeliveryPanel: H3 import was missing
  [#109](https://github.com/sharetribe/web-template/pull/109)
- [fix] Fix back-navigation after successful payment and notification dots for booking process.
  [#108](https://github.com/sharetribe/web-template/pull/108)
- [fix] Terms: add translation key, NotFoundPage: fix tests.
  [#107](https://github.com/sharetribe/web-template/pull/107)
- [change] Make old pages to use LayoutComposer. Remove old layout components:

  - LayoutSingleColumn (moved under LayoutComposer)
  - LayoutSideNavigation (moved under LayoutComposer)
  - LayoutWrapperTopbar
  - LayoutWrapperMain
  - LayoutWrapperSideNav
  - LayoutWrapperAccountSettingsSideNav (moved under LayoutComposer)
  - LayoutWrapperFooter

  [#106](https://github.com/sharetribe/web-template/pull/106)

- [add] Add isRequired handler for CustomFieldMultiEnum.
  [#105](https://github.com/sharetribe/web-template/pull/105)
- [add] Add keyword search option ot NotFoundPage.
  [#103](https://github.com/sharetribe/web-template/pull/103)
- [add] Add PrimaryButtonInline and SecondaryButtonInline. Refactor utility-classes away from
  Buttons. [#102](https://github.com/sharetribe/web-template/pull/102)
- [add] Add Heading and H1...H6 components to main app. These are separate from PageBuilder. So that
  Pages could use different fonts if needed.
  [#97](https://github.com/sharetribe/web-template/pull/97)
- [add] Add --contentMaxWidth and --contentMaxWidthPages.
  [#101](https://github.com/sharetribe/web-template/pull/101)
- [change] Improve error handling on PageBuilder and LandingPage.
  [#100](https://github.com/sharetribe/web-template/pull/100)
- [add] Add privacy policy modal to sign up page and make it mandatory to click checkbox. This was
  suggested as more legally clear way that users have noticed the terms.
  [#99](https://github.com/sharetribe/web-template/pull/99)
- [change] Handle situations, where tx process name is unrecognized.
  [#98](https://github.com/sharetribe/web-template/pull/98)
- [change] change enquiry/enquire to inquiry/inquire.
  [#94](https://github.com/sharetribe/web-template/pull/94)
- [change] Refactor remaining via.placeholder.com references to use picsum.photos instead.
  [#96](https://github.com/sharetribe/web-template/pull/96)
- [change] add multiple placeholder texts for custom listing fields.
  [#93](https://github.com/sharetribe/web-template/pull/93)
- [fix] Some heading style fixes and lineBreak fixes to microcopy.
  [#92](https://github.com/sharetribe/web-template/pull/92)
- [delete] Add LinkedLogo and use it in different Topbars.
  [#91](https://github.com/sharetribe/web-template/pull/91)
- [delete] Remove unused microcopy keys from en.json
  [#90](https://github.com/sharetribe/web-template/pull/90)
- [change] Rename default transaction process and associated files.
  [#88](https://github.com/sharetribe/web-template/pull/88)
- [change] New font (apple-system & 'Inter') and all kind of changes related to that.
  [#73](https://github.com/sharetribe/web-template/pull/73)
- [fix] When time zone changes, exceptions should be fetch again. (Query boundaries change.)
  [#87](https://github.com/sharetribe/web-template/pull/87)
- [add] Update translations (en.json). We'll change these later, as these follow biketribe theme.
  [#86](https://github.com/sharetribe/web-template/pull/86)
- [add] Add BookingLocationMaybe section into the TransactionPage.js
  [#85](https://github.com/sharetribe/web-template/pull/85)
- [change] Add listingType which contains transactionType. Defined in configListing.js
  [#84](https://github.com/sharetribe/web-template/pull/84)
- [delete] Remove unnecessary code and translation keys.
  [#83](https://github.com/sharetribe/web-template/pull/83)
- [change] Change of terminology: enquire to inquire and enquiry to inquiry. Process change happens
  later. [#82](https://github.com/sharetribe/web-template/pull/82)
- [fix] Update styleguide examples that produced errors.
  [#81](https://github.com/sharetribe/web-template/pull/81)
- [fix] WeeklyCalendar redirect should use start of week instead of today.
  [#80](https://github.com/sharetribe/web-template/pull/80)
- [fix] WeeklyCalendar should set currentMonth initially to intialVisibleMonth.
  [#79](https://github.com/sharetribe/web-template/pull/79)
- [fix] WeeklyCalendar had bugs in navigation buttons.
  [#78](https://github.com/sharetribe/web-template/pull/78)
- [add] Add environment variable to prevent data loading in SSR
  [#77](https://github.com/sharetribe/web-template/pull/77)
- [change] Refactor EditListingWizard CSS [#76](https://github.com/sharetribe/web-template/pull/76)
- [change] Refactor CSS variables and rename contextHelpers.js as uiHelpers.js
  [#75](https://github.com/sharetribe/web-template/pull/75)
- [change] Availability management has been changed so that default view is Weekly calendar.

  - All the times are shown in listing's time zone
  - EditListingAvailabilityPlanForm handles the weekly default schedule
  - EditListingAvailabilityExceptionForm makes it possible to add exceptions to the plan
  - settings.verbose prints some debug info to browser's console (src/config/settings.js)

  [#74](https://github.com/sharetribe/web-template/pull/74)

- [change] Fixes: image variant creation, FieldDateRangeInput gets isDaily flag instead of
  line-items, BookingTimeForm should show error message.
  [#72](https://github.com/sharetribe/web-template/pull/72)
- [change] TransactionPage: quantity integer was not parsed early enough.
  [#71](https://github.com/sharetribe/web-template/pull/71)
- [change] Move src/util/transaction\*.js files to new directory src/transactions/
  [#70](https://github.com/sharetribe/web-template/pull/70)
- [change] ResponsiveBackgroundImageContainer: allow undefined image (use marketplaceColor).
  [#69](https://github.com/sharetribe/web-template/pull/69)
- [change] Update emails in product process and make changes according to bug reports and change
  requests.

  - Add extra info microcopy in specific states
  - Add delayed refresh for transaction entity after makeTransition call.
  - ListingPage: Huge stock can't be rendered as select options (max 100 limit)

  [#68](https://github.com/sharetribe/web-template/pull/68)

- [change] Update processes

  - Update email templates: remove outdated link to Transactionpage
  - Update email templates: to work with different line-items (hour, day, night)
  - Add new state to booking: expired (use it instead of declined)

  [#67](https://github.com/sharetribe/web-template/pull/67)

- [change] Fix for buggy situation when showStock flag is false.
  [#66](https://github.com/sharetribe/web-template/pull/66)
- [change] Update styleguide and couple of translations.
  [#64](https://github.com/sharetribe/web-template/pull/64)
- [change] Improve listingExtendedData config / includeForTransactionTypes handling.
  [#63](https://github.com/sharetribe/web-template/pull/63)
- [change] Refactor microcopy aka translations and pass arguments to them.
  [#62](https://github.com/sharetribe/web-template/pull/62)
- [change] Add fixes, remove some legacy code, and improve code comments.
  [#61](https://github.com/sharetribe/web-template/pull/61)
- [change] Rename default processes, and the references in code and translations.

  - Reorder actions that decline or cancel booking in reference booking process
  - Add update-protected-data action to enquiry and payment transitions
  - This also adds couple of updated translations for biketribe

  [#60](https://github.com/sharetribe/web-template/pull/60)

- [change] Update styling of Inbox tabs and InboxItem.
  [#59](https://github.com/sharetribe/web-template/pull/59)
- [fix] Severa improvements and bug fixes. Most notable ones:

  - Reduce transaction types to only 1
  - CheckoutPage: the new listingTitle was only meant for mobile layout
  - util/search.js: isStockInUse had a bug

  [#58](https://github.com/sharetribe/web-template/pull/58)

- [fix] Initial versions of new supported default transaction processes.
  [#57](https://github.com/sharetribe/web-template/pull/57)
- [change] change ListingExtendedData config includeForProcessAliases to includeForTransactionTypes
  and remove isBookingUnitType in favor of isBookingProcessAlias.
  [#56](https://github.com/sharetribe/web-template/pull/56)
- [fix] Bug fixes and refactoring: AuthenticationPage/EmailVerificationInfo.js had bugs,
  StripeConnectAccountInfo caused warnings.
  [#55](https://github.com/sharetribe/web-template/pull/55)
- [fix] ListingPage: the title of section details should not be visible if no details is set.
  [#54](https://github.com/sharetribe/web-template/pull/54)
- [add] Add flag: enforceValidTransactionType for listing query on SearchPage.
  [#53](https://github.com/sharetribe/web-template/pull/53)
- [fix] ListingImageGallery didn't get variantPrefix due to buggy mergeConfig.
  [#51](https://github.com/sharetribe/web-template/pull/51)
- [fix] Update configListing.js to more closely match Biketribe configs. Also fix label in
  ListingPage/SectionDetailsMaybe and add grid for secondary filter panel.
  [#50](https://github.com/sharetribe/web-template/pull/50)
- [fix] TransactionPage/enquiry: timeSlot query was missing extra parameter
  [#49](https://github.com/sharetribe/web-template/pull/49)
- [change] Rename src/config/settingsApp.js as src/config/settings.js
  [#48](https://github.com/sharetribe/web-template/pull/48)
- [change] Improve transaction type support:

  - Restrict searches to valid transactionTypes, transactionProcessAlias, and unitType
  - Note: add search schemas with Flex CLI!
  - Add more transactionTypes to make testing easier

  [#47](https://github.com/sharetribe/web-template/pull/47)

- [change] CheckoutPage: add location for bookingable listings too.
  [#46](https://github.com/sharetribe/web-template/pull/46)
- [change] Make OrderPanel to use React Portal instead of rendering within app's DOM.
  [#45](https://github.com/sharetribe/web-template/pull/45)
- [add] listing extended data:

  - Sanitize configured custom fields
  - Change schemaOptions to work with objects containing 'option' and 'label'.
  - Use transactionType in EditListingWizard (active tab feature)

  [#44](https://github.com/sharetribe/web-template/pull/44)

- [change] Biketribe theming: update links in footer and add social media sharing images.
  [#43](https://github.com/sharetribe/web-template/pull/43)
- [change] Biketribe theming: lots of UI related changes, but also some refactoring of components.
  [#42](https://github.com/sharetribe/web-template/pull/42)
- [change] Refactor configurations:

  - Split defaultConfig to sub files based on context
    - brandingConfig sets marketplaceColor, logo, brandImage, social sharing graphics
    - layoutConfig sets layouts for SearchPage and ListingPage
    - listingConfig sets extended data config for listing
    - mapsConfig sets configurations for map provider and location search
    - searchConfig sets mainSearchType, default filters and sort config
    - stripeConfig sets Stripe publishable key and other Stripe related configs
    - transactionConfig creates a preset for selected transaction: process name, alias, unitType,
      etc.
  - CookieConsent component is removed!
    - GA is the only integration that needs cookie consent to our best knowledge
    - The existing Cookie Consent didn't seem to meet EU requirements anymore.
  - GA script is set in src/util/includeScripts.js file instead of server/renderer.js
  - Custom icon for map marker removed (it was not used).

  - Renaming:
    - REACT_APP_CANONICAL_ROOT_URL > REACT_APP_MARKETPLACE_ROOT_URL
    - canonicalRootURL > marketplaceRootURL
    - siteTitle > marketplaceName

  [#41](https://github.com/sharetribe/web-template/pull/41)

- [change] Split to defaultConfig.js and appSettings.js and move default configs to React Context.
  [#39](https://github.com/sharetribe/web-template/pull/39)
- [change] SearchPage changes: cleaning some shared code and add Dates filter.

  - Add Dates filter. It works with listings that have different time zones in use.
    - Uses prolonged date range: start=ETC-14h & end: ETC+12
  - Clean SearchPage variants: Rename SearchPage.helpers.js as SearchPage.shared.js and move several
    shared functions to this shared file.

  [#35](https://github.com/sharetribe/web-template/pull/35)

- [change] OrderPanel: update consistent look-and-feel for the order forms.

  - Remove unused FieldBirthdayInput component
  - Remove unused timeZone parameter

  [#34](https://github.com/sharetribe/web-template/pull/34)

- [add]TimeRange component. (Remove BookingTimeInfo from shared components)
  [#30](https://github.com/sharetribe/web-template/pull/30)
- [change]Rename the default booking process: flex-booking-default-process.
  [#29](https://github.com/sharetribe/web-template/pull/29)
- [change] ListingPage: remove filtersConfig. Use listingExtendedData & defaultFilters instead.
  [#27](https://github.com/sharetribe/web-template/pull/27)
- [change] SearchPage: remove filtersConfig. Use listingExtendedData & defaultFilters instead.
  [#26](https://github.com/sharetribe/web-template/pull/26)
- [add] EditListingWizard: panels get picked based on selected transaction process. In addition,
  submit button translations and pricing panel are refactored.
  [#23](https://github.com/sharetribe/web-template/pull/23)
- [add] EditListingDetailsPanel: add more custom extended data fields and initialize form
  accordingly. Transaction process alias can be set once (i.e. before listing draft is created).
  [#24](https://github.com/sharetribe/web-template/pull/24)
- [change] Extract getStateData to own page-specific files.
  [#21](https://github.com/sharetribe/web-template/pull/21)
- [add] marketplace-custom-config.js: add listingExtendedData config.
  [#22](https://github.com/sharetribe/web-template/pull/22)
- [change] FieldDateRangeInput: rename unitType as lineItemUnitType in DateRangeInput
  [#20](https://github.com/sharetribe/web-template/pull/20)
- [change] InboxPage: use React Intl (ICU) select syntax for tx status.
  [#19](https://github.com/sharetribe/web-template/pull/19)
- [change] Refactor orderData passing to checkout page, pass processAlias to CheckoutPage thunk
  functions and unitType variable usage. [#17](https://github.com/sharetribe/web-template/pull/17)
- [add] Refactor unitType usage and make OrderBreakdown work with it.
  [#15](https://github.com/sharetribe/web-template/pull/15)
- [add] ListingPage: start enquiry from process found from public data.
  [#14](https://github.com/sharetribe/web-template/pull/14)
- [add] EditListingDetailsPanel: transactionProcessAlias and unitType

  - unitType could be 'item', 'day', 'night', 'hour'
  - Remove EditListingFeaturesPanel & EditListingFeaturesForm
  - Remove EditListingPoliciesPanel & EditListingPoliciesForm

  [#13](https://github.com/sharetribe/web-template/pull/13)

- [add] InboxPage: support for multiple processes.
  [#12](https://github.com/sharetribe/web-template/pull/12)
- [add] TransactionPage: support for multiple processes.
  [#11](https://github.com/sharetribe/web-template/pull/11)
- [add] Add getTransitionsNeedingProviderAttention to transcation.js and use it in user.duck.js
  [#10](https://github.com/sharetribe/web-template/pull/10)
- [change] CheckoutPage: transitions get transition name and isPrivileged as params.
  [#9](https://github.com/sharetribe/web-template/pull/9)
- [change] UI facelift for field elements, including text field, textarea and select.
  [#1](https://github.com/sharetribe/web-template/pull/1)
- [change] Refactor action button transition thunks and pass transition name to it.
  [#8](https://github.com/sharetribe/web-template/pull/8)
- [add] Another process graph: src/util/transactionProcessBooking.js
  [#4](https://github.com/sharetribe/web-template/pull/4)
- [change] Refactor TransactionPage title construction and translation keys.
  [#3](https://github.com/sharetribe/web-template/pull/3)
- [fix] Temporarily disallow Node v17, since it causes issues with dependencies.
  [#7](https://github.com/sharetribe/web-template/pull/7)
- [change] Extract product process graph to separate file and change transaction.js

  - process graphs are in separate files
  - transaction.js is importing supported processes and exporting "getProcess" function for
    selecting process in UI components
  - transitions and states are accessible through selected process

  [#2](https://github.com/sharetribe/web-template/pull/2)

---

Changes before this point can be found from CHANGELOG_LEGACY.md
