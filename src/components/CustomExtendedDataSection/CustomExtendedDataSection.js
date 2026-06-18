import React from 'react';

import { SCHEMA_TYPE_MULTI_ENUM, SCHEMA_TYPE_TEXT, SCHEMA_TYPE_YOUTUBE } from '../../util/types';

import SectionDetails from './SectionDetails';
import SectionText from './SectionText';
import SectionMultiEnum from './SectionMultiEnum';
import SectionColor from './SectionColor';
import SectionAllSizes from './SectionAllSizes';
import SectionYoutubeVideo from './SectionYoutubeVideo';

// AV: multi-enum fields that render with a custom display component instead of
// the default SectionMultiEnum, dispatched by field key.
const MULTI_ENUM_COMPONENTS_BY_KEY = {
  color: SectionColor,
  all_sizes: SectionAllSizes,
};

/**
 * This component displays extended data that corresponds to asset based custom field
 * configurations. It can be used for displaying listing, user, and transaction custom fields.
 * - Fields with schema types enum, long, and boolean are displayed with a SectionDetails
 *   subcomponent
 * - Fields with schema type multi-enum, text, and youtubeVideoUrl are each displayed
 *   with dedicated subcomponents
 *
 * @param {Object} props props for the component:
 *   - sectionDetailsProps (Object) is passed directly to SectionDetails component
 *   - propsForCustomFields (Array) can be constructed with the pickCustomFieldProps helper
 *   - page is used to set translation key prefixes and component ids
 *   - pickExtendedDataFields is an entity-specific function that determines what data
 *     is selected to be picked from the entity's extended data
 * @return A component that displays the existing extended data according to
 * the provided field configuration
 */
const CustomExtendedDataSection = props => {
  const {
    sectionDetailsProps,
    propsForCustomFields = [],
    idPrefix,
    pickExtendedDataFields,
    className,
    rootClassName,
  } = props;

  return (
    <>
      <SectionDetails {...sectionDetailsProps} pickExtendedDataFields={pickExtendedDataFields} />
      {propsForCustomFields.map(customFieldProps => {
        const { schemaType, key, ...fieldProps } = customFieldProps;
        const MultiEnumByKey = MULTI_ENUM_COMPONENTS_BY_KEY[key];
        return schemaType === SCHEMA_TYPE_MULTI_ENUM && MultiEnumByKey ? (
          <MultiEnumByKey
            key={key}
            className={className}
            rootClassName={rootClassName}
            {...fieldProps}
          />
        ) : schemaType === SCHEMA_TYPE_MULTI_ENUM ? (
          <SectionMultiEnum
            key={key}
            idPrefix={idPrefix}
            className={className}
            rootClassName={rootClassName}
            {...fieldProps}
          />
        ) : schemaType === SCHEMA_TYPE_TEXT ? (
          <SectionText
            key={key}
            className={className}
            rootClassName={rootClassName}
            {...fieldProps}
          />
        ) : schemaType === SCHEMA_TYPE_YOUTUBE ? (
          <SectionYoutubeVideo
            key={key}
            className={className}
            rootClassName={rootClassName}
            {...fieldProps}
          />
        ) : null;
      })}
    </>
  );
};

export default CustomExtendedDataSection;
