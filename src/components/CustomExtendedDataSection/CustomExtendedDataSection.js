import React from 'react';

import { SCHEMA_TYPE_MULTI_ENUM, SCHEMA_TYPE_TEXT, SCHEMA_TYPE_YOUTUBE } from '../../util/types';

import SectionDetailsMaybe from './SectionDetailsMaybe';
import SectionTextMaybe from './SectionTextMaybe';
import SectionMultiEnumMaybe from './SectionMultiEnumMaybe';
import SectionYoutubeVideoMaybe from './SectionYoutubeVideoMaybe';

const CustomExtendedDataSection = props => {
  const {
    sectionDetailsProps,
    propsForCustomFields = [],
    idPrefix,
    pickExtendedDataFields,
  } = props;

  return (
    <>
      <SectionDetailsMaybe
        {...sectionDetailsProps}
        pickExtendedDataFields={pickExtendedDataFields}
      />
      {propsForCustomFields.map(customFieldProps => {
        const { schemaType, key, ...fieldProps } = customFieldProps;
        return schemaType === SCHEMA_TYPE_MULTI_ENUM ? (
          <SectionMultiEnumMaybe key={key} idPrefix={idPrefix} {...fieldProps} />
        ) : schemaType === SCHEMA_TYPE_TEXT ? (
          <SectionTextMaybe key={key} {...fieldProps} />
        ) : schemaType === SCHEMA_TYPE_YOUTUBE ? (
          <SectionYoutubeVideoMaybe key={key} {...fieldProps} />
        ) : null;
      })}
    </>
  );
};

export default CustomExtendedDataSection;
