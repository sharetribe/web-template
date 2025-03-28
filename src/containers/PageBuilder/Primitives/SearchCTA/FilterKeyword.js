import React from 'react';
import { FieldTextInput } from '../../../../components';

const FilterKeyword = props => (
  <div className={props.className}>
    <FieldTextInput name={'keywords'} type="text" placeholder="Search listings" />
  </div>
);
export default FilterKeyword;
