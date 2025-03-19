const getResourceName = (resource) => {
  // Change this function in the future to support more fine-grained resources
  switch (resource) {
    case 'users':
    case 'current_user':
    case 'password_reset':
    case 'stripe_account':
    case 'stripe_customer':
      return 'user';
    case 'listings':
    case 'own_listings':
    case 'images':
    case 'availability_exceptions':
    case 'stock':
      return 'listing';
    case 'process_transitions':
    case 'transactions':
    case 'reviews':
    case 'messages':
      return 'transaction';
    case 'permission-manager':
      return 'user[permission-manager]';
    default:
      return 'user';
  }
};
exports.getResourceName = getResourceName;
