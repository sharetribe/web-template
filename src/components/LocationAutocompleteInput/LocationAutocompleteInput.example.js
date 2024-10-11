import React, { useState } from 'react';
import { Form as FinalForm, Field } from 'react-final-form';
import { propTypes } from '../../util/types';
import { Button } from '..';
import LocationAutocompleteInput from './LocationAutocompleteInput';

const identity = (v) => v;

function Form(props) {
  return (
    <FinalForm
      {...props}
      render={({ handleSubmit, pristine }) => (
        <form onSubmit={handleSubmit}>
          <label htmlFor="location">Select location:</label>
          <Field name="location" format={identity} component={LocationAutocompleteInput} />
          <Button type="submit" style={{ marginTop: '24px' }} disabled={pristine}>
            Submit
          </Button>
        </form>
      )}
    />
  );
}

function PlaceInfo(props) {
  const { place } = props;
  const { address, origin, bounds } = place;
  return (
    <div>
      <p>Submitted place:</p>
      <ul>
        <li>Address: {address}</li>
        <li>
          Coordinates: {origin.lat}, {origin.lng}
        </li>
        <li>Bounds?: {bounds ? 'yes' : 'no'}</li>
      </ul>
    </div>
  );
}

PlaceInfo.propTypes = { place: propTypes.place.isRequired };

function FormContainer(props) {
  const [location, setLocation] = useState({});
  const onSubmit = (values) => {
    setLocation(values.location);
  };
  const place = location.selectedPlace;
  return (
    <div>
      <p>
        Search for a place name or address, select on with mouse or keyboard, and submit the form.
      </p>
      <Form onSubmit={onSubmit} />
      {place ? <PlaceInfo place={place} /> : null}
    </div>
  );
}

export const Empty = {
  component: FormContainer,
  group: 'inputs',
};
