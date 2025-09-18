/**
 * Address normalization and mapping utilities
 */

// Normalize address data by trimming spaces and converting to standard formats
export const normalizeAddress = (address) => {
  if (!address) return null;

  const normalized = {
    fullName: address.fullName?.trim().replace(/\s+/g, ' ') || '',
    country: address.country?.toUpperCase() || 'US',
    street1: address.street1?.trim().replace(/\s+/g, ' ') || '',
    street2: address.street2?.trim().replace(/\s+/g, ' ') || undefined, // Always send undefined when missing
    city: address.city?.trim().replace(/\s+/g, ' ') || '',
    state: address.state?.trim().toUpperCase() || '',
    zip: address.zip?.trim().replace(/\s+/g, '') || '',
    email: address.email?.trim().toLowerCase() || '',
    phone: normalizePhone(address.phone) || '',
  };

  // Clean up empty strings to undefined for optional fields
  if (!normalized.street2) normalized.street2 = undefined;
  if (!normalized.phone) normalized.phone = undefined;

  return normalized;
};

// Normalize phone number to E.164 format
export const normalizePhone = (phone) => {
  if (!phone) return '';
  
  // Remove extensions (x123, ext 123, etc.) and reject them
  let cleaned = phone.replace(/\s*(x|ext|extension)\s*\d+.*$/i, '');
  
  // Remove all non-digit characters except +
  cleaned = cleaned.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, assume US number and add +1
  if (!cleaned.startsWith('+')) {
    // Remove leading 1 if present
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = cleaned.substring(1);
    }
    cleaned = '+1' + cleaned;
  }
  
  // Validate E.164 format (1-15 digits after +)
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  if (!e164Regex.test(cleaned)) {
    return phone; // Return original if normalization fails
  }
  
  return cleaned;
};

// Map normalized address to Stripe billing format
export const mapToStripeBilling = (address) => {
  const normalized = normalizeAddress(address);
  if (!normalized) return null;

  return {
    name: normalized.fullName,
    email: normalized.email,
    phone: normalized.phone,
    address: {
      line1: normalized.street1,
      line2: normalized.street2 || undefined, // Always send undefined when missing
      city: normalized.city,
      state: normalized.state,
      postal_code: normalized.zip,
      country: normalized.country,
    },
  };
};

// Map normalized address to Shippo/UPS/FedEx format
export const mapToShippo = (address) => {
  const normalized = normalizeAddress(address);
  if (!normalized) return null;

  return {
    name: normalized.fullName,
    email: normalized.email,
    phone: normalized.phone,
    street1: normalized.street1,
    street2: normalized.street2 || '',
    city: normalized.city,
    state: normalized.state,
    zip: normalized.zip,
    country: normalized.country,
  };
};

// Check if address is a PO Box (for courier routing)
export const isPOBox = (address) => {
  if (!address?.street1) return false;
  return /^(P(OST)?\.?\s*O(FFICE)?\.?\s*BOX)\b/i.test(address.street1);
};

// Map normalized address to UPS format
export const mapToUPS = (address) => {
  const normalized = normalizeAddress(address);
  if (!normalized) return null;

  return {
    name: normalized.fullName,
    email: normalized.email,
    phone: normalized.phone,
    address_line1: normalized.street1,
    address_line2: normalized.street2 || '',
    city: normalized.city,
    state_province_code: normalized.state,
    postal_code: normalized.zip,
    country_code: normalized.country,
  };
};

// Map normalized address to FedEx format
export const mapToFedEx = (address) => {
  const normalized = normalizeAddress(address);
  if (!normalized) return null;

  return {
    contact: {
      person_name: normalized.fullName,
      email_address: normalized.email,
      phone_number: normalized.phone,
    },
    address: {
      street_lines: [normalized.street1, normalized.street2].filter(Boolean),
      city: normalized.city,
      state_or_province_code: normalized.state,
      postal_code: normalized.zip,
      country_code: normalized.country,
    },
  };
};

// Validate address completeness
export const validateAddress = (address, requiredFields = {}) => {
  const defaults = {
    fullName: true,
    country: true,
    street1: true,
    city: true,
    state: true,
    zip: true,
    email: true,
    phone: false,
  };
  
  const requirements = { ...defaults, ...requiredFields };
  const errors = {};
  
  if (requirements.fullName && !address.fullName?.trim()) {
    errors.fullName = 'Full name is required';
  }
  
  if (requirements.country && !address.country?.trim()) {
    errors.country = 'Country is required';
  }
  
  if (requirements.street1 && !address.street1?.trim()) {
    errors.street1 = 'Street address is required';
  }
  
  if (requirements.city && !address.city?.trim()) {
    errors.city = 'City is required';
  }
  
  if (requirements.state && !address.state?.trim()) {
    errors.state = 'State/Region is required';
  }
  
  if (requirements.zip && !address.zip?.trim()) {
    errors.zip = 'ZIP/Postal code is required';
  }
  
  if (requirements.email && !address.email?.trim()) {
    errors.email = 'Email is required';
  } else if (address.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (requirements.phone && !address.phone?.trim()) {
    errors.phone = 'Phone number is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Copy billing address to shipping address
export const copyBillingToShipping = (billingAddress) => {
  const normalized = normalizeAddress(billingAddress);
  if (!normalized) return null;

  return {
    shipping: {
      fullName: normalized.fullName,
      country: normalized.country,
      street1: normalized.street1,
      street2: normalized.street2,
      city: normalized.city,
      state: normalized.state,
      zip: normalized.zip,
      email: normalized.email,
      phone: normalized.phone,
    },
  };
};
