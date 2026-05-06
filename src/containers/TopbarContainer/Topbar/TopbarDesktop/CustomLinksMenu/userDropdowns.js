import { topbarLocalDesignUsers } from '../../../../../util/api';

export const fetchLocalDesignUsers = () => {
  return topbarLocalDesignUsers()
    .then(response => response?.users || [])
    .catch(() => []);
};

export const resolveUserDropdownMenuItems = users => {
  return (users || [])
    .map(user => {
      const id = user?.id;
      const text = user?.text;

      return id && text
        ? {
            group: 'primary',
            type: 'internal',
            route: {
              name: 'ProfilePage',
              params: { id },
            },
            text,
          }
        : null;
    })
    .filter(Boolean);
};
