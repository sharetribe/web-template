# CustomExtendedDataSection

This is a reusable component for displaying custom extended data fields configured via Sharetribe
hosted assets. This component is used across multiple entity types (listings, user profiles, and
transactions) to render custom fields in a consistent way.

## Overview

`CustomExtendedDataSection` is a generic component that displays extended data based on custom field
configurations. The component renders different field types using specialized subcomponents based on
the field's `schemaType`.

## Supported Schema Types

The component handles six different schema types:

| Schema Type       | Display Component     | Description                                                |
| ----------------- | --------------------- | ---------------------------------------------------------- |
| `enum`            | `SectionDetails`      | Single-select dropdown values displayed as key-value pairs |
| `long`            | `SectionDetails`      | Numeric values displayed as key-value pairs                |
| `boolean`         | `SectionDetails`      | Yes/No values displayed as key-value pairs                 |
| `multi-enum`      | `SectionMultiEnum`    | Multiple selection fields displayed with PropertyGroup     |
| `text`            | `SectionText`         | Long-form text                                             |
| `youtubeVideoUrl` | `SectionYoutubeVideo` | Embedded YouTube videos                                    |

## Extended Data Scopes

The component currently supports three extended data scopes:

- **`public`** - Publicly visible data (listings, user profiles)
- **`protected`** - Transaction protected data (only visible to transaction participants)
- **`metadata`** - Internal metadata (less commonly displayed)

The scope is determined by the field configuration's `scope` property. The `pickCustomFieldProps()`
helper automatically extracts values from the correct extended data scope.

## Entity Type Filtering

For listings and users, fields can be restricted to specific entity types (e.g., only show certain
fields for "product" listings vs "service" listings). The component respects these restrictions when
`entityTypeKey` is provided.

For transactions, pass `null` as `entityTypeKey` since transaction fields don't use entity type
filtering. They use role-based filtering instead (customer vs provider).

## Related Files

- `src/util/fieldHelpers.js` - Helper functions for preparing field data
- `src/components/CustomExtendedDataField/` - Form inputs for the corresponding configurations
