# Access control config

Access control decides whether the marketplace is private, whether file upload/download is allowed,
and which permission flags (and optional CTAs) apply to users and listings.

Hosted asset `/general/access-control.json` maps to `config.accessControl`. Marketplace booleans
fall back to built-ins in [`defaultAccessControl.js`](./defaultAccessControl.js) (both `false`).
User and listing permission blocks are hosted asset only — there are no built-ins for those.

## `config.accessControl` shape

```js
{
  marketplace: {
    private, // boolean — gate browsing for unauthenticated users
    fileUploadAndDownloadDisabled, // boolean — hide listing file upload/download
  },
  users: {
    // optional booleans
    requireApprovalToJoin,
    requirePermissionToRead,
    requirePermissionToPostListings,
    requirePermissionToInitiateTransactions,
    // optional *Options with callToAction when configured
    requireApprovalToJoinOptions,
    requirePermissionToReadOptions,
    requirePermissionToPostListingsOptions,
    requirePermissionToInitiateTransactionsOptions,
  },
  listings: {
    requireApprovalToPublish, // optional boolean
    requireApprovalToPublishOptions, // optional CTA options
  },
}
```

`callToAction` is either `{ type: 'none' }` or `{ type: 'internal' | 'external', text, href }`
(non-empty strings).

Used by Search/Listing/Profile access wrappers, route configuration, file panels, NoAccessPage, and
listing ActionBar CTAs.

## When something is wrong

Invalid marketplace booleans fall back to built-ins. Invalid permission flags and bad CTAs (`type` /
`text` / `href`) are dropped. None of this triggers MaintenanceMode.
