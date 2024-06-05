/* eslint-disable no-console */
import React from 'react';
import { Form as FinalForm, FormSpy } from 'react-final-form';

import { pickInitialValuesForFieldSelectTree } from '../../util/search';
import * as validators from '../../util/validators';

import { Button } from '../../components';

import FieldSelectTree from './FieldSelectTree';

const config = {
  options: [
    {
      option: 'dogs',
      label: 'Dogs',
      suboptions: [
        {
          option: 'labradors',
          label: 'Labradors',
        },
        {
          option: 'poodles',
          label: 'Poodles',
        },
      ],
    },
    {
      option: 'cats',
      label: 'Cats',
      suboptions: [
        {
          option: 'burmese',
          label: 'Burmese cats',
        },
        {
          option: 'egyptian-mau',
          label: 'Egyptian mau',
        },
      ],
    },
    {
      option: 'fish',
      label: 'Fish',
      suboptions: [
        {
          option: 'freshwater',
          label: 'Freshwater',
          suboptions: [
            {
              option: 'grayling',
              label: 'Grayling',
            },
            {
              option: 'arctic-char',
              label: 'Arctic char',
            },
            {
              option: 'pike',
              label: 'Pike',
            },
          ],
        },
        {
          option: 'saltwater',
          label: 'Saltwater',
          suboptions: [
            {
              option: 'tuna',
              label: 'Tuna',
            },
            {
              option: 'cod',
              label: 'Cod',
            },
          ],
        },
        {
          option: 'euryhaline',
          label: 'Euryhaline fish',
          suboptions: [
            {
              option: 'salmon',
              label: 'Salmon',
            },
            {
              option: 'trout',
              label: 'Trout',
            },
            {
              option: 'european-eel',
              label: 'European eel',
            },
          ],
        },
      ],
    },
    {
      option: 'birds',
      label: 'Birds',
      suboptions: [
        {
          option: 'parrot',
          label: 'Parrot',
        },
        {
          option: 'macaw',
          label: 'Macaw',
        },
      ],
    },
    {
      option: 'reptiles',
      label: 'Reptiles',
      suboptions: [
        {
          option: 'lizards',
          label: 'Lizards',
        },
        {
          option: 'snakes',
          label: 'Snakes',
        },
      ],
    },
  ],
};

const FormComponent = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const { handleSubmit, onChange, invalid, pristine, submitting } = formRenderProps;
      const submitDisabled = submitting; //invalid || pristine || submitting;
      const required = validators.requiredSelectTreeOption('This field is required');
      return (
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit(e);
          }}
        >
          <FormSpy onChange={onChange} />
          <FieldSelectTree
            label="Nested options"
            name="nestedLevel"
            options={config.options}
            validate={required}
          />
          <Button style={{ marginTop: 24 }} type="submit" disabled={submitDisabled}>
            Submit
          </Button>
        </form>
      );
    }}
  />
);

const initialData = {}; //{ nestedLevel1: 'women', nestedLevel2: 'jackets', foo: 'bar' };

export const SelectNested = {
  component: FormComponent,
  props: {
    initialValues: {
      nestedLevel: pickInitialValuesForFieldSelectTree('nestedLevel', initialData),
    },
    onChange: formState => {
      const nestedLevel = formState.values?.nestedLevel;
      if (nestedLevel && Object.values(nestedLevel)?.length > 0) {
        console.log('field value changed to:', formState.values.nestedLevel);
      }
    },
    onSubmit: values => {
      console.log('submit values:', values);
      return false;
    },
  },
  group: 'inputs',
};
