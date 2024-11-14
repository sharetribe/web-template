import React from 'react';
import { getTimeZoneNames } from '../../../../../util/dates';
import { FieldSelect } from '../../../../../components';

/**
 * Field to allow selecting an IANA time zone name.
 *
 * Note: label is optional, but if it is given, an id is also required so
 * the label can reference the input in the `for` attribute
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className
 * @param {string?} props.rootClassName
 * @param {string?} props.id
 * @param {string?} props.label
 * @param {string} props.name
 * @returns {JSX.Element} containing FieldSelect
 */
const FieldTimeZoneSelect = props => {
  // IANA database contains irrelevant time zones too.
  const relevantZonesPattern = new RegExp(
    '^(Africa|America(?!/(Argentina/ComodRivadavia|Knox_IN|Nuuk))|Antarctica(?!/(DumontDUrville|McMurdo))|Asia(?!/Qostanay)|Atlantic|Australia(?!/(ACT|LHI|NSW))|Europe|Indian|Pacific)'
  );

  return (
    <FieldSelect {...props}>
      <option disabled value="">
        Pick something...
      </option>
      {getTimeZoneNames(relevantZonesPattern).map(tz => (
        <option key={tz} value={tz}>
          {tz}
        </option>
      ))}
    </FieldSelect>
  );
};

export default FieldTimeZoneSelect;
