/**
 * AV profile-menu link registry.
 *
 * Single source of truth for the AV-specific entries that appear in the
 * topbar profile menu (desktop), the topbar mobile menu, and the UserNav
 * tab strip. Each consumer iterates this array and renders its own JSX
 * shape, so adding a new AV page = one entry here + the route registration.
 */

export const AV_PROFILE_LINKS = [
  {
    pageName: 'MyPurchasesPage',
    labels: {
      desktop: 'TopbarDesktop.myPurchasesLink',
      mobile: 'TopbarMobileMenu.myPurchasesLink',
      userNav: 'UserNav.myPurchases',
    },
  },
  {
    pageName: 'MySalesPage',
    labels: {
      desktop: 'TopbarDesktop.mySalesLink',
      mobile: 'TopbarMobileMenu.mySalesLink',
      userNav: 'UserNav.mySales',
    },
  },
  {
    pageName: 'MyBalancePage',
    labels: {
      desktop: 'TopbarDesktop.myBalanceLink',
      mobile: 'TopbarMobileMenu.myBalanceLink',
      userNav: 'UserNav.myBalance',
    },
  },
];
