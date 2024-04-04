# Topbar

The "Topbar" component is the primary navigation tool at the top of your marketplace application,
offering quick access to various marketplace pages.

The Topbar has built-in support for dynamic links based on data fetched from the
[asset delivery API](https://www.sharetribe.com/api-reference/asset-delivery-api.html).

The Topbar includes two primary components, one for the Desktop layouts and one for mobile layouts.
The breakpoint is triggered at 1024px.

## Links

The Topbar supports two types of links: primary and secondary. Primary links are shown on the top
level of the Topbar, i.e. they are always visible if the viewport is not below 1024px (which
triggers the mobile layout). Secondary links are grouped under a "More" dropdown menu.

Primary links will collapse under a dropdown menu if the viewport's width is not wide enough. Links
are collapsed individually, i.e., the Topbar will always try to render as many primary links as
possible. If the width of the Topbar is so narrows that no primary links fit, the dropdown menu is
renamed from "More" to "Menu".

The "Post a new listing" link is always shown as the first primary link, and it is prioritized in
the visible space

## CustomLinksMenu

The CustomLinksMenu component dynamically manages and displays the custom links loaded through
assets within the Topbar. It organizes links into two categories based on available space: priority
links that are always visible in the Topbar, and secondary links grouped under a "More" dropdown
menu. The component adjusts in real-time to browser resizing and page layout changes. It uses the
ResizeObserver web API to monitor for changes in the viewport's width.

This component is inherently somewhat fragile as it needs to deal with the DOM directly. If you
customize the Topbar, make sure to test responsiveness thoroughly.

## Hosted assets

The dynamic links in the menu use a hosted asset called top-bar.json. An example of the structure:

```
{
    "data": {
      "customLinks": [
        {
          "group": "primary",
          "type": "internal",
          "href": "/p/about",
          "text": "About page"
        }
      ],
      "logoLink": {
        "href": "http://www.example.com"
      },
      "id": "631q5e3q-13q5-4871-8dc0-923gg6be286b",
      "type": "jsonAsset"
    }
}
```

## logoLink

The logoLink property in the top-bar.json asset determines the destination URL of the logo. The
logoLink property should only be used if you want your logo to link to an external URL. The
intention here is to allow you to host your marketplace on a different domain from where you are
hosting the rest of your site. For example, your site may be at https://your-website.com and your
marketplace at https://marketplace.your-website.com. The logo (see LinkedLogo.js) automatically
links to the landing page of your website if no logoLink property is present.

Note: the logoLink property does not support in-app navigation at the moment. If the URL is the
marketplace's domain (https://marketplace.your-website.com), a full page refresh is performed every
time a user clicks the logo.

## Responsiveness

The mobile layout transitions to the desktop layout at 1024px. Keep this in mind if you're adding
new components to the Topbar. Thorough testing is advised if making changes to the Topbar

As logo size can be adjusted through assets, you should consider that the logo can potentially take
up a lot of space, the biggest logo size is 370px x 48px.

## getResolvedCurrentPage

The function uses the routeConfiguration to find the route name (string that indicates if this is
"LandingPage" or "SearchPage", etc.) of the current page being viewed, which is eventually used in
LinksMenu.js to determine whether a link is active.

## Grouping of custom menu links

Custom links are sorted so that primary links are always at the beginning of the list. This ensures
that primary links are rendered first, so that when the Topbar component becomes narrower, the last
link to the right always disappears first and is moved under the dropdown menu with the other
secondary links.

## Translation keys

The component uses the following translation keys:

```
  "Topbar.genericError": "Oh no, something went wrong. Please check your network connection and try again.",
  "Topbar.logoIcon": "Go to homepage",
  "Topbar.menuIcon": "Open menu",
  "Topbar.mobileSearchHelp": "Find what you are looking for.",
  "Topbar.searchIcon": "Open search",
  "TopbarDesktop.LinksMenu.all": "Menu",
  "TopbarDesktop.LinksMenu.more": "More",
  "TopbarDesktop.accountSettingsLink": "Account settings",
  "TopbarDesktop.createListing": "Post a new listing",
  "TopbarDesktop.inbox": "Inbox",
  "TopbarDesktop.login": "Log in",
  "TopbarDesktop.logo": "{marketplaceName}",
  "TopbarDesktop.logout": "Log out",
  "TopbarDesktop.profileSettingsLink": "Profile settings",
  "TopbarDesktop.signup": "Sign up",
  "TopbarDesktop.yourListingsLink": "Your listings",
  "TopbarMobileMenu.accountSettingsLink": "Account settings",
  "TopbarMobileMenu.greeting": "Hello {displayName}",
  "TopbarMobileMenu.inboxLink": "Inbox",
  "TopbarMobileMenu.loginLink": "Log in",
  "TopbarMobileMenu.logoutLink": "Log out",
  "TopbarMobileMenu.newListingLink": "Post a new listing",
  "TopbarMobileMenu.profileSettingsLink": "Profile settings",
  "TopbarMobileMenu.signupLink": "Sign up",
  "TopbarMobileMenu.signupOrLogin": "{signup} or {login}",
  "TopbarMobileMenu.unauthorizedGreeting": "Hello there,{lineBreak}would you like to {signupOrLogin}?",
  "TopbarMobileMenu.yourListingsLink": "Your listings",
  "TopbarSearchForm.placeholder": "Search listings…",
```
