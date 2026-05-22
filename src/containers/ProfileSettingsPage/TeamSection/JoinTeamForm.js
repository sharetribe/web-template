import React from 'react';
import { Form as FinalForm } from 'react-final-form';

// Import contexts and util modules
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { required, composeValidators } from '../../../util/validators';
import { isValidTeamCodeFormat } from '../../../util/teams';

// Import shared components
import { Form, FieldTextInput, PrimaryButton } from '../../../components';

// Import modules from this directory
import css from './TeamSection.module.css';

/**
 * Form for an individual to join a team by entering its code.
 *
 * @component
 * @param {Object} props
 * @param {Function} props.onSubmit called with { teamCode }; should return a Promise
 * @param {boolean} props.inProgress whether a join request is in flight
 * @param {boolean} props.hasError whether the last join attempt failed
 * @returns {JSX.Element}
 */
const JoinTeamForm = props => {
  const intl = useIntl();
  const { onSubmit, inProgress, hasError } = props;

  const codeFormatValid = message => value => (isValidTeamCodeFormat(value) ? undefined : message);

  return (
    <FinalForm
      onSubmit={onSubmit}
      render={({ handleSubmit, form, invalid }) => {
        const submit = values =>
          handleSubmit(values).then(maybeError => {
            // Reset the field only when the join succeeded (no submission error).
            if (!maybeError) {
              form.restart();
            }
            return maybeError;
          });

        return (
          <Form className={css.joinForm} onSubmit={submit}>
            <FieldTextInput
              id="teamCode"
              name="teamCode"
              type="text"
              className={css.joinInput}
              label={intl.formatMessage({ id: 'ProfileSettingsPage.TeamSection.joinLabel' })}
              placeholder={intl.formatMessage({
                id: 'ProfileSettingsPage.TeamSection.joinPlaceholder',
              })}
              validate={composeValidators(
                required(
                  intl.formatMessage({ id: 'ProfileSettingsPage.TeamSection.codeRequired' })
                ),
                codeFormatValid(
                  intl.formatMessage({ id: 'ProfileSettingsPage.TeamSection.codeInvalid' })
                )
              )}
            />
            {hasError ? (
              <p className={css.error}>
                <FormattedMessage id="ProfileSettingsPage.TeamSection.joinError" />
              </p>
            ) : null}
            <PrimaryButton
              className={css.joinButton}
              type="submit"
              inProgress={inProgress}
              disabled={invalid}
            >
              <FormattedMessage id="ProfileSettingsPage.TeamSection.joinButton" />
            </PrimaryButton>
          </Form>
        );
      }}
    />
  );
};

export default JoinTeamForm;
