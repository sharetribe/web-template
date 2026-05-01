import React from 'react';
import '@testing-library/jest-dom';

import { pickCategoryFields } from '../../../../util/fieldHelpers';
import { fakeIntl } from '../../../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';

import EditListingDetailsForm from './EditListingDetailsForm';

const { screen, userEvent } = testingLibrary;

const noop = () => null;

const selectableListingTypes = [
  {
    listingType: 'entire-home',
    transactionProcessAlias: 'default-booking/release-1',
    unitType: 'day',
  },
];

const defaultProps = {
  intl: fakeIntl,
  dispatch: noop,
  onListingTypeChange: noop,
  onSubmit: v => v,
  saveActionMsg: 'Next',
  updated: false,
  updateInProgress: false,
  disabled: false,
  ready: false,
  listingFieldsConfig: [],
  categoryPrefix: 'categoryLevel',
  selectableCategories: [],
  pickSelectedCategories: values => pickCategoryFields(values, 'categoryLevel', 1, []),
  selectableListingTypes,
  hasExistingListingType: true,
  initialValues: selectableListingTypes[0],
  marketplaceCurrency: 'EUR',
};

const REQUIRED_AMENITY_LABELS = [
  '24-hour manned security',
  'Perimeter wall + solid gate',
  'Alarm system + panic button',
  'CCTV cameras',
  'Water storage tank / borehole',
  'WiFi',
  'Secure parking (min. 1 space)',
  'Kitchen',
  'Washing machine',
  'Concierge or estate management',
  'Hot water supply',
  'Fully furnished',
];

const PREMIUM_AMENITY_LABELS = [
  'Backup generator or power',
  'Swimming pool',
  'Gym / fitness centre',
  'Rooftop or outdoor common area',
  'Private patio or balcony',
  'Weekly cleaning service',
  'Smart TV',
];

const OPTIONAL_AMENITY_LABELS = [
  'Pet-friendly',
  'Air conditioning',
  'Dedicated workspace',
];

const fillTextFields = async user => {
  await user.type(
    screen.getByRole('textbox', { name: /EditListingDetailsForm\.title/i }),
    'My Apartment'
  );
  await user.type(
    screen.getByRole('textbox', { name: /EditListingDetailsForm\.description/i }),
    'A great place to stay.'
  );
};

const checkAllRequiredAmenities = async user => {
  for (const label of REQUIRED_AMENITY_LABELS) {
    await user.click(screen.getByLabelText(label));
  }
};

describe('EditListingDetailsForm', () => {
  describe('Details section', () => {
    it('renders title and description fields', () => {
      render(<EditListingDetailsForm {...defaultProps} />);
      expect(screen.getByText('EditListingDetailsForm.title')).toBeInTheDocument();
      expect(screen.getByText('EditListingDetailsForm.description')).toBeInTheDocument();
    });

    it('submit button is disabled on initial render', () => {
      render(<EditListingDetailsForm {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    });

    it('submit button stays disabled with only title and description filled', async () => {
      const user = userEvent.setup();
      render(<EditListingDetailsForm {...defaultProps} />);
      await fillTextFields(user);
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    });

    it('submit button enables when title, description, and all required amenities are provided', async () => {
      const user = userEvent.setup();
      render(<EditListingDetailsForm {...defaultProps} />);
      await fillTextFields(user);
      await checkAllRequiredAmenities(user);
      expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    });
  });

  describe('Amenities section', () => {
    it('renders all three amenity group headings with correct badges', () => {
      render(<EditListingDetailsForm {...defaultProps} />);
      expect(screen.getByText(/Required Amenities/)).toBeInTheDocument();
      expect(screen.getByText('MUST HAVE')).toBeInTheDocument();
      expect(screen.getByText(/Premium Amenities/)).toBeInTheDocument();
      expect(screen.getByText('BOOSTS LISTING')).toBeInTheDocument();
      expect(screen.getByText(/Optional Amenities/)).toBeInTheDocument();
      expect(screen.getByText('NICE TO HAVE')).toBeInTheDocument();
    });

    it('displays all 12 required amenity checkboxes', () => {
      render(<EditListingDetailsForm {...defaultProps} />);
      expect(REQUIRED_AMENITY_LABELS).toHaveLength(12);
      REQUIRED_AMENITY_LABELS.forEach(label => {
        expect(screen.getByLabelText(label)).toBeInTheDocument();
      });
    });

    it('displays all premium amenities', () => {
      render(<EditListingDetailsForm {...defaultProps} />);
      PREMIUM_AMENITY_LABELS.forEach(label => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it('displays all optional amenities', () => {
      render(<EditListingDetailsForm {...defaultProps} />);
      OPTIONAL_AMENITY_LABELS.forEach(label => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it('all required amenity checkboxes start unchecked', () => {
      render(<EditListingDetailsForm {...defaultProps} />);
      REQUIRED_AMENITY_LABELS.forEach(label => {
        expect(screen.getByLabelText(label)).not.toBeChecked();
      });
    });

    it('shows the full missing required amenities count on load', () => {
      render(<EditListingDetailsForm {...defaultProps} />);
      expect(screen.getByText(/12 required amenities/i)).toBeInTheDocument();
    });

    it('missing count decrements as required amenities are checked', async () => {
      const user = userEvent.setup();
      render(<EditListingDetailsForm {...defaultProps} />);

      expect(screen.getByText(/12 required amenities/i)).toBeInTheDocument();

      await user.click(screen.getByLabelText('24-hour manned security'));
      expect(screen.getByText(/11 required amenities/i)).toBeInTheDocument();

      await user.click(screen.getByLabelText('Perimeter wall + solid gate'));
      expect(screen.getByText(/10 required amenities/i)).toBeInTheDocument();
    });

    it('checking a required amenity marks it as checked', async () => {
      const user = userEvent.setup();
      render(<EditListingDetailsForm {...defaultProps} />);

      const checkbox = screen.getByLabelText('24-hour manned security');
      expect(checkbox).not.toBeChecked();
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('warning message disappears when all required amenities are checked', async () => {
      const user = userEvent.setup();
      render(<EditListingDetailsForm {...defaultProps} />);

      expect(screen.getByText(/12 required amenities/i)).toBeInTheDocument();
      await checkAllRequiredAmenities(user);
      expect(screen.queryByText(/\d+ required amenities/i)).not.toBeInTheDocument();
    });

    it('checking premium or optional amenities does not affect submit button state', async () => {
      const user = userEvent.setup();
      render(<EditListingDetailsForm {...defaultProps} />);

      await fillTextFields(user);
      await checkAllRequiredAmenities(user);
      expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();

      await user.click(screen.getByLabelText('Swimming pool'));
      await user.click(screen.getByLabelText('Air conditioning'));
      expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    });
  });
});
