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

## Upcoming version 2023-XX-XX

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
