# Profile Settings → Account Settings Nav Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `/profile-settings` into the account settings side nav as the first item, remove its standalone UserNav and mobile menu links, and extract the account nav tab list into `src/extensions/accountNav/` to reduce upstream file touching.

**Architecture:** A new `src/extensions/accountNav/tabs.js` owns the ordered tab list and is imported by `LayoutWrapperAccountSettingsSideNav`. `ProfileSettingsPage` switches from `LayoutSingleColumn` to `LayoutSideNavigation` with `useAccountSettingsNav`. `ProfileSettingsPage` is added to `ACCOUNT_SETTINGS_PAGES` so the UserNav "Account settings" tab highlights correctly when on that page.

**Tech Stack:** React, Redux (connect), CSS Modules, react-intl (`FormattedMessage`), Sharetribe Web Template (`LayoutSideNavigation`, `TabNav`, `UserNav`)

---

## File Map

| File | Change |
|---|---|
| `src/extensions/accountNav/tabs.js` | **Create** — `getAccountSettingsTabs` function |
| `src/extensions/accountNav/index.js` | **Create** — re-export |
| `src/translations/en_av.json` | **Modify** — add `LayoutWrapperAccountSettingsSideNav.profileTabTitle` |
| `src/translations/es_av.json` | **Modify** — add `LayoutWrapperAccountSettingsSideNav.profileTabTitle` |
| `src/components/LayoutComposer/LayoutSideNavigation/LayoutWrapperAccountSettingsSideNav.js` | **Modify** — import + replace inline tabs with function call |
| `src/routing/routeConfiguration.js` | **Modify** — add `ProfileSettingsPage` to `ACCOUNT_SETTINGS_PAGES` |
| `src/components/UserNav/UserNav.js` | **Modify** — remove ProfileSettingsPage tab |
| `src/containers/TopbarContainer/Topbar/TopbarMobileMenu/TopbarMobileMenu.js` | **Modify** — remove ProfileSettings `<li>` |
| `src/containers/ProfileSettingsPage/ProfileSettingsPage.js` | **Modify** — switch to `LayoutSideNavigation` |
| `src/containers/ProfileSettingsPage/ProfileSettingsPage.module.css` | **Modify** — add `.desktopTopbar` / `.mobileTopbar` |

---

### Task 1: Create `src/extensions/accountNav/tabs.js` and `index.js`

**Files:**
- Create: `src/extensions/accountNav/tabs.js`
- Create: `src/extensions/accountNav/index.js`

- [ ] **Step 1: Create `src/extensions/accountNav/tabs.js`**

```js
import React from 'react';
import { FormattedMessage } from '../../../util/reactIntl';

/**
 * Returns the ordered tab list for the account settings side nav.
 *
 * @param {Object} params
 * @param {string} params.currentPage - Active page name (e.g. 'ProfileSettingsPage')
 * @param {boolean} params.showPaymentMethods
 * @param {boolean} params.showPayoutDetails
 * @returns {Array} Tab config objects for TabNav
 */
export const getAccountSettingsTabs = ({ currentPage, showPaymentMethods, showPayoutDetails }) => {
  const payoutDetailsMaybe = showPayoutDetails
    ? [
        {
          text: <FormattedMessage id="LayoutWrapperAccountSettingsSideNav.paymentsTabTitle" />,
          selected: currentPage === 'StripePayoutPage',
          id: 'StripePayoutPageTab',
          linkProps: { name: 'StripePayoutPage' },
        },
      ]
    : [];

  const paymentMethodsMaybe = showPaymentMethods
    ? [
        {
          text: (
            <FormattedMessage id="LayoutWrapperAccountSettingsSideNav.paymentMethodsTabTitle" />
          ),
          selected: currentPage === 'PaymentMethodsPage',
          id: 'PaymentMethodsPageTab',
          linkProps: { name: 'PaymentMethodsPage' },
        },
      ]
    : [];

  return [
    {
      text: <FormattedMessage id="LayoutWrapperAccountSettingsSideNav.profileTabTitle" />,
      selected: currentPage === 'ProfileSettingsPage',
      id: 'ProfileSettingsPageTab',
      linkProps: { name: 'ProfileSettingsPage' },
    },
    {
      text: <FormattedMessage id="LayoutWrapperAccountSettingsSideNav.contactDetailsTabTitle" />,
      selected: currentPage === 'ContactDetailsPage',
      id: 'ContactDetailsPageTab',
      linkProps: { name: 'ContactDetailsPage' },
    },
    {
      text: <FormattedMessage id="LayoutWrapperAccountSettingsSideNav.passwordTabTitle" />,
      selected: currentPage === 'PasswordChangePage',
      id: 'PasswordChangePageTab',
      linkProps: { name: 'PasswordChangePage' },
    },
    ...payoutDetailsMaybe,
    ...paymentMethodsMaybe,
    {
      text: <FormattedMessage id="LayoutWrapperAccountSettingsSideNav.manageAccountTabTitle" />,
      selected: currentPage === 'ManageAccountPage',
      id: 'ManageAccountPageTab',
      linkProps: { name: 'ManageAccountPage' },
    },
  ];
};
```

- [ ] **Step 2: Create `src/extensions/accountNav/index.js`**

```js
export { getAccountSettingsTabs } from './tabs';
```

- [ ] **Step 3: Verify the file parses — run a quick syntax check**

```bash
cd /Users/alex/hk/ArchivoVintach/github_sharetribe-web-template/sharetribe-web-template
node --input-type=module <<'EOF'
import('/dev/null').catch(() => {});
EOF
yarn test -- --testPathPattern=NOMATCH --watchAll=false 2>&1 | tail -5
```

Expected: Jest exits cleanly (no parse errors from the new files since they're not imported yet).

---

### Task 2: Add translation key to `en_av.json` and `es_av.json`

**Files:**
- Modify: `src/translations/en_av.json`
- Modify: `src/translations/es_av.json`

The key `LayoutWrapperAccountSettingsSideNav.profileTabTitle` does not yet exist in either file. Add it near the other `LayoutWrapperAccountSettingsSideNav.*` keys — but those are currently only in `en.json` (upstream). Since `en_av.json` merges over `en.json` at runtime, add the new AV-only key anywhere in `en_av.json` (alphabetical order is conventional but not required).

- [ ] **Step 1: Open `src/translations/en_av.json` and add the key**

Find any existing key block (e.g. near line 92 where `NewsletterForm.*` keys are). Add:

```json
"LayoutWrapperAccountSettingsSideNav.profileTabTitle": "Profile",
```

- [ ] **Step 2: Open `src/translations/es_av.json` and add the same key in Spanish**

```json
"LayoutWrapperAccountSettingsSideNav.profileTabTitle": "Perfil",
```

- [ ] **Step 3: Verify both files are valid JSON**

```bash
node -e "require('./src/translations/en_av.json'); console.log('en_av OK')"
node -e "require('./src/translations/es_av.json'); console.log('es_av OK')"
```

Expected:
```
en_av OK
es_av OK
```

---

### Task 3: Update `LayoutWrapperAccountSettingsSideNav.js` to use extension

**Files:**
- Modify: `src/components/LayoutComposer/LayoutSideNavigation/LayoutWrapperAccountSettingsSideNav.js`

This is an upstream file. The change is minimal: add one import, replace ~55 lines of inline tab construction with one function call. The scroll logic, `TabNav` render, and props signature are unchanged.

- [ ] **Step 1: Add the import at the top of the file (after the existing imports)**

Current imports end around line 13:
```js
import css from './LayoutSideNavigation.module.css';
```

Add after that line:
```js
import { getAccountSettingsTabs } from '../../../extensions/accountNav';
```

- [ ] **Step 2: Replace the inline tabs construction**

Find and remove this entire block (lines ~93–149):
```js
  const { currentPage, showPaymentMethods, showPayoutDetails } = accountSettingsNavProps;
  const payoutDetailsMaybe = showPayoutDetails
    ? [
        {
          text: <FormattedMessage id="LayoutWrapperAccountSettingsSideNav.paymentsTabTitle" />,
          selected: currentPage === 'StripePayoutPage',
          id: 'StripePayoutPageTab',
          linkProps: {
            name: 'StripePayoutPage',
          },
        },
      ]
    : [];

  const paymentMethodsMaybe = showPaymentMethods
    ? [
        {
          text: (
            <FormattedMessage id="LayoutWrapperAccountSettingsSideNav.paymentMethodsTabTitle" />
          ),
          selected: currentPage === 'PaymentMethodsPage',
          id: 'PaymentMethodsPageTab',
          linkProps: {
            name: 'PaymentMethodsPage',
          },
        },
      ]
    : [];

  const tabs = [
    {
      text: <FormattedMessage id="LayoutWrapperAccountSettingsSideNav.contactDetailsTabTitle" />,
      selected: currentPage === 'ContactDetailsPage',
      id: 'ContactDetailsPageTab',
      linkProps: {
        name: 'ContactDetailsPage',
      },
    },
    {
      text: <FormattedMessage id="LayoutWrapperAccountSettingsSideNav.passwordTabTitle" />,
      selected: currentPage === 'PasswordChangePage',
      id: 'PasswordChangePageTab',
      linkProps: {
        name: 'PasswordChangePage',
      },
    },
    ...payoutDetailsMaybe,
    ...paymentMethodsMaybe,
    {
      text: <FormattedMessage id="LayoutWrapperAccountSettingsSideNav.manageAccountTabTitle" />,
      selected: currentPage === 'ManageAccountPage',
      id: 'ManageAccountPageTab',
      linkProps: {
        name: 'ManageAccountPage',
      },
    },
  ];
```

Replace with:
```js
  const tabs = getAccountSettingsTabs(accountSettingsNavProps);
```

- [ ] **Step 3: Remove the now-unused `FormattedMessage` import**

The file imports `FormattedMessage` at the top. After the replacement, `FormattedMessage` is no longer used in this file. Remove it:

Current:
```js
import { FormattedMessage } from '../../../util/reactIntl';
```

Delete that line entirely.

- [ ] **Step 4: Verify the file still has correct structure**

The file should now look like:

```js
import React, { useEffect, useState } from 'react';

import { TabNav } from '../../../components';

import { createGlobalState } from './hookGlobalState';
import { getAccountSettingsTabs } from '../../../extensions/accountNav';

import css from './LayoutSideNavigation.module.css';

// ... (MAX_HORIZONTAL_NAV_SCREEN_WIDTH, initialScrollState, useGlobalState, scrollToTab unchanged)

const LayoutWrapperAccountSettingsSideNav = props => {
  // ... (mounted, scrollLeft state, useEffects unchanged)

  const tabs = getAccountSettingsTabs(accountSettingsNavProps);

  return (
    <TabNav rootClassName={css.tabs} tabRootClassName={css.tab} tabs={tabs} ariaLabel={ariaLabel} />
  );
};
```

- [ ] **Step 5: Run tests to verify no regressions**

```bash
yarn test -- --watchAll=false 2>&1 | tail -20
```

Expected: test suite passes (or shows only pre-existing failures, none new).

---

### Task 4: Add `ProfileSettingsPage` to `ACCOUNT_SETTINGS_PAGES`

**Files:**
- Modify: `src/routing/routeConfiguration.js:50-56`

- [ ] **Step 1: Update `ACCOUNT_SETTINGS_PAGES`**

Current (lines ~50–56):
```js
export const ACCOUNT_SETTINGS_PAGES = [
  'ContactDetailsPage',
  'PasswordChangePage',
  'StripePayoutPage',
  'PaymentMethodsPage',
  'ManageAccountPage'
];
```

Replace with:
```js
export const ACCOUNT_SETTINGS_PAGES = [
  'ProfileSettingsPage',
  'ContactDetailsPage',
  'PasswordChangePage',
  'StripePayoutPage',
  'PaymentMethodsPage',
  'ManageAccountPage',
];
```

- [ ] **Step 2: Verify the array is used correctly by running the shared test**

```bash
yarn test -- --testPathPattern=routeConfiguration --watchAll=false 2>&1 | tail -10
```

Expected: passes or no test file exists for routeConfiguration (either is fine).

---

### Task 5: Remove `ProfileSettingsPage` tab from `UserNav.js`

**Files:**
- Modify: `src/components/UserNav/UserNav.js:46-53`

- [ ] **Step 1: Remove the `ProfileSettingsPage` tab object**

Current `tabs` array construction (lines ~43–62):
```js
  const tabs = [
    ...manageListingsTabMaybe,
    ...avTabs,
    {
      text: <FormattedMessage id="UserNav.profileSettings" />,
      selected: currentPage === 'ProfileSettingsPage',
      disabled: false,
      linkProps: {
        name: 'ProfileSettingsPage',
      },
    },
    {
      text: <FormattedMessage id="UserNav.accountSettings" />,
      selected: ACCOUNT_SETTINGS_PAGES.includes(currentPage),
      disabled: false,
      linkProps: {
        name: 'ContactDetailsPage',
      },
    },
  ];
```

Replace with:
```js
  const tabs = [
    ...manageListingsTabMaybe,
    ...avTabs,
    {
      text: <FormattedMessage id="UserNav.accountSettings" />,
      selected: ACCOUNT_SETTINGS_PAGES.includes(currentPage),
      disabled: false,
      linkProps: {
        name: 'ContactDetailsPage',
      },
    },
  ];
```

- [ ] **Step 2: Run tests**

```bash
yarn test -- --watchAll=false 2>&1 | tail -10
```

Expected: passes. (No snapshot exists for UserNav, so no update needed.)

---

### Task 6: Remove `ProfileSettingsPage` link from `TopbarMobileMenu.js`

**Files:**
- Modify: `src/containers/TopbarContainer/Topbar/TopbarMobileMenu/TopbarMobileMenu.js:205-208`

- [ ] **Step 1: Remove the ProfileSettings `<li>` block**

Current (lines ~205–208):
```jsx
          <li className={classNames(css.navigationLink, currentPageClass('ProfileSettingsPage'))}>
            <NamedLink name="ProfileSettingsPage">
              <FormattedMessage id="TopbarMobileMenu.profileSettingsLink" />
            </NamedLink>
          </li>
```

Delete those 4 lines entirely.

- [ ] **Step 2: Run tests**

```bash
yarn test -- --watchAll=false 2>&1 | tail -10
```

Expected: passes (or update any snapshots that include the mobile menu if they fail).

If snapshot tests fail, update them:
```bash
yarn test -- --watchAll=false --updateSnapshot 2>&1 | tail -10
```

---

### Task 7: Update `ProfileSettingsPage.js` and `ProfileSettingsPage.module.css`

**Files:**
- Modify: `src/containers/ProfileSettingsPage/ProfileSettingsPage.js`
- Modify: `src/containers/ProfileSettingsPage/ProfileSettingsPage.module.css`

This is the largest change. Follow the exact pattern of `ContactDetailsPage`.

- [ ] **Step 1: Update the import line (line 18)**

Current:
```js
import { H3, Page, UserNav, NamedLink, LayoutSingleColumn } from '../../components';
```

Replace with:
```js
import { H3, Page, UserNav, NamedLink, LayoutSideNavigation } from '../../components';
```

- [ ] **Step 2: Add `showPaymentDetailsForUser` to the userHelpers import (line 10-15)**

Current:
```js
import {
  initialValuesForUserFields,
  isUserAuthorized,
  pickUserFieldsData,
  showCreateListingLinkForUser,
} from '../../util/userHelpers';
```

Replace with:
```js
import {
  initialValuesForUserFields,
  isUserAuthorized,
  pickUserFieldsData,
  showCreateListingLinkForUser,
  showPaymentDetailsForUser,
} from '../../util/userHelpers';
```

- [ ] **Step 3: Add `accountSettingsNavProps` computation (after line 160)**

Current (lines ~158–162):
```js
  const title = intl.formatMessage({ id: 'ProfileSettingsPage.title' });

  const showManageListingsLink = showCreateListingLinkForUser(config, currentUser);

  return (
```

Replace with:
```js
  const title = intl.formatMessage({ id: 'ProfileSettingsPage.title' });

  const showManageListingsLink = showCreateListingLinkForUser(config, currentUser);
  const { showPayoutDetails, showPaymentMethods } = showPaymentDetailsForUser(config, currentUser);
  const accountSettingsNavProps = {
    currentPage: 'ProfileSettingsPage',
    showPaymentMethods,
    showPayoutDetails,
  };

  return (
```

- [ ] **Step 4: Replace `LayoutSingleColumn` with `LayoutSideNavigation` (lines ~163–188)**

Current:
```jsx
  return (
    <Page className={css.root} title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer />
            <UserNav
              currentPage="ProfileSettingsPage"
              showManageListingsLink={showManageListingsLink}
            />
          </>
        }
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
      </LayoutSingleColumn>
    </Page>
  );
```

Replace with:
```jsx
  return (
    <Page className={css.root} title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation
        topbar={
          <>
            <TopbarContainer
              desktopClassName={css.desktopTopbar}
              mobileClassName={css.mobileTopbar}
            />
            <UserNav
              currentPage="ProfileSettingsPage"
              showManageListingsLink={showManageListingsLink}
            />
          </>
        }
        sideNav={null}
        useAccountSettingsNav
        accountSettingsNavProps={accountSettingsNavProps}
        footer={<FooterContainer />}
        intl={intl}
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
```

- [ ] **Step 5: Add `.desktopTopbar` and `.mobileTopbar` to `ProfileSettingsPage.module.css`**

Append to the end of the file:
```css

.desktopTopbar,
.mobileTopbar {
  box-shadow: none;
}
```

- [ ] **Step 6: Run the ProfileSettingsPage test**

```bash
yarn test -- --testPathPattern=ProfileSettingsPage --watchAll=false 2>&1 | tail -20
```

Expected: passes. The existing test checks for a link to `ProfilePage` — that's unaffected by the layout change.

If the test imports `LayoutSingleColumn` in its render tree and snapshotting is involved, update snapshots:
```bash
yarn test -- --testPathPattern=ProfileSettingsPage --watchAll=false --updateSnapshot 2>&1 | tail -10
```

- [ ] **Step 7: Run full test suite**

```bash
yarn test -- --watchAll=false 2>&1 | tail -20
```

Expected: passes (update any snapshots that reference the mobile menu or UserNav).

---

### Task 8: Commit

- [ ] **Step 1: Stage all changes**

```bash
git add \
  src/extensions/accountNav/ \
  src/translations/en_av.json \
  src/translations/es_av.json \
  src/components/LayoutComposer/LayoutSideNavigation/LayoutWrapperAccountSettingsSideNav.js \
  src/routing/routeConfiguration.js \
  src/components/UserNav/UserNav.js \
  src/containers/TopbarContainer/Topbar/TopbarMobileMenu/TopbarMobileMenu.js \
  src/containers/ProfileSettingsPage/ProfileSettingsPage.js \
  src/containers/ProfileSettingsPage/ProfileSettingsPage.module.css
```

- [ ] **Step 2: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: move profile settings into account settings side nav

ProfileSettingsPage now renders inside LayoutSideNavigation with the
same account settings side nav as /account/* pages. Profile is the
first tab in the nav. Account nav tab list extracted to
src/extensions/accountNav/ to reduce upstream file touches.

- Add getAccountSettingsTabs() to src/extensions/accountNav/
- Remove ProfileSettingsPage tab from UserNav and TopbarMobileMenu
- Add ProfileSettingsPage to ACCOUNT_SETTINGS_PAGES
- Switch ProfileSettingsPage from LayoutSingleColumn to LayoutSideNavigation

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```
