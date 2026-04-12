import React from 'react';
import { useIntl } from '../../util/reactIntl';

const REQUIRED_AMENITIES = [
  { key: 'security-24hr', label: '24-hour manned security' },
  { key: 'perimeter-wall', label: 'Perimeter wall + solid gate' },
  { key: 'alarm-panic', label: 'Alarm system + panic button' },
  { key: 'cctv', label: 'CCTV cameras' },
  { key: 'water-storage', label: 'Water storage tank / borehole' },
  { key: 'wifi', label: 'WiFi' },
  { key: 'secure-parking', label: 'Secure parking (min. 1 space)' },
  { key: 'kitchen', label: 'Kitchen' },
  { key: 'washing-machine', label: 'Washing machine' },
  { key: 'concierge', label: 'Concierge or estate management' },
];

const PREMIUM_AMENITIES = [
  { key: 'generator', label: 'Backup generator or solar' },
  { key: 'pool', label: 'Swimming pool' },
  { key: 'gym', label: 'Gym / fitness centre' },
  { key: 'rooftop', label: 'Rooftop or outdoor common area' },
  { key: 'balcony', label: 'Private patio or balcony' },
];

const OPTIONAL_AMENITIES = [
  { key: 'hot-water', label: 'Hot water supply' },
  { key: 'tv', label: 'TV' },
  { key: 'furnished', label: 'Fully furnished' },
  { key: 'pet-friendly', label: 'Pet-friendly' },
];

const OLD_KEY_MAP = {
  'free-parking': 'secure-parking',
  'shared-outdoor-pool': 'pool',
  'washer': 'washing-machine',
  'balcony': 'balcony',
  'security': 'security-24hr',
};

const normalizeAmenities = amenities =>
  amenities.map(k => OLD_KEY_MAP[k] || k).filter(Boolean);

const ICONS = {
  // Shield - navy blue
  'security-24hr': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#1a3c6e" strokeWidth="1.6" fill="#dbe9ff"/>
      <polyline points="9 12 11 14 15 10" stroke="#1a3c6e" strokeWidth="1.6"/>
    </svg>
  ),
  // Gate - brown/stone
  'perimeter-wall': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="1" stroke="#7c5c3e" strokeWidth="1.6" fill="#f5e6d3"/>
      <path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="#7c5c3e" strokeWidth="1.6"/>
      <rect x="9" y="14" width="6" height="7" rx="1" stroke="#7c5c3e" strokeWidth="1.4" fill="#e8d5c0"/>
    </svg>
  ),
  // Bell - amber/orange
  'alarm-panic': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#d97706" strokeWidth="1.6" fill="#fef3c7"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#d97706" strokeWidth="1.6"/>
      <circle cx="12" cy="6" r="1" fill="#d97706"/>
    </svg>
  ),
  // Camera - dark grey/charcoal
  'cctv': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="5" width="15" height="14" rx="2" stroke="#374151" strokeWidth="1.6" fill="#e5e7eb"/>
      <path d="M23 7l-7 5 7 5V7z" stroke="#374151" strokeWidth="1.6" fill="#d1d5db"/>
      <circle cx="8" cy="12" r="2" stroke="#374151" strokeWidth="1.4" fill="#9ca3af"/>
    </svg>
  ),
  // Water drop - blue
  'water-storage': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke="#0369a1" strokeWidth="1.6" fill="#bae6fd"/>
    </svg>
  ),
  // WiFi - sky blue
  'wifi': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.42 9a16 16 0 0 1 21.16 0" stroke="#0284c7" strokeWidth="1.6"/>
      <path d="M5 12.55a11 11 0 0 1 14.08 0" stroke="#0284c7" strokeWidth="1.6"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" stroke="#0284c7" strokeWidth="1.6"/>
      <circle cx="12" cy="20" r="1.2" fill="#0284c7"/>
    </svg>
  ),
  // Parking sign - blue
  'secure-parking': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="#1d4ed8" strokeWidth="1.6" fill="#dbeafe"/>
      <path d="M9 17V7h4a3 3 0 0 1 0 6H9" stroke="#1d4ed8" strokeWidth="1.6"/>
    </svg>
  ),
  // Pot/mug - warm orange
  'kitchen': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" stroke="#ea580c" strokeWidth="1.6"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" stroke="#ea580c" strokeWidth="1.6" fill="#ffedd5"/>
      <line x1="6" y1="1" x2="6" y2="4" stroke="#ea580c" strokeWidth="1.6"/>
      <line x1="10" y1="1" x2="10" y2="4" stroke="#ea580c" strokeWidth="1.6"/>
      <line x1="14" y1="1" x2="14" y2="4" stroke="#ea580c" strokeWidth="1.6"/>
    </svg>
  ),
  // Washing machine - teal
  'washing-machine': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2" stroke="#0d9488" strokeWidth="1.6" fill="#ccfbf1"/>
      <circle cx="12" cy="13" r="5" stroke="#0d9488" strokeWidth="1.6" fill="#99f6e4"/>
      <circle cx="12" cy="13" r="2" stroke="#0d9488" strokeWidth="1.4"/>
      <circle cx="6.5" cy="6.5" r="1" fill="#0d9488"/>
    </svg>
  ),
  // Building - purple
  'concierge': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#7c3aed" strokeWidth="1.6" fill="#ede9fe"/>
      <polyline points="9 22 9 12 15 12 15 22" stroke="#7c3aed" strokeWidth="1.6"/>
    </svg>
  ),
  // Lightning - yellow
  'generator': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke="#ca8a04" strokeWidth="1.6" fill="#fef08a"/>
    </svg>
  ),
  // Pool waves - cyan/blue
  'pool': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20c2 0 4-2 6-2s4 2 6 2 4-2 6-2" stroke="#0891b2" strokeWidth="1.6"/>
      <path d="M2 16c2 0 4-2 6-2s4 2 6 2 4-2 6-2" stroke="#0891b2" strokeWidth="1.6"/>
      <circle cx="7" cy="8" r="2.5" stroke="#0891b2" strokeWidth="1.6" fill="#cffafe"/>
      <path d="M10 8h4l2 4" stroke="#0891b2" strokeWidth="1.6"/>
    </svg>
  ),
  // Dumbbell - red
  'gym': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v16" stroke="#dc2626" strokeWidth="1.6"/>
      <path d="M18 4v16" stroke="#dc2626" strokeWidth="1.6"/>
      <path d="M6 8H2v8h4" stroke="#dc2626" strokeWidth="1.6" fill="#fee2e2"/>
      <path d="M18 8h4v8h-4" stroke="#dc2626" strokeWidth="1.6" fill="#fee2e2"/>
      <path d="M6 12h12" stroke="#dc2626" strokeWidth="2"/>
    </svg>
  ),
  // Terrace/sun - warm amber
  'rooftop': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#b45309" strokeWidth="1.6" fill="#fef3c7"/>
      <line x1="3" y1="9" x2="21" y2="9" stroke="#b45309" strokeWidth="1.6"/>
      <path d="M9 22v-4h6v4" stroke="#b45309" strokeWidth="1.4"/>
    </svg>
  ),
  // Balcony/door - green
  'balcony': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#15803d" strokeWidth="1.6" fill="#dcfce7"/>
      <path d="M3 10h18" stroke="#15803d" strokeWidth="1.4"/>
      <path d="M9 22v-12" stroke="#15803d" strokeWidth="1.4"/>
      <path d="M15 22v-12" stroke="#15803d" strokeWidth="1.4"/>
    </svg>
  ),
  // Flame/hot - orange-red
  'hot-water': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke="#f97316" strokeWidth="1.6" fill="#fed7aa"/>
      <path d="M12 12c0 2 1.5 3 1.5 4.5a1.5 1.5 0 0 1-3 0C10.5 15 12 14 12 12z" stroke="#f97316" strokeWidth="1.4" fill="#fb923c"/>
    </svg>
  ),
  // TV - indigo
  'tv': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="13" rx="2" stroke="#4338ca" strokeWidth="1.6" fill="#e0e7ff"/>
      <polyline points="17 2 12 7 7 2" stroke="#4338ca" strokeWidth="1.6"/>
      <line x1="8" y1="21" x2="16" y2="21" stroke="#4338ca" strokeWidth="1.6"/>
    </svg>
  ),
  // Sofa - warm brown
  'furnished': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2" stroke="#92400e" strokeWidth="1.6"/>
      <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z" stroke="#92400e" strokeWidth="1.6" fill="#fef3c7"/>
      <line x1="6" y1="18" x2="6" y2="21" stroke="#92400e" strokeWidth="1.6"/>
      <line x1="18" y1="18" x2="18" y2="21" stroke="#92400e" strokeWidth="1.6"/>
    </svg>
  ),
  // Paw - pink
  'pet-friendly': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="6" cy="6" rx="1.5" ry="2" stroke="#db2777" strokeWidth="1.4" fill="#fce7f3"/>
      <ellipse cx="18" cy="6" rx="1.5" ry="2" stroke="#db2777" strokeWidth="1.4" fill="#fce7f3"/>
      <ellipse cx="10" cy="4" rx="1.5" ry="2" stroke="#db2777" strokeWidth="1.4" fill="#fce7f3"/>
      <ellipse cx="14" cy="4" rx="1.5" ry="2" stroke="#db2777" strokeWidth="1.4" fill="#fce7f3"/>
      <path d="M12 22c-4 0-7-3-7-6 0-2 1.5-3.5 3.5-3.5.8 0 1.5.2 2.1.6L12 14l1.4-.9c.6-.4 1.3-.6 2.1-.6C17.5 12.5 19 14 19 16c0 3-3 6-7 6z" stroke="#db2777" strokeWidth="1.4" fill="#fce7f3"/>
    </svg>
  ),
};

const AmenityGroup = ({ title, amenities, selected }) => {
  const selectedInGroup = amenities.filter(a => selected.includes(a.key));
  if (!selectedInGroup.length) return null;

  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#aaa',
        margin: '0 0 10px 0',
      }}>
        {title}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        {selectedInGroup.map(a => (
          <div key={a.key} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '11px 14px',
            background: '#fff',
            border: '1px solid #ebebeb',
            borderRadius: '10px',
            fontSize: '13px',
            color: '#2d2d2d',
            fontWeight: '400',
          }}>
            {ICONS[a.key] || (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {a.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const SectionAmenities = ({ publicData }) => {
  const intl = useIntl();
  const amenities = normalizeAmenities(publicData?.amenities || []);
  if (!amenities.length) return null;

  return (
    <div style={{ padding: '24px 0', borderTop: '1px solid #e6e6e6', marginBottom: '8px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 20px 0' }}>
        {intl.formatMessage({ id: 'ListingPage.amenitiesTitle', defaultMessage: 'Amenities' })}
      </h2>
      <AmenityGroup title="UN-Grade Essentials" amenities={REQUIRED_AMENITIES} selected={amenities} />
      <AmenityGroup title="Premium Amenities" amenities={PREMIUM_AMENITIES} selected={amenities} />
      <AmenityGroup title="Additional Amenities" amenities={OPTIONAL_AMENITIES} selected={amenities} />
    </div>
  );
};

export default SectionAmenities;
