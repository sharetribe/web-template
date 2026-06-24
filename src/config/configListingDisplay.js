// Display-only overrides for listing fields defined in configListing.js.
// These do NOT affect backend search schema — only how the form input is rendered.
// Option keys in groups[*].options must match enumOptions keys in configListing.js.
// Labels are resolved through React Intl and canonical listing field enumOptions.
export const listingFieldDisplayOverrides = {
  all_sizes: {
    saveConfig: {
      inputType: 'groupedMultiSelect',
      // Sellers may tag a listing with at most 2 sizes.
      maxSelections: 2,
      groups: [
        {
          key: 'standard',
          labelTranslationKey: 'ListingField.allSizes.group.standard',
          options: ['unitalla', 'xxs', 'xs', 's', 'm', 'l', 'xl'],
        },
        {
          key: 'mx',
          labelTranslationKey: 'ListingField.allSizes.group.mx',
          options: [
            'mx_24',
            'mx_25',
            'mx_26',
            'mx_27',
            'mx_28',
            'mx_29',
            'mx_30',
            'mx_31',
            'mx_32',
            'mx_33',
            'mx_34',
          ],
        },
        {
          key: 'us',
          labelTranslationKey: 'ListingField.allSizes.group.us',
          options: ['us_00', 'us_0', 'us_2', 'us_4', 'us_6', 'us_8', 'us_10', 'us_12'],
        },
        {
          key: 'curvy',
          labelTranslationKey: 'ListingField.allSizes.group.curvy',
          options: ['curvy_0x', 'curvy_1x', 'curvy_2x', 'curvy_3x', 'curvy_4x', 'curvy_5x'],
        },

        {
          key: 'shoes',
          labelTranslationKey: 'ListingField.allSizes.group.shoes',
          options: [
            'mx_shoes_22x',
            'mx_shoes_22.5x',
            'mx_shoes_23x',
            'mx_shoes_23.5x',
            'mx_shoes_24x',
            'mx_shoes_24.5x',
            'mx_shoes_25x',
            'mx_shoes_25.5x',
            'mx_shoes_26x',
            'mx_shoes_26.5x',
            'mx_shoes_27x',
            'mx_shoes_27.5x',
            'mx_shoes_28x',
            'mx_shoes_28.5x',
            'mx_shoes_29x',
          ],
        },
        {
          key: 'rings',
          labelTranslationKey: 'ListingField.allSizes.group.rings',
          options: [
            'rings_4',
            'rings_5',
            'rings_6',
            'rings_7',
            'rings_8',
            'rings_9',
            'rings_10',
            'rings_11',
            'rings_12',
          ],
        },
      ],
    },
  },
  color: {
    saveConfig: {
      inputType: 'colorGridPicker',
    },
  },
  brand: {
    saveConfig: {
      inputType: 'searchableSelect',
    },
  },
};
