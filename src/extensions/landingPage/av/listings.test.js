import { setTagListingIds } from '../../../ducks/avExtension.duck';

import { loadCustomSectionListings, parseFilterFromBlockName } from './listings';

jest.mock('../../../util/log', () => ({
  error: jest.fn(),
}));

const createDispatch = sdk => {
  const actions = [];
  const dispatch = action => {
    if (typeof action === 'function') {
      return action(dispatch, () => ({ marketplaceData: { entities: {} } }), sdk);
    }
    actions.push(action);
    return action;
  };

  dispatch.actions = actions;
  return dispatch;
};

const listingResponse = ids => ({
  data: {
    data: ids.map(id => ({ id: { uuid: id } })),
    included: [],
  },
});

const userResponse = id => ({
  data: {
    data: { id: { uuid: id } },
    included: [],
  },
});

describe('parseFilterFromBlockName', () => {
  it('parses tag: prefix into pub_tags filter', () => {
    expect(parseFilterFromBlockName('tag:hot-list')).toEqual({ pub_tags: 'hot-list' });
    expect(parseFilterFromBlockName('tag:summer')).toEqual({ pub_tags: 'summer' });
  });

  it('parses cat: prefix into pub_categoryLevel1 filter', () => {
    expect(parseFilterFromBlockName('cat:blazers')).toEqual({ pub_categoryLevel1: 'blazers' });
    expect(parseFilterFromBlockName('cat:dress-party')).toEqual({
      pub_categoryLevel1: 'dress-party',
    });
  });

  it('defaults plain values to pub_tags filter', () => {
    expect(parseFilterFromBlockName('hot-list')).toEqual({ pub_tags: 'hot-list' });
    expect(parseFilterFromBlockName('summer')).toEqual({ pub_tags: 'summer' });
  });

  it('returns null for empty or missing values', () => {
    expect(parseFilterFromBlockName('')).toBeNull();
    expect(parseFilterFromBlockName(null)).toBeNull();
    expect(parseFilterFromBlockName(undefined)).toBeNull();
  });
});

describe('loadCustomSectionListings', () => {
  it('batches recommended and selected listing IDs into one Marketplace API query', async () => {
    const sdk = {
      listings: { query: jest.fn(() => Promise.resolve(listingResponse([]))) },
      users: { show: jest.fn(() => Promise.resolve(userResponse('user-1'))) },
    };
    const dispatch = createDispatch(sdk);
    const pageData = {
      sections: [
        {
          sectionId: 'av-recommendeds',
          blocks: [{ blockName: 'listing-1' }, { blockName: 'listing-2' }],
        },
        {
          sectionId: 'av-selections-editorial',
          blocks: [{ blockName: 'listing-2' }, { blockName: 'listing-3' }],
        },
        {
          sectionId: 'av-selections-weekend',
          blocks: [{ blockName: 'listing-4' }],
        },
      ],
    };

    await loadCustomSectionListings({ pageData, dispatch, config: {} });

    expect(sdk.listings.query).toHaveBeenCalledTimes(1);
    expect(sdk.listings.query.mock.calls[0][0].ids).toEqual([
      'listing-1',
      'listing-2',
      'listing-3',
      'listing-4',
    ]);
    expect(sdk.users.show).not.toHaveBeenCalled();
  });

  it('dedupes tag/category filter queries and stores returned IDs for each matching section', async () => {
    const sdk = {
      listings: {
        query: jest.fn(params => {
          if (params.pub_tags === 'hot-list') {
            return Promise.resolve(listingResponse(['hot-1', 'hot-2']));
          }
          return Promise.resolve(listingResponse(['dress-1']));
        }),
      },
      users: { show: jest.fn(() => Promise.resolve(userResponse('user-1'))) },
    };
    const dispatch = createDispatch(sdk);
    const pageData = {
      sections: [
        { sectionId: 'av-tag-listings-a', blocks: [{ blockName: 'tag:hot-list' }] },
        { sectionId: 'av-tag-listings-b', blocks: [{ blockName: 'tag:hot-list' }] },
        { sectionId: 'av-tag-listings-c', blocks: [{ blockName: 'cat:dresses' }] },
      ],
    };

    await loadCustomSectionListings({ pageData, dispatch, config: {} });

    expect(sdk.listings.query).toHaveBeenCalledTimes(2);
    expect(sdk.listings.query.mock.calls.map(([params]) => params)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ pub_tags: 'hot-list', perPage: 24 }),
        expect.objectContaining({ pub_categoryLevel1: 'dresses', perPage: 24 }),
      ])
    );

    const tagAction = dispatch.actions.find(action => action.type === setTagListingIds.type);
    expect(tagAction.payload).toEqual({
      'av-tag-listings-a': ['hot-1', 'hot-2'],
      'av-tag-listings-b': ['hot-1', 'hot-2'],
      'av-tag-listings-c': ['dress-1'],
    });
  });

  it('caps filter sections and selected users during SSR loading', async () => {
    const sdk = {
      listings: { query: jest.fn(() => Promise.resolve(listingResponse([]))) },
      users: { show: jest.fn(({ id }) => Promise.resolve(userResponse(id))) },
    };
    const dispatch = createDispatch(sdk);
    const pageData = {
      sections: [
        ...Array.from({ length: 10 }, (_, i) => ({
          sectionId: `av-tag-listings-${i}`,
          blocks: [{ blockName: `tag:tag-${i}` }],
        })),
        {
          sectionId: 'av-selected-users-large',
          blocks: Array.from({ length: 30 }, (_, i) => ({ blockName: `user-${i}` })),
        },
      ],
    };

    await loadCustomSectionListings({ pageData, dispatch, config: {} });

    expect(sdk.listings.query).toHaveBeenCalledTimes(8);
    expect(sdk.users.show).toHaveBeenCalledTimes(24);
  });

  it('reuses cached public user responses across landing data loads', async () => {
    const sdk = {
      listings: { query: jest.fn(() => Promise.resolve(listingResponse([]))) },
      users: { show: jest.fn(({ id }) => Promise.resolve(userResponse(id))) },
    };
    const pageData = {
      sections: [
        {
          sectionId: 'av-selected-users-cache',
          blocks: [{ blockName: 'cache-user-1' }, { blockName: 'cache-user-2' }],
        },
      ],
    };

    await loadCustomSectionListings({ pageData, dispatch: createDispatch(sdk), config: {} });
    await loadCustomSectionListings({ pageData, dispatch: createDispatch(sdk), config: {} });

    expect(sdk.users.show).toHaveBeenCalledTimes(2);
  });

  it('lets an individual filter section fail without rejecting the page data load', async () => {
    const sdk = {
      listings: {
        query: jest.fn(params => {
          if (params.pub_tags === 'bad-tag') {
            return Promise.reject(new Error('rate limited'));
          }
          return Promise.resolve(listingResponse(['ok-1']));
        }),
      },
      users: { show: jest.fn(() => Promise.resolve(userResponse('user-1'))) },
    };
    const dispatch = createDispatch(sdk);
    const pageData = {
      sections: [
        { sectionId: 'av-tag-listings-ok', blocks: [{ blockName: 'tag:ok-tag' }] },
        { sectionId: 'av-tag-listings-bad', blocks: [{ blockName: 'tag:bad-tag' }] },
      ],
    };

    await expect(
      loadCustomSectionListings({ pageData, dispatch, config: {} })
    ).resolves.toBeUndefined();

    const tagAction = dispatch.actions.find(action => action.type === setTagListingIds.type);
    expect(tagAction.payload).toEqual({
      'av-tag-listings-ok': ['ok-1'],
      'av-tag-listings-bad': [],
    });
  });
});
