import React from 'react';
import { FieldTextInput } from '../../../components';
import FilterForm from './FilterForm';

const field = formId => (
  <FieldTextInput
    id={`${formId}.field`}
    name="field"
    type="textarea"
    label="Field label"
    placeholder="Write something here"
  />
);

export const FilterFormExample = {
  component: FilterForm,
  props: {
    id: 'FilterFormExample',
    liveEdit: false,
    showAsPopup: true,
    contentPlacementOffset: -14,
    onSubmit: values => {
      console.log(values);
    },
    onCancel: () => {
      console.log('onCancel called');
    },
    onClear: () => {
      console.log('onClear called');
    },
    label: 'Example label',
    children: field('FilterFormExample'),
  },
  group: 'page:SearchPage',
};

export const FilterFormExampleLiveEdit = {
  component: FilterForm,
  props: {
    id: 'FilterFormExampleLiveEdit',
    liveEdit: true,
    showAsPopup: false,
    contentPlacementOffset: -14,
    onChange: values => {
      console.log(values);
    },
    label: 'Example label',
    children: field('FilterFormExampleLiveEdit'),
  },
  group: 'page:SearchPage',
};
