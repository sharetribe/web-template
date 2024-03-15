export const userFields = [
  {
    key: 'cuisine',
    scope: 'public',
    schemaType: 'enum',
    enumOptions: [
      { option: 'italian', label: 'Italian' },
      { option: 'chinese', label: 'Chinese' },
      { option: 'thai', label: 'Thai' },
    ],
    showConfig: {
      label: 'Favorite cuisine',
      displayInProfile: true, // key might change
    },
    saveConfig: {
      label: 'Favorite cuisine',
      displayInSignUp: true, // key might change
      required: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['a', 'b', 'c'],
    },
  },
  {
    key: 'canCook',
    scope: 'public',
    schemaType: 'boolean',
    showConfig: {
      label: 'Can you cook?',
      displayInProfile: true, // key might change
    },
    saveConfig: {
      label: 'Can you cook?',
      displayInSignUp: true, // key might change
      required: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['a', 'b', 'c'],
    },
  },
  {
    key: 'numberOfCookbooks',
    scope: 'public',
    schemaType: 'long',
    showConfig: {
      label: 'How many cookbooks do you have',
      displayInProfile: true, // key might change
    },
    saveConfig: {
      label: 'How many cookbooks do you have',
      displayInSignUp: true, // key might change
      required: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['a', 'b', 'c'],
    },
  },
  {
    key: 'kitchenDescription',
    scope: 'public',
    schemaType: 'text',
    showConfig: {
      label: 'Description of your kitchen',
      displayInProfile: true, // key might change
    },
    saveConfig: {
      label: 'Description of your kitchen',
      displayInSignUp: true, // key might change
      required: true,
    },
    userTypeConfig: {
      label: 'Description of your kitchen',
      limitToUserTypeIds: true,
      userTypeIds: ['a', 'b', 'c'],
    },
  },
  {
    key: 'dietaryPreferences',
    scope: 'public',
    schemaType: 'multi-enum',
    enumOptions: [
      { option: 'vegan', label: 'Vegan' },
      { option: 'vegetarian', label: 'Vegetarian' },
      { option: 'gluten-free', label: 'Gluten free' },
      { option: 'dairy-free', label: 'Dairy free' },
      { option: 'nut-free', label: 'Nut free' },
      { option: 'egg-free', label: 'Egg free' },
      { option: 'low-carb', label: 'Low carb' },
      { option: 'low-fat', label: 'Low fat' },
    ],
    showConfig: {
      label: 'Dietary preferences',
      displayInProfile: true, // key might change
    },
    saveConfig: {
      displayInSignUp: true, // key might change
      label: 'Dietary preferences',
      required: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['a', 'b', 'c'],
    },
  },
];

export const userTypes = [
  {
    userType: 'a',
    label: 'Seller',
  },
  {
    userType: 'b',
    label: 'Buyer',
  },
  {
    userType: 'c',
    label: 'Guest',
  },
  {
    userType: 'd',
    label: 'Host',
  },
];
