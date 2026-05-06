import {
  defaultTopbarCategoryDropdowns,
  fetchLocalTopbarData,
  findCategoryByPath,
  getCategoryDropdownsConfig,
  LOCAL_TOPBAR_DATA_PATH,
  resolveDropdownMenuItems,
} from './categoryDropdowns';

const categoryConfiguration = {
  key: 'categoryLevel',
  categories: [
    {
      id: 'ropa',
      name: 'Ropa',
      subcategories: [
        { id: 'ropa-tops', name: 'Tops' },
        { id: 'ropa-camisetas', name: 'Camisetas' },
      ],
    },
    {
      id: 'accesorios',
      name: 'Accesorios',
      subcategories: [{ id: 'accesorios-cinturones', name: 'Cinturones' }],
    },
    {
      id: 'bolsas',
      name: 'Bolsas',
    },
  ],
};

describe('categoryDropdowns', () => {
  it('finds a category by nested path', () => {
    expect(findCategoryByPath(categoryConfiguration.categories, ['ropa', 'ropa-tops'])).toEqual({
      id: 'ropa-tops',
      name: 'Tops',
    });
  });

  it('resolves configured category paths into search links', () => {
    const items = resolveDropdownMenuItems(
      [
        { categoryPath: ['ropa'], label: 'Ver Todo' },
        { categoryPath: 'ropa/ropa-tops' },
        { categoryPath: ['accesorios', 'missing-subcategory'] },
      ],
      categoryConfiguration
    );

    expect(items).toEqual([
      {
        group: 'primary',
        href: '/s?pub_categoryLevel1=ropa',
        text: 'Ver Todo',
      },
      {
        group: 'primary',
        href: '/s?pub_categoryLevel1=ropa&pub_categoryLevel2=ropa-tops',
        text: 'Tops',
      },
    ]);
  });

  it('falls back to the default local definitions when hosted config is empty', () => {
    const items = resolveDropdownMenuItems(
      [],
      categoryConfiguration,
      defaultTopbarCategoryDropdowns.menuLinksDropdown1
    );

    expect(items[0]).toEqual({
      group: 'primary',
      href: '/s?pub_categoryLevel1=accesorios',
      text: 'Ver Todo',
    });
    expect(items[1]).toEqual({
      group: 'primary',
      href: '/s?pub_categoryLevel1=accesorios',
      text: 'Accesorios',
    });
  });

  it('reads category dropdown config from local top bar data', () => {
    expect(
      getCategoryDropdownsConfig({
        categoryDropdowns: {
          menuLinksDropdown1: [{ categoryPath: ['ropa'] }],
        },
      })
    ).toEqual({
      menuLinksDropdown1: [{ categoryPath: ['ropa'] }],
    });
  });

  it('fetches local top bar data from the static json path', async () => {
    const fetchFn = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            categoryDropdowns: {
              menuLinksDropdown1: [{ categoryPath: ['ropa'] }],
            },
          }),
      })
    );

    const result = await fetchLocalTopbarData(fetchFn);

    expect(fetchFn).toHaveBeenCalledWith(LOCAL_TOPBAR_DATA_PATH, {
      headers: { Accept: 'application/json' },
    });
    expect(result).toEqual({
      categoryDropdowns: {
        menuLinksDropdown1: [{ categoryPath: ['ropa'] }],
      },
    });
  });

  it('returns null when local top bar data file is missing', async () => {
    const fetchFn = jest.fn(() => Promise.resolve({ ok: false }));

    await expect(fetchLocalTopbarData(fetchFn)).resolves.toBeNull();
  });

  it('returns an empty array when no dropdown data is defined and no fallback is provided', () => {
    expect(resolveDropdownMenuItems(undefined, categoryConfiguration, [])).toEqual([]);
    expect(resolveDropdownMenuItems([], categoryConfiguration, [])).toEqual([]);
  });
});
