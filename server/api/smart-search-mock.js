/**
 * MOCK of POST /api/smart-search (see Hackthon_case/CONTRACT.md).
 *
 * A teammate builds the real smart search backend. Until it is merged, this mock returns
 * responses in the same shape so the frontend can be built and demoed. It uses real listings
 * and the real listing fields and categories from Console, with simple rule-based parsing:
 * - filters from words that match Console options (colour, brand, condition, sizes, categories)
 * - "size L", "size 42", "under 60€", "pet free", "smoke free"
 * - preferences such as "vintage", "autumn" or materials (soft: only affect ranking)
 * - remaining words are used as keywords
 *
 * Replace this file (and its line in apiRouter.js) with the real backend.
 */
const sharetribeSdk = require('sharetribe-flex-sdk');
const { getSdk, serialize } = require('../api-util/sdk');

const MAX_QUERY_LENGTH = 300;
const DEFAULT_PER_PAGE = 24;
const ASSET_CACHE_MS = 5 * 60 * 1000;
const RELAXATION_SUGGESTION_LIMIT = 2;

const SIZE_KEYS = { clothing: 'size', shoes: 'shoeSize', kids: 'kidsSize' };
const SKIPPED_FIELD_KEYS = ['material', ...Object.values(SIZE_KEYS)];
const PLAIN_LABEL_KEYS = ['color', 'brand', 'condition'];

const CATEGORY_SYNONYMS = {
  women: ['women', 'woman', 'womens', 'ladies', 'female'],
  men: ['men', 'man', 'mens', 'male'],
  kids: [
    'kids',
    'kid',
    'baby',
    'babies',
    'toddler',
    'infant',
    'children',
    'child',
    'boys',
    'girls',
  ],
};
// Words that point to a subcategory whose id or name contains the key
const SUBCATEGORY_SYNONYMS = {
  tops: ['top', 'tops', 'shirt', 'shirts', 't-shirt', 'tshirt', 'blouse', 'sweater', 'hoodie'],
  bottoms: ['bottoms', 'jeans', 'trousers', 'pants', 'skirt', 'shorts', 'leggings'],
  shoes: ['shoes', 'shoe', 'sneakers', 'trainers', 'boots', 'sandals', 'heels'],
  outerwear: ['jacket', 'jackets', 'coat', 'coats', 'parka', 'puffer', 'outerwear'],
  dresses: ['dress', 'dresses'],
  clothing: ['clothing', 'clothes'],
};
const PREFERENCE_WORDS = [
  'vintage',
  'retro',
  'classic',
  'oversized',
  'cozy',
  'casual',
  'formal',
  'autumn',
  'fall',
  'winter',
  'summer',
  'spring',
  'wool',
  'cotton',
  'leather',
  'denim',
  'silk',
  'linen',
  'cashmere',
  'polyester',
];
const STOP_WORDS = [
  'a',
  'an',
  'the',
  'for',
  'in',
  'on',
  'with',
  'and',
  'or',
  'of',
  'to',
  'my',
  'i',
  'need',
  'want',
  'looking',
  'look',
  'something',
  'some',
  'any',
  'size',
  'under',
  'below',
  'max',
  'less',
  'than',
  'up',
  'now',
  'please',
  'from',
  'home',
  'free',
  'no',
  'pets',
  'pet',
  'smoke',
  'smoking',
  'non',
  'cheaper',
  'cheap',
  'eu',
];

// ================ Console assets (cached) ================ //

// "In search of" posts are not items for sale, so they are left out of smart search results
const IN_SEARCH_OF_LISTING_TYPES = ['in-search-of-clothing', 'in-search-of', 'iso', 'wanted'];

let assetCache = { at: 0, listingFields: [], categories: [], listingTypes: [] };

const fetchConsoleConfig = sdk => {
  if (Date.now() - assetCache.at < ASSET_CACHE_MS) {
    return Promise.resolve(assetCache);
  }
  return sdk
    .assetsByAlias({
      paths: [
        '/listings/listing-fields.json',
        '/listings/listing-categories.json',
        '/listings/listing-types.json',
      ],
      alias: 'latest',
    })
    .then(response => {
      const assets = response?.data?.data || [];
      const byPath = path => assets.find(a => a.attributes?.assetPath === path)?.attributes?.data;
      assetCache = {
        at: Date.now(),
        listingFields: byPath('/listings/listing-fields.json')?.listingFields || [],
        categories: byPath('/listings/listing-categories.json')?.categories || [],
        listingTypes: (byPath('/listings/listing-types.json')?.listingTypes || []).map(lt => lt.id),
      };
      return assetCache;
    })
    .catch(() => assetCache);
};

// ================ Parsing ================ //

const normalize = s => `${s}`.toLowerCase().trim();
const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasPhrase = (text, phrase) =>
  new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(normalize(phrase))}($|[^\\p{L}\\p{N}])`, 'u').test(
    text
  );

const filter = (key, value, label, op = 'eq') => ({
  key,
  value,
  label,
  mode: 'hard',
  locked: false,
  source: 'inferred',
  op,
});

const fieldLabel = field => field.filterConfig?.label || field.label || field.key;

const findOption = (field, text) =>
  (field.enumOptions || []).find(
    o => normalize(o.label) === normalize(text) || normalize(o.option) === normalize(text)
  );

const parseQuery = (q, { listingFields, categories }) => {
  const text = normalize(q);
  const filters = [];
  const consumed = new Set();
  const tokenize = str =>
    normalize(str)
      .split(/[^\p{L}\p{N}-]+/u)
      .filter(Boolean);
  const consume = phrase => tokenize(phrase).forEach(w => consumed.add(w));
  const fieldByKey = key => listingFields.find(f => f.key === key);

  // Price: "under 60€", "below €60", "max 60"
  const priceMatch = text.match(
    /(?:under|below|max|less than|up to)\s*€?\s*(\d+)\s*(?:€|eur|euro)?/
  );
  if (priceMatch) {
    const max = Number(priceMatch[1]);
    filters.push(filter('price', { max: max * 100 }, `Under €${max}`, 'range'));
    consume(priceMatch[0]);
  }

  // Sizes: "size L" (clothing), "size 42" (shoes)
  const sizeMatch = text.match(/size\s+([a-z0-9]{1,4})\b/);
  if (sizeMatch) {
    const raw = sizeMatch[1];
    const isNumeric = /^\d+$/.test(raw);
    const key = isNumeric ? SIZE_KEYS.shoes : SIZE_KEYS.clothing;
    const field = fieldByKey(key);
    const option = field ? findOption(field, raw) : null;
    const value = option ? option.option : raw;
    filters.push(filter(key, value, isNumeric ? `EU ${raw}` : `Size ${raw.toUpperCase()}`));
    consume(sizeMatch[0]);
  }

  // Pet-free / smoke-free homes
  const homeFilters = [
    { key: 'petFreeHome', label: 'Pet-free home', re: /(pet[\s-]?free|no pets|without pets)/ },
    {
      key: 'smokeFreeHome',
      label: 'Smoke-free home',
      re: /(smoke[\s-]?free|non[\s-]?smok\w*|no smok\w*)/,
    },
  ];
  homeFilters.forEach(({ key, label, re }) => {
    const m = text.match(re);
    if (m) {
      const field = fieldByKey(key);
      const yes = (field?.enumOptions || []).find(o =>
        ['yes', 'true'].includes(normalize(o.option))
      );
      const value = field?.schemaType === 'boolean' ? true : yes ? yes.option : 'yes';
      filters.push(filter(key, value, label));
      consume(m[0]);
    }
  });

  // Enum fields from Console (colour, brand, condition, ...): match option labels as phrases
  listingFields
    .filter(f => ['enum', 'multi-enum'].includes(f.schemaType))
    .filter(f => !SKIPPED_FIELD_KEYS.includes(f.key) && !filters.some(x => x.key === f.key))
    .forEach(field => {
      const option = (field.enumOptions || []).find(
        o => normalize(o.label).length > 2 && hasPhrase(text, o.label)
      );
      if (option) {
        const label = PLAIN_LABEL_KEYS.includes(field.key)
          ? option.label
          : `${fieldLabel(field)}: ${option.label}`;
        filters.push(filter(field.key, option.option, label));
        consume(option.label);
      }
    });

  // Categories: level 1 by name or synonym, level 2 by subcategory synonym
  const level1 = categories.find(cat => {
    const words = [cat.id, cat.name, ...(CATEGORY_SYNONYMS[cat.id] || [])];
    const match = words.find(w => hasPhrase(text, w));
    if (match) {
      consume(match);
    }
    return !!match;
  });
  if (level1) {
    filters.push(filter('categoryLevel1', level1.id, level1.name));
    const level2 = (level1.subcategories || []).find(sub => {
      const subText = normalize(`${sub.id} ${sub.name}`);
      return Object.entries(SUBCATEGORY_SYNONYMS).some(([canonical, words]) => {
        const match = subText.includes(canonical) && words.find(w => hasPhrase(text, w));
        // Generic words ("shoes", "tops") only select the subcategory; specific ones
        // ("sweater", "boots") are also kept as keywords
        if (match && (match === canonical || subText.includes(match))) {
          consume(match);
        }
        return !!match;
      });
    });
    if (level2) {
      filters.push(filter('categoryLevel2', level2.id, level2.name));
    }
  }

  const words = tokenize(text);
  const preferences = PREFERENCE_WORDS.filter(p => words.includes(p));
  const terms = words.filter(
    w =>
      !consumed.has(w) &&
      !STOP_WORDS.includes(w) &&
      !preferences.includes(w) &&
      !/^\d+(€|eur)?$/.test(w)
  );

  return { filters, preferences, terms, isCheaper: /\bcheaper\b/.test(text) };
};

// ================ State ================ //

const nextState = (q, previous, consoleConfig) => {
  const empty = { q: '', filters: [], preferences: [], removed: [], similarTo: null, terms: [] };
  const prev = previous ? { ...empty, ...previous } : null;
  const notices = [];

  if (!q) {
    return { state: prev || empty, notices };
  }

  const parsed = parseQuery(q, consoleConfig);
  const isRefinement =
    !!prev && parsed.terms.length === 0 && !parsed.filters.some(f => f.key === 'categoryLevel1');

  if (!isRefinement) {
    // New search: keep only filters the buyer locked
    const locked = prev ? prev.filters.filter(f => f.locked) : [];
    const filters = [...locked];
    parsed.filters.forEach(f => {
      if (!filters.some(x => x.key === f.key)) {
        filters.push(f);
      }
    });
    return {
      state: { ...empty, q, filters, preferences: parsed.preferences, terms: parsed.terms },
      notices,
    };
  }

  // Refinement ("cheaper", "in black"): change the previous search
  let filters = [...prev.filters];
  parsed.filters
    .filter(f => !prev.removed.includes(f.key))
    .forEach(f => {
      const existing = filters.find(x => x.key === f.key);
      if (existing && (existing.locked || existing.source === 'user')) {
        if (JSON.stringify(existing.value) !== JSON.stringify(f.value)) {
          notices.push({ code: 'USER_FILTER_KEPT', params: { label: existing.label } });
        }
        return;
      }
      filters = [...filters.filter(x => x.key !== f.key), f];
    });

  if (parsed.isCheaper) {
    const price = filters.find(f => f.key === 'price');
    if (price?.value?.max && !price.locked) {
      const max = Math.max(100, Math.round((price.value.max * 0.7) / 100) * 100);
      filters = [
        ...filters.filter(f => f.key !== 'price'),
        { ...price, value: { ...price.value, max }, label: `Under €${max / 100}` },
      ];
    }
  }

  return {
    state: {
      ...prev,
      q: `${prev.q} ${q}`.trim(),
      filters,
      preferences: [...new Set([...prev.preferences, ...parsed.preferences])],
    },
    notices,
  };
};

// ================ Sharetribe query ================ //

const SORTS = { 'price-asc': 'price', 'price-desc': '-price', newest: 'createdAt' };

const toQueryParams = (state, consoleConfig) => {
  const params = {};
  const sellingTypes = consoleConfig.listingTypes.filter(
    id => !IN_SEARCH_OF_LISTING_TYPES.includes(id)
  );
  if (sellingTypes.length > 0 && sellingTypes.length < consoleConfig.listingTypes.length) {
    params.pub_listingType = sellingTypes;
  }
  if (state.terms.length > 0) {
    params.keywords = state.terms.join(' ');
  }
  state.filters
    .filter(f => f.mode === 'hard')
    .forEach(f => {
      if (f.key === 'price') {
        const { min = 0, max } = f.value || {};
        params.price = max != null ? `${min},${max + 1}` : `${min},`;
      } else if (f.key === 'shippingEnabled') {
        params.pub_shippingEnabled = f.value;
      } else if (f.key.startsWith('categoryLevel')) {
        params[`pub_${f.key}`] = f.value;
      } else {
        const field = consoleConfig.listingFields.find(x => x.key === f.key);
        const prefix = field?.scope === 'metadata' ? 'meta_' : 'pub_';
        const value = Array.isArray(f.value) ? f.value.join(',') : f.value;
        params[`${prefix}${f.key}`] =
          field?.schemaType === 'multi-enum' ? `has_any:${value}` : value;
      }
    });
  return params;
};

const imageParams = ({
  variantPrefix = 'listing-card',
  aspectWidth = 1,
  aspectHeight = 1,
} = {}) => {
  const variant = (name, width) => ({
    [`imageVariant.${name}`]: sharetribeSdk.util.objectQueryString({
      w: width,
      h: Math.round((width * aspectHeight) / aspectWidth),
      fit: 'crop',
    }),
  });
  return {
    include: ['author', 'images'],
    'fields.image': [`variants.${variantPrefix}`, `variants.${variantPrefix}-2x`],
    'limit.images': 1,
    ...variant(variantPrefix, 400),
    ...variant(`${variantPrefix}-2x`, 800),
  };
};

const listingText = listing => {
  const { title = '', description = '', publicData = {} } = listing.attributes || {};
  return normalize(`${title} ${description} ${Object.values(publicData).join(' ')}`);
};

// ================ Handler ================ //

const sendError = (res, status, code, message) =>
  res
    .status(status)
    .json({ code, message })
    .end();

module.exports = (req, res) => {
  const {
    q = null,
    state = null,
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    sort = 'relevance',
    image,
  } = req.body || {};

  if (q != null && typeof q !== 'string') {
    return sendError(res, 400, 'INVALID_REQUEST', 'q must be a string or null.');
  }
  if (q && q.length > MAX_QUERY_LENGTH) {
    return sendError(res, 400, 'QUERY_TOO_LONG', 'Query is too long.');
  }
  if (!q && !state) {
    return sendError(res, 400, 'INVALID_REQUEST', 'Send q, state or both.');
  }

  const sdk = getSdk(req, res);
  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(perPage) || DEFAULT_PER_PAGE));

  return fetchConsoleConfig(sdk)
    .then(consoleConfig => {
      const { state: searchState, notices } = nextState(q && q.trim(), state, consoleConfig);
      const sortMaybe = SORTS[sort] ? { sort: SORTS[sort] } : {};
      const query = s =>
        sdk.listings.query({
          ...toQueryParams(s, consoleConfig),
          ...imageParams(image),
          ...sortMaybe,
          page: pageNumber,
          perPage: pageSize,
        });

      return query(searchState).then(response => {
        const total = response.data.meta?.totalItems || 0;
        const relaxable = searchState.filters.filter(f => f.mode === 'hard' && !f.locked);

        // Nothing matched: drop the last inferred filter and try again
        if (total === 0 && relaxable.length > 0) {
          const dropped = relaxable[relaxable.length - 1];
          const relaxedState = {
            ...searchState,
            filters: searchState.filters.filter(f => f !== dropped),
          };
          return query(relaxedState).then(relaxed => ({
            response: relaxed,
            searchState: relaxedState,
            auto: { filter: dropped },
            suggestions: [],
            notices,
          }));
        }

        // Few results: tell how many more there would be without a filter
        const suggestionsPromise =
          total < pageSize
            ? Promise.all(
                relaxable.slice(0, RELAXATION_SUGGESTION_LIMIT).map(f =>
                  query({ ...searchState, filters: searchState.filters.filter(x => x !== f) })
                    .then(r => ({
                      key: f.key,
                      label: f.label,
                      extra: (r.data.meta?.totalItems || 0) - total,
                    }))
                    .catch(() => null)
                )
              ).then(list => list.filter(s => s && s.extra > 0))
            : Promise.resolve([]);

        return suggestionsPromise.then(suggestions => ({
          response,
          searchState,
          auto: null,
          suggestions,
          notices,
        }));
      });
    })
    .then(({ response, searchState, auto, suggestions, notices }) => {
      const listings = response.data.data || [];
      const meta = response.data.meta || {};
      const prefs = searchState.preferences;
      // Without any preference match there is nothing to tell apart: show all as best matches
      const anyPreferenceMatch = listings.some(l => prefs.some(p => listingText(l).includes(p)));

      const ranked = listings.map(listing => {
        const text = listingText(listing);
        const matched = prefs.filter(p => text.includes(p));
        return {
          listing,
          tier: !anyPreferenceMatch || matched.length > 0 ? 'best' : 'related',
          reason: matched.length > 0 ? `Matches “${matched.join('”, “')}”` : null,
        };
      });
      // Best matches first; keep the API order inside each tier
      const ordered = [
        ...ranked.filter(r => r.tier === 'best'),
        ...ranked.filter(r => r.tier === 'related'),
      ];
      const relatedCount = ordered.filter(r => r.tier === 'related').length;
      const totalItems = meta.totalItems || 0;

      const body = {
        state: searchState,
        results: ordered.map(r => ({ id: r.listing.id, tier: r.tier, reason: r.reason })),
        listings: { data: ordered.map(r => r.listing), included: response.data.included || [] },
        total: { best: Math.max(0, totalItems - relatedCount), related: relatedCount },
        page: pageNumber,
        perPage: pageSize,
        totalPages: meta.totalPages || (totalItems > 0 ? 1 : 0),
        relaxation: { auto, suggestions },
        notices: totalItems === 0 ? [...notices, { code: 'NO_RESULTS', params: {} }] : notices,
      };

      res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(serialize(body))
        .end();
    })
    .catch(e => {
      console.error('smart-search-mock failed', e);
      const status = e?.status === 429 ? 429 : 502;
      sendError(
        res,
        status,
        status === 429 ? 'RATE_LIMITED' : 'UPSTREAM_ERROR',
        'Search is temporarily unavailable.'
      );
    });
};

// Exposed for tests
module.exports.parseQuery = parseQuery;
module.exports.nextState = nextState;
