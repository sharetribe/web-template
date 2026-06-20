'use strict';

// AV shipping config — CommonJS so BOTH the ESM client (via webpack interop)
// and the plain-Node server (`require`) share one source of truth.
// Source: docs/AV Configuracion Envios Jun 2026.docx.md.

const defaultPackageSize = 'M';

const packageSizes = {
  S: { dimsCm: [25, 20, 8], weightMaxKg: 0.5, packaging: 'polymailer' },
  M: { dimsCm: [35, 30, 10], weightMaxKg: 1.0, packaging: 'box-medium' },
  L: { dimsCm: [50, 40, 15], weightMaxKg: 1.5, packaging: 'box-large' },
  especial: { dimsCm: null, weightMaxKg: null, packaging: 'custom' },
};

const deliveryTypes = ['cdmxLocal', 'nacionalExpress', 'nacionalEstandar'];

// MXN subunits (centavos), IVA included. null = not yet priced (TBC with Segmail).
const priceGrid = {
  S: { cdmxLocal: null, nacionalExpress: null, nacionalEstandar: null },
  M: { cdmxLocal: null, nacionalExpress: null, nacionalEstandar: null },
  L: { cdmxLocal: null, nacionalExpress: null, nacionalEstandar: null },
};

// Keyed by Console categoryLevel1 id. Populate with real ids — see plan Task 1, Step 6.
//
// Mapping rules (source: docs/AV Configuracion Envios Jun 2026.docx.md) to apply
// once real Console categoryLevel1 ids are known:
//   S       — Lencería/Pijama; De baño (swimwear); Bolsa chica (clutch/mini bag/cartera)
//   L       — Chamarras; Abrigos; Bolsa grande (tote/mochila/weekender);
//             Tenis/Sneakers; Botines; Botas
//   especial — Hogar — Decoración/frágiles (ceramics, glass)
//   M (default, i.e. any category not listed above) — everything else: tops,
//             shirts, jeans, dresses, skirts, shorts, suits, jumpsuits, blazers,
//             mid-size bags, flats, heels, home textiles
const categoryPackageSizeMap = {};

function getPackageSizeForCategory(categoryId) {
  return categoryPackageSizeMap[categoryId] || defaultPackageSize;
}

function isEspecialSize(size) {
  return size === 'especial';
}

function getShippingPrice(size, deliveryType) {
  if (isEspecialSize(size)) return null;
  const row = priceGrid[size];
  if (!row) return null;
  const price = row[deliveryType];
  return typeof price === 'number' ? price : null;
}

// CDMX detection — match the destination state/postal to Ciudad de México.
function isCdmxDestination(destinationAddress) {
  if (!destinationAddress) return false;
  const state = String(destinationAddress.state || '').toLowerCase();
  const postal = String(destinationAddress.postalCode || destinationAddress.zip || '');
  const cdmxStateNames = ['ciudad de méxico', 'ciudad de mexico', 'cdmx', 'distrito federal'];
  const isCdmxPostal = /^(0[1-9]|1[0-6])\d{3}$/.test(postal); // CDMX postal codes span 01000-16999
  return cdmxStateNames.includes(state) || isCdmxPostal;
}

function getAvailableDeliveryTypes(size, destinationAddress) {
  if (isEspecialSize(size)) return [];
  return deliveryTypes.filter(type => {
    if (getShippingPrice(size, type) === null) return false;
    if (type === 'cdmxLocal') return isCdmxDestination(destinationAddress);
    return true;
  });
}

module.exports = {
  defaultPackageSize,
  packageSizes,
  deliveryTypes,
  priceGrid,
  categoryPackageSizeMap,
  getPackageSizeForCategory,
  isEspecialSize,
  getShippingPrice,
  getAvailableDeliveryTypes,
};
