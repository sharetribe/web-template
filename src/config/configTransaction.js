// AV-specific transaction-related config used by upstream components.
//
// extraOrderBreakdownLineItems: components rendered after the upstream provider
// commission line in OrderBreakdown.js. Each component receives:
//   { lineItems, isProvider, marketplaceName, intl }
// To revert to upstream behavior, set this to [].

import LineItemProviderCommissionFixedMaybe from '../components/OrderBreakdown/LineItemProviderCommissionFixedMaybe';

export const extraOrderBreakdownLineItems = [LineItemProviderCommissionFixedMaybe];
