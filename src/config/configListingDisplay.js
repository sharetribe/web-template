// Display-only overrides for listing fields defined in configListing.js.
// These do NOT affect backend search schema — only how the form input is rendered.
// Option keys in groups[*].options must match enumOptions keys in configListing.js.
export const listingFieldDisplayOverrides = {
  all_sizes: {
    saveConfig: {
      inputType: 'groupedMultiSelect',
      groups: [
        {
          key: 'standard',
          label: 'Ropa (Estándar)',
          options: [
            { option: 'unitalla', label: 'Unitalla' },
            { option: 'xxs', label: 'XXS' },
            { option: 'xs', label: 'XS' },
            { option: 's', label: 'S' },
            { option: 'm', label: 'M' },
            { option: 'l', label: 'L' },
            { option: 'xl', label: 'XL' },
            { option: 'xxl', label: 'XXL' },
            { option: 'xxxl', label: 'XXXL' },
          ],
        },
        {
          key: 'mx',
          label: 'Ropa (MX)',
          options: [
            { option: 'mx_22', label: 'MX 22' },
            { option: 'mx_24', label: 'MX 24' },
            { option: 'mx_26', label: 'MX 26' },
            { option: 'mx_28', label: 'MX 28' },
            { option: 'mx_30', label: 'MX 30' },
            { option: 'mx_32', label: 'MX 32' },
            { option: 'mx_34', label: 'MX 34' },
            { option: 'mx_36', label: 'MX 36' },
            { option: 'mx_38', label: 'MX 38' },
            { option: 'mx_40', label: 'MX 40' },
            { option: 'mx_42', label: 'MX 42' },
            { option: 'mx_44', label: 'MX 44' },
          ],
        },
        {
          key: 'us',
          label: 'Ropa (US)',
          options: [
            { option: 'us_00', label: 'US 00' },
            { option: 'us_0', label: 'US 0' },
            { option: 'us_2', label: 'US 2' },
            { option: 'us_4', label: 'US 4' },
            { option: 'us_6', label: 'US 6' },
            { option: 'us_8', label: 'US 8' },
            { option: 'us_10', label: 'US 10' },
            { option: 'us_12', label: 'US 12' },
            { option: 'us_14', label: 'US 14' },
            { option: 'us_16', label: 'US 16' },
          ],
        },
        {
          key: 'curvy',
          label: 'Tallas Curvy',
          options: [
            { option: 'curvy_1x', label: '1X' },
            { option: 'curvy_2x', label: '2X' },
            { option: 'curvy_3x', label: '3X' },
            { option: 'curvy_4x', label: '4X' },
            { option: 'curvy_5x', label: '5X' },
            { option: 'curvy_6x', label: '6X' },
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
};
