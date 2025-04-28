import React from 'react';

import { FilePenLine, Search } from 'lucide-react';
import { Link } from '../../../../../../containers/PageBuilder/Primitives/Link';
import { FormattedMessage } from '../../../../../../util/reactIntl';
import ModalIframeButton from '../../../ModalIframeButton/ModalIframeButton';

import css from './SearchRequestLinks.module.css';


const SearchRequestLinks = () => {
    return (
        <div className={css.root}>
            <Link href="/s?bounds=64.01335248%2C-71.35834539%2C6.75544591%2C-127.85697889&mapSearch=true&pub_categoryLevel1=location">
               <Search/> <FormattedMessage id="SearchRequestLinks.findLocations" />
            </Link>
            <span className={css.divider}> <FormattedMessage id="SearchRequestLinks.or" /> </span>
            <ModalIframeButton 
                iframeUrl={`https://vendingvillage.com/request-location`} 
                buttonLabel={<FormattedMessage id="SearchRequestLinks.requestLocation" />} 
                icon={FilePenLine}
                buttonClassName={css.requestButton}
            />
        </div>
    )
}

export default SearchRequestLinks;