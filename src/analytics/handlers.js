export class LoggingAnalyticsHandler {
  trackPageView(url) {
    console.log('Analytics page view:', url);
  }
}

// Google Analytics 4 (GA4) using gtag.js script, which is included in util/includeScripts.js
export class GoogleAnalyticsHandler {
  trackPageView(canonicalPath, previousPath) {
    // GA4 property. Manually send page_view events
    // https://developers.google.com/analytics/devguides/collection/gtagjs/single-page-applications
    // Note 1: You should turn "Enhanced measurement" off.
    //         It attaches own listeners to elements and that breaks in-app navigation.
    // Note 2: If previousPath is null (just after page load), gtag script sends page_view event automatically.
    //         Only in-app navigation needs to be sent manually from SPA.
    // Note 3: Timeout is needed because gtag script picks up <title>,
    //         and location change event happens before initial rendering.
    if (previousPath && window.gtag) {
      window.setTimeout(() => {
        window.gtag('event', 'page_view', {
          page_path: canonicalPath,
        });
      }, 300);
    }
  }
}
