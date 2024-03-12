export const userFields = [
  {
    key: 'cuisine',
    label: 'Favorite cuisine',
    scope: 'public',
    schemaType: 'enum',
    enumOptions: [
      { option: 'italian', label: 'Italian' },
      { option: 'chinese', label: 'Chinese' },
      { option: 'thai', label: 'Thai' },
    ],
    showConfig: {
      displayInProfile: true, // key might change
    },
    saveConfig: {
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
    label: 'Can you cook?',
    scope: 'public',
    schemaType: 'boolean',
    showConfig: {
      displayInProfile: true, // key might change
    },
    saveConfig: {
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
    label: 'How many cookbooks do you have',
    scope: 'public',
    schemaType: 'long',
    showConfig: {
      displayInProfile: true, // key might change
    },
    saveConfig: {
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
    label: 'Description of your kitchen',
    scope: 'public',
    schemaType: 'text',
    showConfig: {
      displayInProfile: true, // key might change
    },
    saveConfig: {
      displayInSignUp: true, // key might change
      required: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['a', 'b', 'c'],
    },
  },
  {
    key: 'dietaryPreferences',
    label: 'Dietary preferences',
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
      displayInProfile: true, // key might change
    },
    saveConfig: {
      displayInSignUp: true, // key might change
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
