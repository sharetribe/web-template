import React, { useState, useEffect } from 'react';
import { FormattedMessage } from '../../../util/reactIntl';
import { NamedLink } from '../../../components';
import ModalIframeButton from '../../../extensions/common/components/ModalIframeButton/ModalIframeButton';

import { X, Plus, FilePenLine } from 'lucide-react';

import css from './NoSearchResultsMaybe.module.css';

const NoSearchResultsMaybe = props => {
  const { listingsAreLoaded, totalItems, location, resetAll } = props;
  const hasNoResult = listingsAreLoaded && totalItems === 0;
  const hasSearchParams = location.search?.length > 0;
  
  const searchParams = new URLSearchParams(location.search);
  const params = Object.fromEntries(searchParams.entries());
  const category = params.pub_categoryLevel1;
    
  const [formId, setFormId] = useState(''); // State for formId

  // Effect to update formId based on category
  useEffect(() => {
    let newFormId = '';

    switch (category) {
      case 'location':
        newFormId = '242966291937269'; 
        break;
      case 'machine':
        newFormId = '242986684643271';
        break;
      case 'location-machine':
        newFormId = '242986684643271'; //same as machine
        break;
      default:
        newFormId = ''; // Reset formId if category doesn't match
    }

    setFormId(newFormId); // Update formId state
  }, [category]); // Dependency array to watch for changes in category

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'location':
        return 'Location';
      case 'machine':
        return 'Machine Type'; 
      case 'location-machine':
        return 'Location with a Machine';
      default:
        return ''; // Return an empty string if category doesn't match
    }
  };

  return hasNoResult ? (
    <div className={css.noSearchResults}>
      <FormattedMessage id="SearchPage.noResults" />
      
      <div className={css.links}>
        <span>
        {hasSearchParams ? (
          <button className={css.resetAllFiltersButton} onClick={e => resetAll(e)}>
            <X /> <FormattedMessage id={'SearchPage.resetAllFilters'} />
          </button>
        ) : null}
        </span>

        <span>
          <NamedLink className={css.createListingLink} name="NewListingPage">
          <Plus  /> <FormattedMessage id="SearchPage.createListing" />
          </NamedLink>
        </span>
        
        {formId && ( // Check if formId has a value
          
            <ModalIframeButton 
              iframeUrl={`https://form.jotform.com/${formId}`} 
              buttonLabel={<FormattedMessage id="SearchPage.requestFormLabel" values={{categoryLabel: getCategoryLabel(category)}} />} 
              icon={FilePenLine} 
              buttonClassName={css.openLeadForm}
            />
        )}
      </div>
    </div>
  ) : null;
};

export default NoSearchResultsMaybe;
