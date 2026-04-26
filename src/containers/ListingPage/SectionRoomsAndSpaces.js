import React from 'react';
import { useIntl } from '../../util/reactIntl';

const styles = {
  root: {
    padding: '24px 0',
    borderTop: '1px solid #e6e6e6',
    marginBottom: '8px',
  },
  heading: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#3d3d3d',
    marginTop: '0',
    marginBottom: '20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  roomStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f9f9f9',
    border: '1px solid #e6e6e6',
    borderRadius: '12px',
    padding: '20px 12px',
    textAlign: 'center',
  },
  roomValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#7c3aed',
    lineHeight: '1.2',
    marginBottom: '6px',
    display: 'block',
  },
  roomLabel: {
    fontSize: '12px',
    color: '#6b6b6b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'block',
  },
};

const RoomStat = ({ label, value }) => (
  <div style={styles.roomStat}>
    <span style={styles.roomValue}>{value}</span>
    {label ? <span style={styles.roomLabel}>{label}</span> : null}
  </div>
);

const SectionRoomsAndSpaces = ({ publicData }) => {
  const intl = useIntl();
  const { bedrooms, bathrooms, beds, guests, bedroomType } = publicData || {};

  const hasAny = bedrooms != null || bathrooms != null || beds != null || guests != null;
  if (!hasAny) return null;

  // Fallback if listing was saved before bedroomType was introduced
  const bedroomLabels = ['Studio', 'One Bedroom', 'Two Bedrooms', 'Three Bedrooms', 'Four Bedrooms', 'Five Bedrooms', 'Six Bedrooms', 'Seven Bedrooms', 'Eight Bedrooms', 'Nine Bedrooms', 'Ten Bedrooms'];
  const displayBedroomType = bedroomType || (bedrooms != null ? (bedroomLabels[bedrooms] || `${bedrooms} Bedrooms`) : 'Studio');

  return (
    <div style={styles.root}>
      <h2 style={styles.heading}>
        {intl.formatMessage({ id: 'ListingPage.roomsAndSpacesTitle', defaultMessage: 'Rooms & spaces' })}
      </h2>
      <div style={styles.statsGrid}>
        {bedrooms != null && (
          <RoomStat value={displayBedroomType} label={null} />
        )}
        {bathrooms != null && (
          <RoomStat
            value={bathrooms}
            label={intl.formatMessage({ id: 'ListingPage.bathrooms', defaultMessage: 'Bathrooms' })}
          />
        )}
        {beds != null && (
          <RoomStat
            value={beds}
            label={intl.formatMessage({ id: 'ListingPage.beds', defaultMessage: 'Beds' })}
          />
        )}
        {guests != null && (
          <RoomStat
            value={guests}
            label={intl.formatMessage({ id: 'ListingPage.guests', defaultMessage: 'Guests' })}
          />
        )}
      </div>
    </div>
  );
};

export default SectionRoomsAndSpaces;
