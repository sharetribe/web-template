const { parseQuery, nextState } = require('./smart-search-mock');

const consoleConfig = {
  listingFields: [
    {
      key: 'color',
      schemaType: 'enum',
      enumOptions: [{ option: 'black', label: 'Black' }, { option: 'blue', label: 'Blue' }],
    },
    {
      key: 'brand',
      schemaType: 'enum',
      enumOptions: [{ option: 'nike', label: 'Nike' }, { option: 'levis', label: "Levi's" }],
    },
    { key: 'size', schemaType: 'enum', enumOptions: [{ option: 'm', label: 'M' }] },
    { key: 'shoeSize', schemaType: 'enum', enumOptions: [{ option: '42', label: '42' }] },
  ],
  categories: [
    { id: 'women', name: 'Women', subcategories: [{ id: 'women-tops', name: 'Tops' }] },
    { id: 'men', name: 'Men', subcategories: [{ id: 'men-shoes', name: 'Shoes' }] },
    { id: 'kids', name: 'Kids', subcategories: [] },
  ],
  listingTypes: [],
};

const labels = filters => filters.map(f => f.label);

describe('smart-search-mock', () => {
  it('reads filters, preferences and keywords from the text', () => {
    const parsed = parseQuery('vintage jacket for autumn, size M, under 60€', consoleConfig);
    expect(labels(parsed.filters)).toEqual(['Under €60', 'Size M']);
    expect(parsed.filters[0].value).toEqual({ max: 6000 });
    expect(parsed.preferences).toEqual(['vintage', 'autumn']);
    expect(parsed.terms).toEqual(['jacket']);
  });

  it('maps categories, synonyms and option labels', () => {
    const shoes = parseQuery('black nike shoes size 42 for men', consoleConfig);
    expect(labels(shoes.filters)).toEqual(['EU 42', 'Black', 'Nike', 'Men', 'Shoes']);
    expect(shoes.terms).toEqual([]);

    const sweater = parseQuery('sweater for women', consoleConfig);
    expect(labels(sweater.filters)).toEqual(['Women', 'Tops']);
    // Specific item words stay as keywords
    expect(sweater.terms).toEqual(['sweater']);

    expect(labels(parseQuery('baby winter jacket', consoleConfig).filters)).toEqual(['Kids']);
    expect(parseQuery("levi's jeans", consoleConfig).terms).toEqual(['jeans']);
  });

  it('keeps the filters of a starting state and adds the ones from the text', () => {
    const starting = {
      q: '',
      filters: [
        {
          key: 'categoryLevel1',
          value: 'men',
          label: 'Men',
          mode: 'hard',
          locked: false,
          source: 'user',
          op: 'eq',
        },
      ],
      preferences: [],
      removed: [],
      similarTo: null,
      terms: [],
    };
    const { state } = nextState('black jeans size M', starting, consoleConfig);
    expect(labels(state.filters)).toEqual(['Men', 'Size M', 'Black']);
  });

  it('refines the previous search and keeps filters the buyer set', () => {
    const first = nextState('black jacket for men', null, consoleConfig).state;
    const withUserColour = {
      ...first,
      filters: first.filters.map(f => (f.key === 'color' ? { ...f, source: 'user' } : f)),
    };
    const { state, notices } = nextState('in blue', withUserColour, consoleConfig);
    expect(labels(state.filters)).toContain('Black');
    expect(notices).toEqual([{ code: 'USER_FILTER_KEPT', params: { label: 'Black' } }]);
  });
});
