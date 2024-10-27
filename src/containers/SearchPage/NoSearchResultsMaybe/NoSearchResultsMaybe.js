import React, { useState, useEffect } from 'react';
import { FormattedMessage } from '../../../util/reactIntl';
import { NamedLink, ModalInMobile } from '../../../components';

import css from './NoSearchResultsMaybe.module.css';

const NoSearchResultsMaybe = props => {
  const { listingsAreLoaded, totalItems, location, resetAll } = props;
  const hasNoResult = listingsAreLoaded && totalItems === 0;
  const hasSearchParams = location.search?.length > 0;
  
  const searchParams = new URLSearchParams(location.search);
  const params = Object.fromEntries(searchParams.entries());
  const category = params.pub_categoryLevel1;
    
  const [isModalOpen, setModalOpen] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');
  const [formId, setFormId] = useState(''); // State for formId

  //are we in a mobile experience?
  const MODAL_BREAKPOINT = 768; 
  const isWindowDefined = typeof window !== 'undefined';
  const isMobileLayout = isWindowDefined && window.innerWidth < MODAL_BREAKPOINT;


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

  const handleButtonClick = () => {

    const url = 'https://form.jotform.com/' + formId;
    if(isMobileLayout){
      window.open(url);
    } else {
      setIframeUrl( url );
      setModalOpen(true);
    }
  };

  const getCategoryLabel = (category) => {

    switch (category) {
      case 'location':
        return 'Location';
      case 'machine':
        return 'Machine Type'; 
      case 'location-machine':
        return 'Location with a Machine';
      default:
        return; // Do nothing if category doesn't match
    }
  };

  const onManageDisableScrolling = (isDisabled) => {};

  return hasNoResult ? (
    <div className={css.noSearchResults}>
      <FormattedMessage id="SearchPage.noResults" />
      
      <div className={css.links}>
        <span>
        {hasSearchParams ? (
          <button className={css.resetAllFiltersButton} onClick={e => resetAll(e)}>
            <i class="fa-solid fa-xmark"></i> <FormattedMessage id={'SearchPage.resetAllFilters'} />
          </button>
        ) : null}
        </span>

        <span>
          <NamedLink className={css.createListingLink} name="NewListingPage">
          <i class="fa-solid fa-plus"></i> <FormattedMessage id="SearchPage.createListing" />
          </NamedLink>
        </span>
        
        {formId && ( // Check if formId has a value
          <span>
           <button className={css.openLeadForm} onClick={handleButtonClick}>
              <i class="fa-brands fa-wpforms"></i> Request a {getCategoryLabel(category)}
              </button>
          </span>
        )}
      </div>

      <ModalInMobile
        id="iframeModal"
        isModalOpen={isModalOpen}
        
        onClose={() => {
          setModalOpen(false);
          onManageDisableScrolling(false); // Allow scrolling when modal is closed
        }}
        showAsModalMaxWidth={99999} // Adjust as needed
        onManageDisableScrolling={onManageDisableScrolling} // Pass the function to manage scrolling
        isModalOpenOnMobile={isModalOpen} // Pass the modal open state
      >
        <iframe src={iframeUrl} className={css.modal} border="0" width="100%" title="Modal Content" />

      </ModalInMobile>
    </div>
  ) : null;
};

export default NoSearchResultsMaybe;
