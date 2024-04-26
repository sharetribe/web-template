import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';
import { createCurrentUser, fakeIntl } from '../../../util/testData';
import { initialValuesForUserFields } from '../../../util/userHelpers';

import ProfileSettingsForm from './ProfileSettingsForm';

const { screen, userEvent, fireEvent, cleanup } = testingLibrary;

afterEach(cleanup);

const noop = () => null;

const userTypeConfig = {
  userType: 'a',
  label: 'Seller',
  defaultListingFields: {
    displayName: false,
    phoneNumber: true,
  },
};
const userTypeConfigC = {
  userType: 'c',
  label: 'C',
  defaultListingFields: {
    displayName: false,
    phoneNumber: true,
  },
};
const userTypeConfigE = {
  userType: 'e',
  label: 'E',
  defaultListingFields: {
    displayName: false,
    phoneNumber: true,
  },
};

const userFieldConfig = [
  {
    key: 'enumField1',
    scope: 'public',
    schemaType: 'enum',
    enumOptions: [
      { option: 'e1o1', label: 'e1l1' },
      { option: 'e1o2', label: 'e1l2' },
      { option: 'e1o3', label: 'e1l3' },
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
      { option: 'e2o1', label: 'e2l1' },
      { option: 'e2o2', label: 'e2l2' },
      { option: 'e2o3', label: 'e2l3' },
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
    key: 'longField',
    scope: 'public',
    schemaType: 'long',
    saveConfig: {
      label: 'Long Field',
      displayInSignUp: true,
      isRequired: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['a', 'b'],
    },
  },
  {
    key: 'booleanField',
    scope: 'public',
    schemaType: 'boolean',
    saveConfig: {
      label: 'Boolean Field',
      displayInSignUp: true,
      isRequired: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['c', 'd'],
    },
  },
  {
    key: 'multiEnumField',
    scope: 'public',
    schemaType: 'multi-enum',
    enumOptions: [
      { option: 'mo1', label: 'ml1' },
      { option: 'mo2', label: 'ml2' },
      { option: 'mo3', label: 'ml3' },
    ],
    saveConfig: {
      label: 'Multi-enum Field',
      displayInSignUp: true,
      isRequired: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: false,
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
    key: 'textField2',
    scope: 'public',
    schemaType: 'text',
    saveConfig: {
      label: 'Text Field 2',
      displayInSignUp: true,
      isRequired: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['e', 'f'],
    },
  },
];

const attributes = {
  profile: {
    bio: 'This is my bio!',
    publicData: {
      enumField1: 'o1',
      enumField2: 'o2',
      longField: 123,
      booleanField: true,
      multiEnumField: ['mo1', 'mo2'],
    },
    privateData: {
      textField: 'Text field content',
    },
  },
};

describe('ProfileSettingsForm', () => {
  it('shows inputs and initial values for name', () => {
    const u1 = createCurrentUser('userId');
    const { firstName, lastName } = u1.attributes.profile;
    render(
      <ProfileSettingsForm
        intl={fakeIntl}
        onSubmit={noop}
        uploadInProgress={false}
        updateInProgress={false}
        currentUser={u1}
        profileImage={{}}
        userFields={userFieldConfig}
        userTypeConfig={userTypeConfig}
        initialValues={{
          firstName,
          lastName,
        }}
      />
    );
    expect(
      screen.getByRole('heading', { name: 'ProfileSettingsForm.yourName' })
    ).toBeInTheDocument();
    expect(screen.getByText('ProfileSettingsForm.firstNameLabel')).toBeInTheDocument();
    expect(screen.getByDisplayValue(firstName)).toBeInTheDocument();
    expect(screen.getByText('ProfileSettingsForm.lastNameLabel')).toBeInTheDocument();
    expect(screen.getByDisplayValue(lastName)).toBeInTheDocument();
    expect(screen.getByText('ProfileSettingsForm.bioLabel')).toBeInTheDocument();
  });

  it('shows inputs and initial values for bio', () => {
    const u1 = createCurrentUser('userId', attributes);
    const { bio } = u1.attributes.profile;
    render(
      <ProfileSettingsForm
        intl={fakeIntl}
        onSubmit={noop}
        uploadInProgress={false}
        updateInProgress={false}
        currentUser={u1}
        profileImage={{}}
        userFields={userFieldConfig}
        userTypeConfig={userTypeConfig}
        initialValues={{
          bio,
        }}
      />
    );
    expect(
      screen.getByRole('heading', { name: 'ProfileSettingsForm.bioHeading' })
    ).toBeInTheDocument();
    expect(screen.getByText('ProfileSettingsForm.bioLabel')).toBeInTheDocument();
    expect(screen.getByDisplayValue(bio)).toBeInTheDocument();
  });

  it('shows a select input for enum fields', () => {
    const u1 = createCurrentUser('userId', attributes);
    const { publicData } = u1.attributes.profile;
    render(
      <ProfileSettingsForm
        intl={fakeIntl}
        onSubmit={noop}
        uploadInProgress={false}
        updateInProgress={false}
        currentUser={u1}
        profileImage={{}}
        userFields={userFieldConfig}
        userTypeConfig={userTypeConfig}
        initialValues={{
          ...initialValuesForUserFields(publicData, 'public', 'a', userFieldConfig),
        }}
      />
    );

    expect(screen.getByRole('combobox', { name: 'Enum Field 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'e1l1' }).selected).toBe(true);
  });

  it('shows a select input for boolean fields', () => {
    const u1 = createCurrentUser('userId', attributes);
    const { publicData } = u1.attributes.profile;
    render(
      <ProfileSettingsForm
        intl={fakeIntl}
        onSubmit={noop}
        uploadInProgress={false}
        updateInProgress={false}
        currentUser={u1}
        profileImage={{}}
        userFields={userFieldConfig}
        userTypeConfig={userTypeConfigC}
        initialValues={{
          ...initialValuesForUserFields(publicData, 'public', 'c', userFieldConfig),
        }}
      />
    );

    expect(screen.getByRole('combobox', { name: 'Boolean Field' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'FieldBoolean.yes' }).selected).toBe(true);
  });

  it('shows a numeric input for long fields', () => {
    const u1 = createCurrentUser('userId', attributes);
    const { publicData } = u1.attributes.profile;
    render(
      <ProfileSettingsForm
        intl={fakeIntl}
        onSubmit={noop}
        uploadInProgress={false}
        updateInProgress={false}
        currentUser={u1}
        profileImage={{}}
        userFields={userFieldConfig}
        userTypeConfig={userTypeConfig}
        initialValues={{
          ...initialValuesForUserFields(publicData, 'public', 'a', userFieldConfig),
        }}
      />
    );

    const longInput = screen.getByRole('spinbutton', { name: 'Long Field' });
    expect(longInput).toBeInTheDocument();
    expect(longInput).toHaveValue(123);
  });

  it('shows a textbox input for text fields', () => {
    const u1 = createCurrentUser('userId', attributes);
    const { privateData } = u1.attributes.profile;
    render(
      <ProfileSettingsForm
        intl={fakeIntl}
        onSubmit={noop}
        uploadInProgress={false}
        updateInProgress={false}
        currentUser={u1}
        profileImage={{}}
        userFields={userFieldConfig}
        userTypeConfig={userTypeConfig}
        initialValues={{
          ...initialValuesForUserFields(privateData, 'private', 'a', userFieldConfig),
        }}
      />
    );

    const textFieldInput = screen.getByRole('textbox', { name: 'Text Field' });
    expect(textFieldInput).toBeInTheDocument();
    expect(textFieldInput).toHaveValue('Text field content');
  });

  it('shows a group checkbox input for multi-enum fields', () => {
    const u1 = createCurrentUser('userId', attributes);
    const { publicData } = u1.attributes.profile;
    render(
      <ProfileSettingsForm
        intl={fakeIntl}
        onSubmit={noop}
        uploadInProgress={false}
        updateInProgress={false}
        currentUser={u1}
        profileImage={{}}
        userFields={userFieldConfig}
        userTypeConfig={userTypeConfig}
        initialValues={{
          ...initialValuesForUserFields(publicData, 'public', 'a', userFieldConfig),
        }}
      />
    );

    const multiEnumFieldInput = screen.getByRole('group', { name: 'Multi-enum Field' });
    expect(multiEnumFieldInput).toBeInTheDocument();

    expect(screen.getByRole('checkbox', { name: 'ml1' }).checked).toBe(true);
    expect(screen.getByRole('checkbox', { name: 'ml2' }).checked).toBe(true);
    expect(screen.getByRole('checkbox', { name: 'ml3' }).checked).toBe(false);
  });

  it('shows inputs and initial values for custom user fields by user type', () => {
    const u1 = createCurrentUser('userId', attributes);
    const { publicData } = u1.attributes.profile;
    render(
      <ProfileSettingsForm
        intl={fakeIntl}
        onSubmit={noop}
        uploadInProgress={false}
        updateInProgress={false}
        currentUser={u1}
        profileImage={{}}
        userFields={userFieldConfig}
        userTypeConfig={userTypeConfig}
        initialValues={{
          ...initialValuesForUserFields(publicData, 'public', 'a', userFieldConfig),
        }}
      />
    );

    expect(screen.getByText('Enum Field 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('e1l1')).toBeInTheDocument();
    expect(screen.getByText('Long Field')).toBeInTheDocument();
    expect(screen.getByDisplayValue(123)).toBeInTheDocument();

    // Don't show enum field 2 and boolean field for user type a even if it is in public data
    expect(screen.queryByText('Enum Field 2')).toBeNull();
    expect(screen.queryByText('Boolean Field')).toBeNull();
  });

  it('only shows non-restricted inputs and values for custom user fields if no user type specified', () => {
    const u1 = createCurrentUser('userId', attributes);
    const { publicData, privateData } = u1.attributes.profile;
    render(
      <ProfileSettingsForm
        intl={fakeIntl}
        onSubmit={noop}
        uploadInProgress={false}
        updateInProgress={false}
        currentUser={u1}
        profileImage={{}}
        userFields={userFieldConfig}
        userTypeConfig={null}
        initialValues={{
          ...initialValuesForUserFields(publicData, 'public', null, userFieldConfig),
          ...initialValuesForUserFields(privateData, 'private', null, userFieldConfig),
        }}
      />
    );

    expect(screen.getByText('Text Field')).toBeInTheDocument();
    expect(screen.getByText('Text field content')).toBeInTheDocument();
    expect(screen.getByText('Multi-enum Field')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'ml1' }).checked).toBe(true);
    expect(screen.getByRole('checkbox', { name: 'ml2' }).checked).toBe(true);

    // Don't show user-type-restricted fields even if it is in public data
    expect(screen.queryByText('Enum Field 1')).toBeNull();
    expect(screen.queryByDisplayValue('e1l1')).toBeNull();
    expect(screen.queryByText('Long Field')).toBeNull();
    expect(screen.queryByDisplayValue(123)).toBeNull();
  });

  it('enables Save button when required fields are filled', () => {
    const user = createCurrentUser('userId');
    const u1 = {
      ...user,
      attributes: {
        ...user.attributes,
        profile: {
          ...user.attributes.profile,
          ...attributes.profile,
        },
      },
    };

    const { firstName, lastName, publicData } = u1.attributes.profile;
    render(
      <ProfileSettingsForm
        intl={fakeIntl}
        onSubmit={noop}
        uploadInProgress={false}
        updateInProgress={false}
        currentUser={u1}
        profileImage={{}}
        userFields={userFieldConfig}
        userTypeConfig={userTypeConfigE}
        initialValues={{
          firstName,
          lastName,
          ...initialValuesForUserFields(publicData, 'public', 'e', userFieldConfig),
        }}
      />
    );

    // Save button should be disabled before changes.
    expect(screen.getByRole('button', { name: 'ProfileSettingsForm.saveChanges' })).toBeDisabled();

    // Expect the initial values to be in the document before any changes
    expect(screen.getByText('ProfileSettingsForm.firstNameLabel')).toBeInTheDocument();
    expect(screen.getByDisplayValue(firstName)).toBeInTheDocument();
    expect(screen.getByText('ProfileSettingsForm.lastNameLabel')).toBeInTheDocument();
    expect(screen.getByDisplayValue(lastName)).toBeInTheDocument();
    expect(screen.getByText('Multi-enum Field')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'ml1' }).checked).toBe(true);
    expect(screen.getByRole('checkbox', { name: 'ml2' }).checked).toBe(true);

    // Two required fields missing, textField and textField2.
    // First, enter text into textField and check that the save button remains
    // disabled, since another required field is still empty
    const textInput1 = screen.getByRole('textbox', { name: 'Text Field' });
    userEvent.type(textInput1, 'Text 1 value');
    expect(textInput1).toHaveValue('Text 1 value');
    expect(screen.getByRole('button', { name: 'ProfileSettingsForm.saveChanges' })).toBeDisabled();

    // Enter text into the other required text field, and check that the
    // save button is now enabled, since all required fields have values.
    const textInput2 = screen.getByRole('textbox', { name: 'Text Field 2' });
    userEvent.type(textInput2, 'Text 2 value');
    expect(textInput2).toHaveValue('Text 2 value');
    expect(screen.getByRole('button', { name: 'ProfileSettingsForm.saveChanges' })).toBeEnabled();
  });
});
