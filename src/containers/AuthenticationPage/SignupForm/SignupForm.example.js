import React from 'react';
import { fakeIntl } from '../../../util/testData';
import TermsAndConditions from '../TermsAndConditions/TermsAndConditions';
import SignupForm from './SignupForm';

export const Empty = {
  component: SignupForm,
  props: {
    formId: 'SignupFormExample',
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
        intl={fakeIntl}
      />
    ),
  },
  group: 'page:AuthenticationPage',
};
