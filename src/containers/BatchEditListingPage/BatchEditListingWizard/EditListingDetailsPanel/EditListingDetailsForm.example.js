import defaultConfig from '../../../../config/configDefault';
import { pickCategoryFields } from '../../../../util/fieldHelpers';

import EditListingDetailsForm from './EditListingDetailsForm';

const noop = () => {};
const selectableListingTypes = [
  {
    listingType: 'sell-bicycles',
    label: 'Sell bicycles',
    transactionProcessAlias: 'default-purchase/release-1',
    unitType: 'item',
  },
];

const selectableCategories = [
  {
    subcategories: [
      {
        name: 'Adidas',
        id: 'adidas',
      },
      {
        name: 'Nike',
        id: 'nike',
      },
    ],
    name: 'Sneakers',
    id: 'sneakers',
  },
  {
    subcategories: [
      {
        name: 'City bikes',
        id: 'city-bikes',
      },
      {
        name: 'Mountain bikes',
        id: 'mountain-bikes',
      },
    ],
    name: 'Bikes',
    id: 'bikes',
  },
];

export const WithInitialValues = {
  component: EditListingDetailsForm,
  props: {
    formId: 'WithInitialValues',
    onSubmit: values => {
      console.log('Submit EditListingDetailsForm with (unformatted) values:', values);
    },
    saveActionMsg: 'Save description',
    disabled: false,
    ready: false,
    updated: false,
    updateInProgress: false,
    selectableListingTypes: selectableListingTypes,
    onListingTypeChange: noop,
    listingConfig: defaultConfig.listing,
    selectableCategories: selectableCategories,
    pickSelectedCategories: values => pickCategoryFields(values, 'categoryLevel', 1, []),
    initialValues: {
      title: 'Listing',
      description: 'Lorem ipsum',
      listingType: 'sell-bicycles',
      transactionProcessAlias: 'default-purchase/release-1',
      unitType: 'item',
      categoryLevel1: 'sneakers',
      categoryLevel2: 'adidas',
    },
  },
  group: 'page:EditListingPage',
};

const selectableListingTypes2 = [
  {
    listingType: 'daily-booking',
    label: 'Daily booking',
    transactionProcessAlias: 'default-booking/release-1',
    unitType: 'day',
  },
  {
    listingType: 'sell-bicycles',
    label: 'Sell bicycles',
    transactionProcessAlias: 'default-purchase/release-1',
    unitType: 'item',
  },
];

export const MultipleProcessInfos = {
  component: EditListingDetailsForm,
  props: {
    formId: 'MultipleProcessInfos',
    onSubmit: values => {
      console.log('Submit EditListingDetailsForm with (unformatted) values:', values);
    },
    saveActionMsg: 'Save description',
    disabled: false,
    ready: false,
    updated: false,
    updateInProgress: false,
    selectableListingTypes: selectableListingTypes2,
    selectableCategories: selectableCategories,
    pickSelectedCategories: values => pickCategoryFields(values, 'categoryLevel', 1, []),
    onListingTypeChange: noop,
    listingConfig: defaultConfig.listing,
  },
  group: 'page:EditListingPage',
};

export const ChooseListingCategory = {
  component: EditListingDetailsForm,
  props: {
    formId: 'ChooseListingCategory',
    onSubmit: values => {
      console.log('Submit EditListingDetailsForm with (unformatted) values:', values);
    },
    saveActionMsg: 'Save description',
    disabled: false,
    ready: false,
    updated: false,
    updateInProgress: false,
    selectableListingTypes: selectableListingTypes2,
    selectableCategories: selectableCategories,
    pickSelectedCategories: values => pickCategoryFields(values, 'categoryLevel', 1, []),
    onCategoryChange: noop,
    onListingTypeChange: noop,
    listingConfig: defaultConfig.listing,
  },
  group: 'page:EditListingPage',
};
