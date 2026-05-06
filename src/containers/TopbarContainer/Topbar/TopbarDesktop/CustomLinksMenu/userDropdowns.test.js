import { fetchLocalDesignUsers, resolveUserDropdownMenuItems } from './userDropdowns';

jest.mock('../../../../../util/api', () => ({
  topbarLocalDesignUsers: jest.fn(),
}));

import { topbarLocalDesignUsers } from '../../../../../util/api';

describe('userDropdowns', () => {
  it('maps local design users to profile links', () => {
    expect(
      resolveUserDropdownMenuItems([
        { id: 'user-1', text: 'Tienda Uno' },
        { id: 'user-2', text: 'Tienda Dos' },
        { id: null, text: 'Ignored' },
      ])
    ).toEqual([
      {
        group: 'primary',
        type: 'internal',
        route: {
          name: 'ProfilePage',
          params: { id: 'user-1' },
        },
        text: 'Tienda Uno',
      },
      {
        group: 'primary',
        type: 'internal',
        route: {
          name: 'ProfilePage',
          params: { id: 'user-2' },
        },
        text: 'Tienda Dos',
      },
    ]);
  });

  it('fetches local design users from the server endpoint', async () => {
    topbarLocalDesignUsers.mockResolvedValueOnce({
      users: [
        { id: 'user-1', text: 'Tienda Uno' },
        { id: 'user-2', text: 'Tienda Dos' },
      ],
    });

    await expect(fetchLocalDesignUsers()).resolves.toEqual([
      { id: 'user-1', text: 'Tienda Uno' },
      { id: 'user-2', text: 'Tienda Dos' },
    ]);
  });

  it('falls back to an empty list when the request fails', async () => {
    topbarLocalDesignUsers.mockRejectedValueOnce(new Error('failed'));

    await expect(fetchLocalDesignUsers()).resolves.toEqual([]);
  });
});
