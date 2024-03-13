import {
  pickUserFieldsData,
  initialValuesForUserFields,
  getCustomUserFieldInputs,
} from './userHelpers';

import { fakeIntl } from './testData';

const config = [
  {
    key: 'enumField1',
    label: 'Enum Field 1',
    scope: 'public',
    schemaType: 'enum',
    enumOptions: [
      { option: 'o1', label: 'l1' },
      { option: 'o2', label: 'l2' },
      { option: 'o3', label: 'l3' },
    ],
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['a', 'b'],
    },
  },
  {
    key: 'enumField2',
    label: 'Enum Field 2',
    scope: 'public',
    schemaType: 'enum',
    enumOptions: [
      { option: 'o1', label: 'l1' },
      { option: 'o2', label: 'l2' },
      { option: 'o3', label: 'l3' },
    ],
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['c', 'd'],
    },
  },
  {
    key: 'textField',
    label: 'Text Field',
    scope: 'private',
    schemaType: 'text',
    userTypeConfig: {
      limitToUserTypeIds: false,
    },
  },
  {
    key: 'booleanField',
    label: 'Boolean Field',
    scope: 'protected',
    schemaType: 'boolean',
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
      label: `Enum Field ${n}`,
      schemaType: 'enum',
      scope: 'public',
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
      label: 'Text Field',
      schemaType: 'text',
      scope: 'private',
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
      label: 'Boolean Field',
      schemaType: 'boolean',
      scope: 'protected',
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

  describe('getCustomUserFieldInputs', () => {
    it('returns the correct input config if no user type is specified', () => {
      const inputConfig1 = getCustomUserFieldInputs(config, fakeIntl);
      const sharedConfig = [
        {
          key: 'priv_textField',
          name: 'priv_textField',
          fieldConfig: {
            key: 'textField',
            label: 'Text Field',
            schemaType: 'text',
            scope: 'private',
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
            label: 'Boolean Field',
            schemaType: 'boolean',
            scope: 'protected',
            userTypeConfig: {
              limitToUserTypeIds: false,
            },
          },
          defaultRequiredMessage: 'CustomExtendedDataField.required',
        },
      ];

      expect(inputConfig1).toEqual(sharedConfig);
    });

    it('returns the correct input config based on user type', () => {
      const inputConfig1 = getCustomUserFieldInputs(config, fakeIntl, 'a');
      const inputConfig2 = getCustomUserFieldInputs(config, fakeIntl, 'c');

      expect(inputConfig1).toEqual(expectedUserFieldInput(1, ['a', 'b']));
      expect(inputConfig2).toEqual(expectedUserFieldInput(2, ['c', 'd']));
    });
  });
});
