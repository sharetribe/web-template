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

const deliveryTypes = ['nacionalExpress', 'nacionalEstandar'];

// MXN subunits (centavos), IVA included. null = not yet priced.
//
// ⚠️ TEST PLACEHOLDER VALUES — NOT REAL TARIFFS. These exist only to validate
// Plan A end-to-end (so the checkout selector renders priced options and the
// breakdown shows a shipping fee). Replace EVERY value below with the
// Segmail-confirmed prices before launch (see docs/AV Configuracion Envios
// Jun 2026 §2/§5). Ordering used for the placeholders: nacionalEstandar <
// nacionalExpress, and S < M < L. Set a cell back to `null` to hide that
// option at checkout.
const priceGrid = {
  S: { nacionalEstandar: 9900, nacionalExpress: 14900 }, // TEST ONLY
  M: { nacionalEstandar: 12900, nacionalExpress: 18900 }, // TEST ONLY
  L: { nacionalEstandar: 15900, nacionalExpress: 22900 }, // TEST ONLY
};

// Maps a category id → package size. Only the EXCEPTIONS to the default (`M`)
// are listed; any category not present here resolves to `M`. Resolution is
// most-specific-first (see getPackageSizeForCategory), so a level-2/level-3 id
// overrides its parent, and family-wide rules can be keyed at level 1.
//
// Source: docs/AV Configuracion Envios Jun 2026.docx.md §3, mapped to the live
// taxonomy from the categories asset (/listings/listing-categories.json):
//   S        — small/flat items
//   L        — bulky / rigid / footwear-in-box
//   especial — fragile, out of the automatic flow (no shipping)
//   M        — default (tops, shirts, jeans, dresses, skirts, shorts, suits,
//              jumpsuits, mid-size bags, flats, heels, etc.)
const categoryPackageSizeMap = {
  // Ropa (level1 "ropa" defaults to M; only exceptions listed)
  'ropa-sacos-chamarras': 'L', // Chamarras / Abrigos / Sacos
  'ropa-lenceria': 'S', // Lencería / pijama
  'ropa-de-bano': 'S', // De baño (swimwear)

  // Bolsas (mid-size bags — mano/cruzadas/formales — default to M)
  'bolsas-clutch': 'S',
  'bolsas-carteras': 'S',
  'bolsas-monederos': 'S',
  'bolsas-rinoneras': 'S',
  'bolsas-totes': 'L',
  'bolsas-mochilas_casuales': 'L',
  'bolsas-mochilas_deporte': 'L',

  // Zapatos (flats/heels — tacones/sandalias/zapatillas_flats/mocasines/plataformas — default to M)
  'zapatos-tenis_casuales': 'L',
  'zapatos-tenis_deportivos': 'L',
  'zapatos-botas': 'L',
  'zapatos-botas_vaqueras': 'L',
  'zapatos-botas_tacon': 'L',
  'zapatos-botas_montana': 'L',
  'zapatos-botin': 'L',
  'zapatos-botin_tacon': 'L',

  // Accesorios — whole family is small/flat
  accesorios: 'S',

  // Home Antiques — fragile, requires direct Segmail quote (no auto shipping)
  'home-antiques': 'especial',
};

// Resolve the package size for a listing's category. Accepts the category level
// ids (categoryLevel1, categoryLevel2, categoryLevel3) as separate args or a
// single array, in general→specific order. The MOST SPECIFIC mapped id wins;
// otherwise falls back to the default size.
function getPackageSizeForCategory(...categoryIds) {
  const ids = categoryIds.flat().filter(Boolean);
  for (let i = ids.length - 1; i >= 0; i--) {
    const size = categoryPackageSizeMap[ids[i]];
    if (size) return size;
  }
  return defaultPackageSize;
}

// Resolve the package size for a listing from its publicData: an explicit
// `avPackageSize` wins; otherwise fall back to the category mapping (which itself
// defaults to `M`). Use this everywhere a listing's size is consumed so listings
// created before the size field existed still price/ship correctly.
function resolvePackageSize(publicData) {
  const pd = publicData || {};
  return (
    pd.avPackageSize ||
    getPackageSizeForCategory(pd.categoryLevel1, pd.categoryLevel2, pd.categoryLevel3)
  );
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

function getAvailableDeliveryTypes(size) {
  if (isEspecialSize(size)) return [];
  return deliveryTypes.filter(type => getShippingPrice(size, type) !== null);
}

module.exports = {
  defaultPackageSize,
  packageSizes,
  deliveryTypes,
  priceGrid,
  categoryPackageSizeMap,
  getPackageSizeForCategory,
  resolvePackageSize,
  isEspecialSize,
  getShippingPrice,
  getAvailableDeliveryTypes,
};
