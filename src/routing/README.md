# Routing

The routing of this Single-page App (SPA) is created on top of React Router. There's a route
configuration and Routes.js component, which creates routes based on the configuration.

Note: routeConfiguration is saved to Redux Context to be referenced by child components.

To read more about how routing works, you should check the documentation:
https://www.sharetribe.com/docs/ftw/how-routing-works-in-ftw/

## routeConfiguration.js

This file makes it possible to have named routes. So, in-app links look like this:

```
<NamedLink name="SearchPage">
  Go to
</NamedLink>
```

This means that you are free to change any route path to match your needs without changing every
link that points to it. E.g. `path: '/s',` > `path: '/search',`.

## Routes.js

This component uses React Router library to create different routes for the SPA. It's also
responsible to make `loadData` calls if a specific route is associated with one. E.g. listingPage
fetches listing data from Marketplace API.

## LoadableComponentErrorBoundary

This template has added code-splitting to every page-level component. Code-splitting is created with
the Loadable Components library.

When SPA is built and those different code chunks are created for each page - the generated files
get unique names so that the browser's cache won't reuse outdated code chunks. This can lead to a
situation, where the client app (of a user who is online while you are doing a new deployment to
your hosting service) tries to fetch old code chunks files that your new deployment has removed.
This causes a 404 error on the client app side. The **LoadableComponentErrorBoundary** component
catches this error and shows an error page to the user - basically, it asks the user to reload the
web app.

To read more about how code-splitting works, you should check the documentation:
https://www.sharetribe.com/docs/ftw/how-code-splitting-works-in-ftw/
