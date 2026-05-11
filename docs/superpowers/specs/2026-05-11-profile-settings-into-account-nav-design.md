# Profile Settings — Move into Account Settings Side Nav

**Date:** 2026-05-11

Merge `/profile-settings` into the account settings section so it shares the same `LayoutSideNavigation` as `/account/...` pages. Remove the standalone link from UserNav (TabNavHorizontal) and TopbarMobileMenu. Extract the account nav tab list into `src/extensions/accountNav/` so future tab additions/reordering don't require touching upstream files.

---

## Goals

1. `/profile-settings` renders inside `LayoutSideNavigation` with the full account settings side nav
2. `/profile-settings` is the **first** item in the side nav list
3. The `UserNav` "Profile settings" tab is removed; the "Account settings" tab stays (links to `ContactDetailsPage`)
4. The `TopbarMobileMenu` profile-settings link is removed
5. `ProfileSettingsPage` is added to `ACCOUNT_SETTINGS_PAGES` so the "Account settings" UserNav tab highlights when on that page
6. The account nav tab list lives in `src/extensions/accountNav/` — not hardcoded in the upstream `LayoutWrapperAccountSettingsSideNav`

---

## New Files

### `src/extensions/accountNav/tabs.js`

Exports a single function:

```js
getAccountSettingsTabs({ currentPage, showPaymentMethods, showPayoutDetails })
// returns: Array of tab config objects for TabNav
```

Tab order:
1. **Profile** → `ProfileSettingsPage` (always shown)
2. **Contact details** → `ContactDetailsPage`
3. **Password** → `PasswordChangePage`
4. **Payout details** → `StripePayoutPage` (only when `showPayoutDetails === true`)
5. **Payment methods** → `PaymentMethodsPage` (only when `showPaymentMethods === true`)
6. **Manage account** → `ManageAccountPage`

Each tab object shape (matches existing `TabNav` contract):
```js
{
  text: <FormattedMessage id="..." />,
  selected: currentPage === 'PageName',
  id: 'PageNameTab',
  linkProps: { name: 'PageName' },
}
```

Uses `FormattedMessage` from `'../../../util/reactIntl'`.

### `src/extensions/accountNav/index.js`

Re-exports `getAccountSettingsTabs` for clean imports:
```js
export { getAccountSettingsTabs } from './tabs';
```

---

## Modified Files

### `src/extensions/accountNav/tabs.js` (new — see above)

### `src/components/LayoutComposer/LayoutSideNavigation/LayoutWrapperAccountSettingsSideNav.js`

**Change:** Replace the inline `tabs` array construction (lines 94–149) with a call to `getAccountSettingsTabs`. The scroll behavior, `useGlobalState`, `useEffect`, and `TabNav` render are unchanged.

```js
// Before: inline tabs array + conditionals (~55 lines)
// After:
import { getAccountSettingsTabs } from '../../../extensions/accountNav/tabs';
// ...
const tabs = getAccountSettingsTabs(accountSettingsNavProps);
```

### `src/routing/routeConfiguration.js`

**Change:** Add `'ProfileSettingsPage'` as the first entry in `ACCOUNT_SETTINGS_PAGES`:

```js
export const ACCOUNT_SETTINGS_PAGES = [
  'ProfileSettingsPage',   // ← added
  'ContactDetailsPage',
  'PasswordChangePage',
  'StripePayoutPage',
  'PaymentMethodsPage',
  'ManageAccountPage',
];
```

### `src/components/UserNav/UserNav.js`

**Change:** Remove the `ProfileSettingsPage` tab object from the `tabs` array (currently lines 47–53). The "Account settings" tab linking to `ContactDetailsPage` remains.

### `src/containers/TopbarContainer/Topbar/TopbarMobileMenu/TopbarMobileMenu.js`

**Change:** Remove the `<li>` block for `ProfileSettingsPage` (currently lines 205–208).

### `src/containers/ProfileSettingsPage/ProfileSettingsPage.js`

**Change:** Switch from `LayoutSingleColumn` to `LayoutSideNavigation`.

- Import `showPaymentDetailsForUser` from `'../../util/userHelpers'`
- Import `LayoutSideNavigation` (already available via `'../../components'`)
- Remove `LayoutSingleColumn` import
- Import `showPaymentDetailsForUser` from `'../../util/userHelpers'`
- Compute `accountSettingsNavProps`:
  ```js
  const { showPayoutDetails, showPaymentMethods } = showPaymentDetailsForUser(config, currentUser);
  const accountSettingsNavProps = {
    currentPage: 'ProfileSettingsPage',
    showPaymentMethods,
    showPayoutDetails,
  };
  ```
- Replace `<LayoutSingleColumn>` with `<LayoutSideNavigation>` using the same props pattern as `ContactDetailsPage` — **keep `UserNav` in the topbar** (it provides navigation to listings, purchases, etc.):
  ```jsx
  <LayoutSideNavigation
    topbar={
      <>
        <TopbarContainer desktopClassName={css.desktopTopbar} mobileClassName={css.mobileTopbar} />
        <UserNav currentPage="ProfileSettingsPage" showManageListingsLink={showManageListingsLink} />
      </>
    }
    sideNav={null}
    useAccountSettingsNav
    accountSettingsNavProps={accountSettingsNavProps}
    footer={<FooterContainer />}
    intl={intl}
  >
    {/* existing content unchanged */}
  </LayoutSideNavigation>
  ```
- `ProfileSettingsPage.module.css`: add `.desktopTopbar` and `.mobileTopbar` classes (copy from `ContactDetailsPage.module.css` — they control topbar offset).
- `showManageListingsLink` stays in use (passed to `UserNav`).

---

## Translations

Add one new key to `src/translations/en_av.json` and `src/translations/es_av.json` (not `en.json` — this is an AV customization):

```json
"LayoutWrapperAccountSettingsSideNav.profileTabTitle": "Profile"
```

```json
"LayoutWrapperAccountSettingsSideNav.profileTabTitle": "Perfil"
```

Used in `tabs.js` as the label for the new ProfileSettingsPage tab.

---

## Upstream Merge Risk

| File | Risk | Notes |
|---|---|---|
| `LayoutWrapperAccountSettingsSideNav.js` | Low (improved) | Inline tabs array replaced with 1 import + 1 call — less code in upstream file than before |
| `routeConfiguration.js` | Low | Single string added to array; appended at top per new-first requirement |
| `UserNav.js` | Low | Single tab object removed from array |
| `TopbarMobileMenu.js` | Low | Single `<li>` block removed |
| `ProfileSettingsPage.js` | Medium | Layout swap touches multiple lines; follow ContactDetailsPage exactly |

---

## Out of Scope

- No changes to `ProfileSettingsForm` content
- No changes to the `/account/...` pages themselves
- No route path changes (`/profile-settings` URL stays the same)
