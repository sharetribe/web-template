import React, { useState } from 'react';
import { bool, node } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import { slackNotifications } from '../../../util/api';
import { useIntl } from 'react-intl';
import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';
import { Form, PrimaryButton, FieldTextInput } from '../../../components';
import { useHistory } from 'react-router-dom'; // Use useHistory for react-router v5

import css from './BsignupForm.module.css';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BsignupFormComponent = (props) => {
  const intl = useIntl();
  const history = useHistory();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    website: '',
    businessType: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (values) => {
    try {
      const payloadMessage = {
        name: formData.name,
        email: formData.email,
        address: formData.address,
        website: formData.website,
        city: formData.businessType,
      };

      await slackNotifications({ ...payloadMessage, isProvider: true });

      const { data, error } = await supabase
        .from('providers')
        .insert([payloadMessage], { returning: 'minimal' })
        .select();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A provider with this email already exists.');
        } else {
          throw error;
        }
      }

      setIsSubmitted(true);

      // Delay navigation to "/" for 2 seconds after displaying the success message
      setTimeout(() => {
        history.push('/'); // Use history.push for navigation
      }, 2000);

      return { success: true, data };
    } catch (error) {
      console.error('Error:', error.message);
      alert(`An error occurred: ${error.message}`);
      return { success: false, message: error.message };
    }
  };

  return (
    <FinalForm
      {...props}
      mutators={{ ...arrayMutators }}
      onSubmit={handleFormSubmit}
      render={(fieldRenderProps) => {
        const { handleSubmit, termsAndConditions } = fieldRenderProps;

        return (
          <div>
            {isSubmitted ? (
              <div className={css.successMessage}>
                <div className={css.successContent}>
                  <h3>
                    {intl.formatMessage({
                      id: 'BusinessForm.successMessage',
                    })}
                  </h3>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: '20px 0' }}>
                    {intl.formatMessage({
                      id: 'BusinessForm.intro',
                    })}
                  </h3>
                  <div style={{ margin: '20px 0' }}>
                    {intl.formatMessage({
                      id: 'BusinessForm.intro2',
                    })}
                  </div>
                  <label>
                    {intl.formatMessage({
                      id: 'BusinessForm.name',
                    })}
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder={intl.formatMessage({
                        id: 'BusinessForm.name.placeholder',
                      })}
                    />
                  </label>
                </div>
                <div>
                  <label>
                    {intl.formatMessage({
                      id: 'BusinessForm.email',
                    })}
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={intl.formatMessage({
                        id: 'BusinessForm.email.placeholder',
                      })}
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>
                    {intl.formatMessage({
                      id: 'BusinessForm.city',
                    })}
                    <input
                      type="text"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      required
                      placeholder={intl.formatMessage({
                        id: 'BusinessForm.city.placeholder',
                      })}
                    />
                  </label>
                </div>
                <div>
                  <label>
                    {intl.formatMessage({
                      id: 'BusinessForm.address',
                    })}
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      placeholder={intl.formatMessage({
                        id: 'BusinessForm.address.placeholder',
                      })}
                    />
                  </label>
                </div>
                <div>
                  <label>
                    {intl.formatMessage({
                      id: 'BusinessForm.social',
                    })}
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      required
                      placeholder={intl.formatMessage({
                        id: 'BusinessForm.social.placeholder',
                      })}
                    />
                  </label>
                </div>
                <div className={css.bottomWrapper}>
                  {termsAndConditions}
                  <PrimaryButton type="submit">
                    {intl.formatMessage({
                      id: 'BusinessForm.type.button',
                    })}
                  </PrimaryButton>
                </div>
              </form>
            )}
          </div>
        );
      }}
    />
  );
};

BsignupFormComponent.defaultProps = { inProgress: false };

BsignupFormComponent.propTypes = {
  inProgress: bool,
  termsAndConditions: node.isRequired,
  intl: intlShape.isRequired,
};

const BsignupForm = compose(injectIntl)(BsignupFormComponent);
BsignupForm.displayName = 'bSignupForm';

export default BsignupForm;
