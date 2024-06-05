import React from 'react';
import { fakeIntl } from '../../../util/testData';
import TermsAndConditions from '../TermsAndConditions/TermsAndConditions';
import ConfirmSignupForm from './ConfirmSignupForm';

const authInfo = {
  idpToken: '123',
  email: 'name@example.com',
  firstName: 'Firstname',
  lastName: 'Lastname',
  idpId: 'idpId',
};

const userTypes = [
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

const userFields = [
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
      isRequired: false,
    },
    userTypeConfig: {
      limitToUserTypeIds: false,
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
      isRequired: false,
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
      displayInSignUp: true,
      isRequired: false,
    },
    userTypeConfig: {
      limitToUserTypeIds: false,
    },
  },
];

export const Empty = {
  component: ConfirmSignupForm,
  props: {
    formId: 'ConfirmSignupFormExample',
    authInfo,
    userTypes,
    userFields,
    onSubmit(values) {
      console.log('sign up with form values:', values);
    },
    onOpenTermsOfService() {
      console.log('open terms of service');
    },
    termsAndConditions: (
      <TermsAndConditions
        onOpenTermsOfService={() => setTosModalOpen(true)}
        onOpenPrivacyPolicy={() => setPrivacyModalOpen(true)}
        formId="ConfirmSignupFormExample"
        intl={fakeIntl}
      />
    ),
  },
  group: 'page:AuthenticationPage',
};
