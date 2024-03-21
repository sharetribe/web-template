import {
  pickUserFieldsData,
  initialValuesForUserFields,
  getPropsForCustomUserFieldInputs,
} from './userHelpers';

import { fakeIntl } from './testData';

const config = [
  {
    key: 'enumField1',
    scope: 'public',
    schemaType: 'enum',
    enumOptions: [
      { option: 'o1', label: 'l1' },
      { option: 'o2', label: 'l2' },
      { option: 'o3', label: 'l3' },
    ],
    saveConfig: {
      label: 'Enum Field 1',
      displayInSignUp: true,
      isRequired: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['a', 'b'],
    },
  },
  {
    key: 'enumField2',
    scope: 'public',
    schemaType: 'enum',
    enumOptions: [
      { option: 'o1', label: 'l1' },
      { option: 'o2', label: 'l2' },
      { option: 'o3', label: 'l3' },
    ],
    saveConfig: {
      label: 'Enum Field 2',
      displayInSignUp: true,
      isRequired: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['c', 'd'],
    },
  },
  {
    key: 'textField',
    scope: 'private',
    schemaType: 'text',
    saveConfig: {
      label: 'Text Field',
      displayInSignUp: true,
      isRequired: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: false,
    },
  },
  {
    key: 'booleanField',
    scope: 'protected',
    schemaType: 'boolean',
    saveConfig: {
      label: 'Boolean Field',
      displayInSignUp: false,
      isRequired: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: false,
    },
  },
];

const userProfile1 = {
  publicData: {
    enumField1: 'o1',
    enumField2: 'o1',
    userType: 'a',
  },
  privateData: {
    textField: 'Text content 1',
  },
  protectedData: {
    booleanField: true,
  },
};

const userProfile2 = {
  publicData: {
    enumField1: 'o2',
    enumField2: 'o2',
    userType: 'c',
  },
  privateData: {
    textField: 'Text content 2',
  },
  protectedData: {
    booleanField: false,
  },
};

const formData = {
  pub_enumField1: 'o1',
  priv_textField: 'Form entry',
  prot_booleanField: false,
};

const expectedUserFieldInput = (n, userTypeArray) => [
  {
    key: `pub_enumField${n}`,
    name: `pub_enumField${n}`,
    defaultRequiredMessage: 'CustomExtendedDataField.required',
    fieldConfig: {
      enumOptions: [
        { label: 'l1', option: 'o1' },
        { label: 'l2', option: 'o2' },
        { label: 'l3', option: 'o3' },
      ],
      key: `enumField${n}`,
      schemaType: 'enum',
      scope: 'public',
      saveConfig: {
        label: `Enum Field ${n}`,
        displayInSignUp: true,
        isRequired: true,
      },
      userTypeConfig: {
        limitToUserTypeIds: true,
        userTypeIds: userTypeArray,
      },
    },
  },
  {
    key: 'priv_textField',
    name: 'priv_textField',
    fieldConfig: {
      key: 'textField',
      schemaType: 'text',
      scope: 'private',
      saveConfig: {
        label: 'Text Field',
        displayInSignUp: true,
        isRequired: true,
      },
      userTypeConfig: {
        limitToUserTypeIds: false,
      },
    },
    defaultRequiredMessage: 'CustomExtendedDataField.required',
  },
  {
    key: 'prot_booleanField',
    name: 'prot_booleanField',
    fieldConfig: {
      key: 'booleanField',
      schemaType: 'boolean',
      scope: 'protected',
      saveConfig: {
        label: 'Boolean Field',
        displayInSignUp: false,
        isRequired: true,
      },
      userTypeConfig: {
        limitToUserTypeIds: false,
      },
    },
    defaultRequiredMessage: 'CustomExtendedDataField.required',
  },
];

describe('userHelpers', () => {
  describe('pickUserFieldsData', () => {
    it('returns correct fields per user type for public data', () => {
      const data = pickUserFieldsData(formData, 'public', 'a', config);
      const expectedData = {
        enumField1: 'o1',
        enumField2: null,
      };

      expect(data).toEqual(expectedData);
    });

    it('returns correct fields for private data', () => {
      const data = pickUserFieldsData(formData, 'private', 'a', config);
      const expectedData = {
        textField: 'Form entry',
      };

      expect(data).toEqual(expectedData);
    });

    it('returns correct fields for protected data', () => {
      const data = pickUserFieldsData(formData, 'protected', 'a', config);
      const expectedData = {
        booleanField: false,
      };

      expect(data).toEqual(expectedData);
    });
  });

  describe('initialValuesForUserFields', () => {
    it('returns the correct set of fields based on user type', () => {
      const initialValues1 = initialValuesForUserFields(
        userProfile1.publicData,
        'public',
        'a',
        config
      );
      const initialValues2 = initialValuesForUserFields(
        userProfile2.publicData,
        'public',
        'c',
        config
      );

      const expectedData1 = {
        pub_enumField1: 'o1',
      };

      const expectedData2 = {
        pub_enumField2: 'o2',
      };
      expect(initialValues1).toEqual(expectedData1);
      expect(initialValues2).toEqual(expectedData2);
    });

    it('returns the correct set of fields based on scope', () => {
      const initialValuesPublic = initialValuesForUserFields(
        userProfile1.publicData,
        'public',
        'a',
        config
      );
      const initialValuesPrivate = initialValuesForUserFields(
        userProfile1.privateData,
        'private',
        'a',
        config
      );

      const initialValuesProtected = initialValuesForUserFields(
        userProfile2.protectedData,
        'protected',
        'a',
        config
      );

      const expectedDataPublic = {
        pub_enumField1: 'o1',
      };

      const expectedDataPrivate = {
        priv_textField: 'Text content 1',
      };

      const expectedDataProtected = {
        prot_booleanField: false,
      };

      expect(initialValuesPublic).toEqual(expectedDataPublic);
      expect(initialValuesPrivate).toEqual(expectedDataPrivate);
      expect(initialValuesProtected).toEqual(expectedDataProtected);
    });
  });

  describe('getPropsForCustomUserFieldInputs', () => {
    it('returns the correct input config if no user type is specified in a non-signup setting', () => {
      const inputConfig1 = getPropsForCustomUserFieldInputs(config, fakeIntl, null, false);
      const sharedConfig = [
        {
          key: 'priv_textField',
          name: 'priv_textField',
          fieldConfig: {
            key: 'textField',
            schemaType: 'text',
            scope: 'private',
            saveConfig: {
              label: 'Text Field',
              displayInSignUp: true,
              isRequired: true,
            },
            userTypeConfig: {
              limitToUserTypeIds: false,
            },
          },
          defaultRequiredMessage: 'CustomExtendedDataField.required',
        },
        {
          key: 'prot_booleanField',
          name: 'prot_booleanField',
          fieldConfig: {
            key: 'booleanField',
            schemaType: 'boolean',
            scope: 'protected',
            saveConfig: {
              label: 'Boolean Field',
              displayInSignUp: false,
              isRequired: true,
            },
            userTypeConfig: {
              limitToUserTypeIds: false,
            },
          },
          defaultRequiredMessage: 'CustomExtendedDataField.required',
        },
      ];

      expect(inputConfig1).toEqual(sharedConfig);
    });

    it('returns the correct input config based on user type in a non-signup setting', () => {
      const inputConfig1 = getPropsForCustomUserFieldInputs(config, fakeIntl, 'a', false);
      const inputConfig2 = getPropsForCustomUserFieldInputs(config, fakeIntl, 'c', false);

      expect(inputConfig1).toEqual(expectedUserFieldInput(1, ['a', 'b']));
      expect(inputConfig2).toEqual(expectedUserFieldInput(2, ['c', 'd']));
    });

    it('returns the correct input config if no user type is specified in a signup setting', () => {
      const inputConfig1 = getPropsForCustomUserFieldInputs(config, fakeIntl);
      const sharedConfig = [
        {
          key: 'priv_textField',
          name: 'priv_textField',
          fieldConfig: {
            key: 'textField',
            schemaType: 'text',
            scope: 'private',
            saveConfig: {
              label: 'Text Field',
              displayInSignUp: true,
              isRequired: true,
            },
            userTypeConfig: {
              limitToUserTypeIds: false,
            },
          },
          defaultRequiredMessage: 'CustomExtendedDataField.required',
        },
      ];

      expect(inputConfig1).toEqual(sharedConfig);
    });

    it('returns the correct input config based on user type in a signup setting', () => {
      const inputConfig1 = getPropsForCustomUserFieldInputs(config, fakeIntl, 'a');
      const inputConfig2 = getPropsForCustomUserFieldInputs(config, fakeIntl, 'c');

      const filterFn = f => f.fieldConfig.saveConfig.displayInSignUp;
      const filteredConfig1 = expectedUserFieldInput(1, ['a', 'b']).filter(filterFn);
      expect(inputConfig1).toEqual(filteredConfig1);
      const filteredConfig2 = expectedUserFieldInput(2, ['c', 'd']).filter(filterFn);
      expect(inputConfig2).toEqual(filteredConfig2);
    });
  });
});
