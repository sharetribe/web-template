import React from 'react';
import { string } from 'prop-types';
import { getTimeZoneNames } from '../../../../../util/dates';
import { FieldSelect, FieldIntegerInput } from '../../../../../components';

const FieldComissionInput = props => {
  // IANA database contains irrelevant time zones too.
  const relevantZonesPattern = new RegExp(
    '^(Africa|America(?!/(Argentina/ComodRivadavia|Knox_IN|Nuuk))|Antarctica(?!/(DumontDUrville|McMurdo))|Asia(?!/Qostanay)|Atlantic|Australia(?!/(ACT|LHI|NSW))|Europe|Indian|Pacific)'
  );

  return (
    <FieldIntegerInput {...props}>
      <option disabled value="">
        Pick something...
      </option>
      {getTimeZoneNames(relevantZonesPattern).map(tz => (
        <option key={tz} value={tz}>
          {tz}
        </option>
      ))}
    </FieldIntegerInput>
  );
};

FieldComissionInput.defaultProps = {
  rootClassName: null,
  className: null,
  id: null,
  label: null,
};

FieldComissionInput.propTypes = {
  rootClassName: string,
  className: string,

  // Label is optional, but if it is given, an id is also required so
  // the label can reference the input in the `for` attribute
  id: string,
  label: string,
  name: string.isRequired,
};

export default FieldComissionInput;
