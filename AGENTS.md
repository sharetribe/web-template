# AGENTS.md – AI Agent guide for Sharetribe Web Template

Sharetribe Web Template is a React-based marketplace web application with server-side rendering.

# Technology Stack

React 18 + Redux Toolkit + Final Form + Express.js + Server-Side Rendering

# Architecture

```shell
├── public
│   ├── static        # Static assets that are copied to the build directory.
│   └── index.html    # The main HTML file.
├── server
│   ├── apiRouter.js  # Server has own API endpoints that can be called from the web app.
│   ├── csp.js        # Content Security Policy configuration.
│   ├── dataLoader.js # Load data for the server-side rendering.
│   ├── index.js      # Node/Express server.
│   └── renderer.js   # Render the app to a string on server.
├── src
│   ├── components    # Shared components.
│   │   ├── SomeComponent                  # An example of a component directory.
│   │   │   ├── SomeComponent.example.js   # Show the component on styleguide page.
│   │   │   ├── SomeComponent.js           # The main component file.
│   │   │   ├── SomeComponent.module.css
│   │   │   └── SomeComponent.test.js
│   │   └── index.js  # Export shared components and maintain the import order.
│   ├── config        # Built-in configurations. Hosted configurations override most of these.
│   ├── containers    # Page-level components. Only these are connected to Redux store.
│   │   ├── SomePage              # An example of a page-level component directory.
│   │   │   ├── SomePage.duck.js  # Redux: contains a 'loadData' function and Redux slice creation.
│   │   │   ├── SomePage.js       # The main component connected to Redux store.
│   │   │   ├── SomePage.module.css
│   │   │   └── SomePage.test.js
│   │   ├── pageDataLoadingAPI.js  # Register loadData functions for route configuration.
│   │   └── reducers.js            # Export all the page-specific reducers.
│   ├── ducks         # Shared Redux files.
│   ├── routing       # Contains route configuration.
│   ├── transactions  # Transaction processes that this client app can handle.
│   ├── translations
│   │   └── en.json   # Default translations. These are overridden by hosted translations.
│   ├── util
│   ├── app.js        # Exports ClientApp and ServerApp components.
│   ├── index.js      # Entry point for the client-side app.
│   ├── reducers.js   # Combine global and page-level reducers.
│   └── store.js      # Create and configure the Redux store.
└── package.json
```

## Hosted configurations and assets

The app fetches translations and configuration files on full page load from Sharetribe SDK with
`sdk.asset*` commands. View the list in `src/config/configDefault.js` under `appCdnAssets`. These
"hosted assets" are created in Sharetribe Console by a human marketplace admin and override local
configurations in `src/config`. Prefer using hosted configurations wherever possible, and only
create local configurations when Console does not allow the necessary pattern. See
`https://www.sharetribe.com/docs/how-to/listings/extend-listing-data-in-template/` for an example of
extending listing data.

Configurations are validated in `src/util/configHelpers.js` (`mergeConfig` function). Access in
components via `useConfiguration()` hook.

If key assets are missing, the app shows a MaintenanceModeError (see `src/app.js` ClientApp for
details).

Full technical asset reference is available in https://www.sharetribe.com/docs/references/assets/.

# Code conventions

## Styling

- Create responsive styles with 2 main breakpoints
  - Start with mobile first approach:
    - margins, paddings, and component heights should follow 6px baseline
  - `--viewportMedium` starts at 768px.
    - margins, paddings, and component heights should follow 8px baseline
  - `--viewportLarge` starts at 1024px.
  - common breakpoints are defined in `src/styles/customMediaQueries.css`
- `/src/styles/marketplaceDefaults.css` file contains CSS variables, global CSS classes, and the
  default styles for DOM elements.
- Write component styles using class selectors. Do not use element selectors.

## Dependency import order

- Always follow this import order to avoid circular dependency errors:
  1. Import external libraries and third-party assets
  2. Import configurations, contexts, and `util` modules
  3. Import shared components – the src/components/index.js file maintains correct import order
     within the directory and has a comment link to further reading.
  4. Import modules from parent directory
  5. Import modules from same directory
- See `src/containers/CheckoutPage/CheckoutPage.js` for an example on the correct import order
- Group similar imports and separate them with descriptive code comments similarly to
  `CheckoutPage.js`.
- Imports from shared `components` directory or `util` directory should use relative paths that
  include the directory name (e.g.import { IconComponent } from '../../components';)

## Forms

- Always use React Final Form for creating forms to gather user input
- There are ready-made shared components to cover basic React Final Form field inputs, e.g.
  "FieldTextInput" and "FieldSelect", etc.
- Components that start with Field\* on src/components/index.js file are meant for React Final Form.
- If new custom field is created, add potential label above the input and show errors below the
  input using <ValidationError> component. Check that the input follows accessibility standards.

## Utilities

- This codebase prefers local utilities instead of imported libraries due to bundle size concerns
  and dependency management.
- The `src/util/` directory contains production-ready utility helper functions to handle different
  entities and use cases in the codebase. These utility functions are grouped by category in
  descriptively named files, e.g. `currency.js`, `dates.js`, etc, and most files have a
  correspondingly named test file.
- Review the available utility functions and prefer using existing ones or adding a new local
  utility function instead of importing new helper libraries. Ask the user explicitly before
  importing a new library.

## Redux

- Use Redux Toolkit and the Ducks pattern
- There are two types of Redux duck files in the application:
  - Global .duck.js files are used from multiple pages, and they live in the `src/ducks/` directory
  - Page-level .duck.js files are used from a specific page, and they live in the corresponding page
    directory.

## API calls

- Use the Sharetribe SDK to call Sharetribe Marketplace API
- For other API calls, including to the app's own server, create a function in `src/util/api.js` and
  follow the established conventions.
- Make API calls for a page (using the SDK) in a `src/containers/{PageName}.duck.js` file. See
  `src/containers/ListingPage/ListingPage.duck.js` for an example.
- Do not use a `useEffect` hook to make API data loading calls. Instead, add a page-level .duck.js
  file that contains a loadData function. Register the loadData in
  `src/containers/pageDataLoadingAPI.js` and `routeConfiguration.js` files following the existing
  conventions in those files. This pattern is important for SSR, so with components that only render
  content client-side, it is safe to diverge from this rule.
- Marketplace API reference
  https://www.sharetribe.com/api-reference/marketplace.html#marketplace-api-reference

## Transaction processes

- The Sharetribe Web Template supports four transaction processes by default
  - View `src/transactions/transaction.js` for transaction process definitions
  - View `src/transactions/README.md` for more context on transaction process handling in this
    repository.
- Always ask for approval from user if attempting to make changes to transaction processes, and
  remind them to make the necessary process updates towards the Sharetribe backend.

## Formatting

Prettier: single quotes, 2 spaces, trailing commas, max line 100

## Internationalization (i18n)

- Always use React Intl `FormattedMessage` or `intl.formatMessage()` for copy texts.
- Add new internationalization strings as key-value pairs to `/src/translations/{en,de,es,fr}.json`
  for local fallback values in the corresponding languages. Hosted translations are fetched
  similarly to hosted configurations.
  - pattern: `"ComponentName.key" : "Message with {variable}"`,
- To access `intl` in components, use the `useIntl()` hook

## ✅ Good patterns

- Prefer functional components and React hooks
- Add JSDoc comments for the component and any exported functions
- Components should use semantic HTML elements
