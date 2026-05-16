// Display-only overrides for listing fields defined in configListing.js.
// These do NOT affect backend search schema — only how the form input is rendered.
// Option keys in groups[*].options must match enumOptions keys in configListing.js.
// Labels are resolved through React Intl and canonical listing field enumOptions.
export const listingFieldDisplayOverrides = {
  all_sizes: {
    saveConfig: {
      inputType: 'groupedMultiSelect',
      groups: [
        {
          key: 'standard',
          labelTranslationKey: 'ListingField.allSizes.group.standard',
          options: ['unitalla', 'xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'],
        },
        {
          key: 'mx',
          labelTranslationKey: 'ListingField.allSizes.group.mx',
          options: [
            'mx_22',
            'mx_24',
            'mx_26',
            'mx_28',
            'mx_30',
            'mx_32',
            'mx_34',
            'mx_36',
            'mx_38',
            'mx_40',
            'mx_42',
            'mx_44',
          ],
        },
        {
          key: 'us',
          labelTranslationKey: 'ListingField.allSizes.group.us',
          options: [
            'us_00',
            'us_0',
            'us_2',
            'us_4',
            'us_6',
            'us_8',
            'us_10',
            'us_12',
            'us_14',
            'us_16',
          ],
        },
        {
          key: 'curvy',
          labelTranslationKey: 'ListingField.allSizes.group.curvy',
          options: ['curvy_1x', 'curvy_2x', 'curvy_3x', 'curvy_4x', 'curvy_5x', 'curvy_6x'],
        },
      ],
    },
  },
  color: {
    saveConfig: {
      inputType: 'colorGridPicker',
    },
  },
};
