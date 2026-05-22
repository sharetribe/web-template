'use strict';

const { parseCsv, validateRows, normalizeColumns, COLUMN_ALIASES } = require('./csvParser');

// Helper to build a CSV buffer from header + row arrays
function buildCsv(headers, ...rows) {
  const lines = [headers.join(','), ...rows.map(r => r.join(','))];
  return Buffer.from(lines.join('\n'));
}

describe('parseCsv', () => {
  it('parses a valid CSV buffer into row objects', () => {
    const buf = buildCsv(['title', 'price', 'description'], ['"A Dress"', '100', '"Nice dress"']);
    const rows = parseCsv(buf);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({ title: 'A Dress', price: '100', description: 'Nice dress' });
  });

  it('trims whitespace from values', () => {
    const buf = Buffer.from('title,price,description\n  Hat  , 50 , A hat \n');
    const rows = parseCsv(buf);
    expect(rows[0].title).toBe('Hat');
    expect(rows[0].price).toBe('50');
  });

  it('skips empty lines', () => {
    const buf = Buffer.from('title,price,description\nA,10,B\n\nC,20,D\n');
    const rows = parseCsv(buf);
    expect(rows).toHaveLength(2);
  });

  it('throws on malformed CSV', () => {
    const buf = Buffer.from('"unclosed quote');
    expect(() => parseCsv(buf)).toThrow();
  });
});

describe('validateRows', () => {
  const imageMap = new Map();
  imageMap.set('front.jpg', Buffer.from('img'));
  imageMap.set('back.jpg', Buffer.from('img'));

  function validRow(overrides = {}) {
    return {
      title: 'Test Item',
      description: 'A description',
      price: '250.00',
      ...overrides,
    };
  }

  // --- Required column checks ---

  it('rejects empty row array', () => {
    const result = validateRows([], imageMap);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('CSV file is empty.');
  });

  it('rejects CSV exceeding 100 rows', () => {
    const rows = Array.from({ length: 101 }, () => validRow());
    const result = validateRows(rows, imageMap);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/Maximum is 100/);
  });

  it('rejects rows missing required columns', () => {
    const rows = [{ title: 'A', price: '10' }]; // missing description column
    const result = validateRows(rows, imageMap);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('Missing required column: "description"')])
    );
  });

  // --- Per-row validation ---

  it('rejects empty title', () => {
    const result = validateRows([validRow({ title: '' })], imageMap);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/"title" is empty/);
  });

  it('rejects empty description', () => {
    const result = validateRows([validRow({ description: '' })], imageMap);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/"description" is empty/);
  });

  it('rejects non-numeric price', () => {
    const result = validateRows([validRow({ price: 'abc' })], imageMap);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/"price" must be a positive number/);
  });

  it('rejects zero price', () => {
    const result = validateRows([validRow({ price: '0' })], imageMap);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/"price" must be a positive number/);
  });

  it('rejects negative price', () => {
    const result = validateRows([validRow({ price: '-50' })], imageMap);
    expect(result.valid).toBe(false);
  });

  it('rejects image reference not in imageMap', () => {
    const result = validateRows(
      [
        validRow({
          image_front: 'missing.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/not found in uploaded files/);
  });

  it.each(['image_front', 'image_back', 'image_horizontal'])(
    'rejects missing required image column %s',
    key => {
      const result = validateRows(
        [
          validRow({
            image_front: 'front.jpg',
            image_back: 'back.jpg',
            image_horizontal: 'front.jpg',
            [key]: '',
          }),
        ],
        imageMap
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining(`"${key}" is required.`)])
      );
    }
  );

  it('rejects invalid geolocation', () => {
    const result = validateRows(
      [
        validRow({
          location_lat: 'abc',
          location_lng: '10',
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/Invalid geolocation/);
  });

  // --- Successful validation ---

  it('returns valid result for correct rows', () => {
    const result = validateRows(
      [
        validRow({
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
  });

  // --- Field parsing ---

  it('parses price as a float', () => {
    const result = validateRows(
      [
        validRow({
          price: '99.50',
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].price).toBe(99.5);
  });

  it('defaults currency to MXN', () => {
    const result = validateRows(
      [
        validRow({
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].currency).toBe('MXN');
  });

  it('respects currency column', () => {
    const result = validateRows(
      [
        validRow({
          currency: 'usd',
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].currency).toBe('USD');
  });

  it('defaults publish to true', () => {
    const result = validateRows(
      [
        validRow({
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].publish).toBe(true);
  });

  it('publish=no sets publish to false', () => {
    const result = validateRows(
      [
        validRow({
          publish: 'no',
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].publish).toBe(false);
  });

  it('defaults stock to 1', () => {
    const result = validateRows(
      [
        validRow({
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].stock).toBe(1);
  });

  it('parses stock column', () => {
    const result = validateRows(
      [
        validRow({
          stock: '5',
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].stock).toBe(5);
  });

  it('defaults shippingEnabled to true', () => {
    const result = validateRows(
      [
        validRow({
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].shippingEnabled).toBe(true);
  });

  it('defaults pickupEnabled to false', () => {
    const result = validateRows(
      [
        validRow({
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].pickupEnabled).toBe(false);
  });

  // --- Image slot mapping ---

  it('maps image columns to imageSlots', () => {
    const result = validateRows(
      [validRow({ image_front: 'front.jpg', image_back: 'back.jpg' })],
      imageMap
    );
    expect(result.rows[0].imageSlots).toEqual({ front: 'front.jpg', back: 'back.jpg' });
  });

  it('ignores empty image columns', () => {
    const result = validateRows(
      [
        validRow({
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
          image_details: '',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].imageSlots).toEqual({
      front: 'front.jpg',
      back: 'back.jpg',
      horizontal: 'front.jpg',
    });
  });

  it('keeps image_details optional', () => {
    const result = validateRows(
      [
        validRow({
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
          image_details: '',
        }),
      ],
      imageMap
    );
    expect(result.valid).toBe(true);
    expect(result.rows[0].imageSlots.details).toBeUndefined();
  });

  // --- publicData extraction ---

  it('extracts pd_* columns as publicData', () => {
    const result = validateRows(
      [
        validRow({
          pd_color: 'azul',
          pd_brand: 'Levi',
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    // color is multi-enum: single value becomes an array
    expect(result.rows[0].publicData).toEqual({ color: ['azul'], brand: 'Levi' });
  });

  it('pd_color single value is stored as an array', () => {
    const result = validateRows(
      [
        validRow({
          pd_color: 'negro',
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].publicData.color).toEqual(['negro']);
  });

  it('pd_color multiple pipe-separated values stored as array', () => {
    const result = validateRows(
      [
        validRow({
          pd_color: 'azul|negro',
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].publicData.color).toEqual(['azul', 'negro']);
  });

  it('pd_estilo single value is stored as an array', () => {
    const result = validateRows(
      [
        validRow({
          pd_estilo: 'vintage',
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].publicData.estilo).toEqual(['vintage']);
  });

  it('pd_all_sizes single value is stored as an array', () => {
    const result = validateRows(
      [
        validRow({
          pd_all_sizes: 's',
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].publicData.all_sizes).toEqual(['s']);
  });

  it('splits pipe-separated pd_* values into arrays', () => {
    const result = validateRows(
      [
        validRow({
          pd_all_sizes: 's|m|l',
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].publicData.all_sizes).toEqual(['s', 'm', 'l']);
  });

  it('single pd_* value stays as string', () => {
    const result = validateRows(
      [
        validRow({
          pd_era: '80s',
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].publicData.era).toBe('80s');
  });

  it.each(['pd___proto__', 'pd_constructor', 'pd_prototype'])(
    'rejects reserved publicData key from column %s',
    column => {
      const result = validateRows(
        [
          validRow({
            [column]: 'evil',
            image_front: 'front.jpg',
            image_back: 'back.jpg',
            image_horizontal: 'front.jpg',
          }),
        ],
        imageMap
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining(`publicData column "${column}" uses a reserved key`),
        ])
      );
      const reservedKey = column.slice(3);
      expect(Object.prototype.hasOwnProperty.call(result.rows[0].publicData, reservedKey)).toBe(
        false
      );
      expect({}[reservedKey === 'constructor' ? 'arbitrary_unset' : reservedKey]).not.toBe('evil');
    }
  );

  it('publicData uses a null prototype', () => {
    const result = validateRows(
      [
        validRow({
          pd_color: 'blue',
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(Object.getPrototypeOf(result.rows[0].publicData)).toBeNull();
  });

  it('ignores empty pd_* columns', () => {
    const result = validateRows(
      [
        validRow({
          pd_color: '',
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].publicData).toEqual({});
  });

  // --- Geolocation ---

  it('parses lat/lng as floats', () => {
    const result = validateRows(
      [
        validRow({
          location_lat: '19.43',
          location_lng: '-99.13',
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].lat).toBe(19.43);
    expect(result.rows[0].lng).toBe(-99.13);
  });

  it('sets lat/lng to null when not provided', () => {
    const result = validateRows(
      [
        validRow({
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].lat).toBeNull();
    expect(result.rows[0].lng).toBeNull();
  });

  // --- Row numbering ---

  it('assigns rowNum starting from 1 (1-indexed data rows)', () => {
    const result = validateRows(
      [
        validRow({
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
        validRow({
          image_front: 'front.jpg',
          image_back: 'back.jpg',
          image_horizontal: 'front.jpg',
        }),
      ],
      imageMap
    );
    expect(result.rows[0].rowNum).toBe(1);
    expect(result.rows[1].rowNum).toBe(2);
  });

  // --- Spanish column alias (Google Sheets format) ---

  it('accepts Spanish column names exported from Google Sheets', () => {
    const imageMap = new Map([
      ['camisa_frontal.jpg', Buffer.from('img')],
      ['camisa_posterior.jpg', Buffer.from('img')],
      ['camisa_detalle.jpg', Buffer.from('img')],
    ]);
    const buf = Buffer.from(
      [
        'Título,Descripción ,Precio Venta (mxn),Imagen 1: Frontal* ,Imagen 2: Posterior*,Imagen 3: Detalle*,Categoría,Subcategoría 1,Color,Talla,Marca,Genero,Estado,Estilo',
        'Camisa NOA,Hermosa camisa vintage,1500,camisa_frontal.jpg,camisa_posterior.jpg,camisa_detalle.jpg,ropa,ropa-camisas,rosa,s|m,vintage,mujer,como-nuevo,vintage',
      ].join('\n')
    );
    const rows = parseCsv(buf);
    expect(rows[0].title).toBe('Camisa NOA');
    expect(rows[0].price).toBe('1500');
    expect(rows[0].description).toBe('Hermosa camisa vintage');
    expect(rows[0].image_front).toBe('camisa_frontal.jpg');
    expect(rows[0].image_back).toBe('camisa_posterior.jpg');
    expect(rows[0].image_horizontal).toBe('camisa_detalle.jpg');
    expect(rows[0].pd_categoryLevel1).toBe('ropa');
    expect(rows[0].pd_categoryLevel2).toBe('ropa-camisas');
    expect(rows[0].pd_color).toBe('rosa');
    expect(rows[0].pd_all_sizes).toBe('s|m');
    expect(rows[0].pd_brand).toBe('vintage');
    expect(rows[0].pd_genero).toBe('mujer');
    expect(rows[0].pd_estado).toBe('como-nuevo');
    expect(rows[0].pd_estilo).toBe('vintage');

    const result = validateRows(rows, imageMap);
    expect(result.valid).toBe(true);
    expect(result.rows[0].title).toBe('Camisa NOA');
    expect(result.rows[0].publicData.categoryLevel1).toBe('ropa');
    expect(result.rows[0].publicData.color).toEqual(['rosa']);
  });

  it('passes through English column names unchanged', () => {
    const buf = Buffer.from('title,price,description\nHat,50,A hat\n');
    const rows = parseCsv(buf);
    expect(rows[0].title).toBe('Hat');
    expect(rows[0].price).toBe('50');
    expect(rows[0].description).toBe('A hat');
  });

  // --- normalizeColumns ---

  describe('normalizeColumns', () => {
    it('returns empty array unchanged', () => {
      expect(normalizeColumns([])).toEqual([]);
    });

    it('maps each Spanish alias to its canonical key', () => {
      const input = [{ Título: 'Test', 'Precio Venta (mxn)': '100', Descripción: 'Desc' }];
      const result = normalizeColumns(input);
      expect(result[0]).toEqual({ title: 'Test', price: '100', description: 'Desc' });
    });

    it('trims trailing/leading whitespace from Spanish header keys', () => {
      const input = [{ 'Título ': 'Test', ' Descripción': 'Desc', 'Precio Venta (mxn)': '50' }];
      const result = normalizeColumns(input);
      expect(result[0].title).toBe('Test');
      expect(result[0].description).toBe('Desc');
    });

    it('maps Imagen 3 to image_horizontal', () => {
      const input = [{ Título: 'x', 'Imagen 3: Detalle*': 'photo.jpg' }];
      const result = normalizeColumns(input);
      expect(result[0].image_horizontal).toBe('photo.jpg');
    });

    it('passes through unknown keys unchanged', () => {
      const input = [{ Título: 'x', extra_column: 'val' }];
      const result = normalizeColumns(input);
      expect(result[0].extra_column).toBe('val');
    });

    it('exports all expected aliases', () => {
      const expectedTargets = [
        'title',
        'description',
        'price',
        'pd_originalPrice',
        'image_front',
        'image_back',
        'image_horizontal',
        'image_details',
        'pd_categoryLevel1',
        'pd_categoryLevel2',
        'pd_categoryLevel3',
        'pd_color',
        'pd_all_sizes',
        'pd_brand',
        'pd_genero',
        'pd_estado',
        'pd_estilo',
      ];
      const aliasValues = Object.values(COLUMN_ALIASES);
      for (const target of expectedTargets) {
        expect(aliasValues).toContain(target);
      }
    });
  });

  // --- Multiple errors ---

  it('collects errors from multiple rows', () => {
    const result = validateRows([validRow({ title: '' }), validRow({ price: 'bad' })], imageMap);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('collects multiple validation errors for missing required images', () => {
    const result = validateRows(
      [
        validRow({
          image_front: '',
          image_back: '',
          image_horizontal: '',
        }),
      ],
      imageMap
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('"image_front" is required.'),
        expect.stringContaining('"image_back" is required.'),
        expect.stringContaining('"image_horizontal" is required.'),
      ])
    );
  });
});
