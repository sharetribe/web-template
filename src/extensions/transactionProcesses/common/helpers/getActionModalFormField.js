import { required } from '../../../../util/validators';
import { FIELD_TEXTAREA } from '../constants';

export const getRefundReasonField = ({ role, name }) => ({
  type: FIELD_TEXTAREA,
  labelTranslationId: 'TransactionPage.RefundField.label',
  name: name || `protectedData.${role}DisputeReason`,
  validators: [
    { validatorFn: required, messageTranslationId: 'TransactionPage.RefundField.requiredMessage' },
  ],
});

// Only for provider
export const getDisputeReasonField = () => ({
  type: FIELD_TEXTAREA,
  labelTranslationId: 'TransactionPage.DisputeField.label',
  name: 'protectedData.providerDisputeReason',
  validators: [
    { validatorFn: required, messageTranslationId: 'TransactionPage.DisputeField.requiredMessage' },
  ],
});
