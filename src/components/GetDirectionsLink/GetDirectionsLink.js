import React from 'react';
import { ExternalLink } from '../../components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDirections } from '@fortawesome/free-solid-svg-icons';
import css from '../../containers/ListingPage/ListingPage.module.css';

const GetDirectionsLink = ({ url }) => {
  return (
    <div className={css.GetDirectionsLink}>
      <p>
        <ExternalLink href={url} className={css.link} aria-label="Get Directions">
          <FontAwesomeIcon icon={faDirections} style={{ marginRight: '8px' }} />
          Get Directions
        </ExternalLink>
      </p>
    </div>
  );
};

export default GetDirectionsLink;
