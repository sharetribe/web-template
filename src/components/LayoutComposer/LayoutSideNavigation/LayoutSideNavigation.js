import React from 'react';
import classNames from 'classnames';

import LayoutComposer from '../LayoutComposer';
import LayoutWrapperAccountSettingsSideNav from './LayoutWrapperAccountSettingsSideNav';
import LayoutWrapperProfileSettingsSideNav from './LayoutWrapperProfileSettingsSideNav';

import css from './LayoutSideNavigation.module.css';

/**
 * Commonly used layout
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.containerClassName overwrite components own css.container
 * @param {string?} props.mainColumnClassName add more style rules in addition to css.main
 * @param {string?} props.sideNavClassName add more style rules in addition to css.sideNav
 * @param {ReactNode} props.children
 * @param {ReactNode} props.topbar
 * @param {ReactNode?} props.sideNav
 * @param {ReactNode?} props.footer
 * @param {boolean?} props.useAccountSettingsNav
 * @param {Object} props.accountSettingsNavProps
 * @param {string?} props.accountSettingsNavProps.currentPage
 * @param {boolean?} props.accountSettingsNavProps.showPaymentMethods
 * @param {boolean?} props.accountSettingsNavProps.showPayoutDetails
 * @returns {JSX.Element} LayoutComposer that expects children to be a function.
 */
const LayoutSideNavigation = props => {
  const {
    className,
    rootClassName,
    containerClassName,
    mainColumnClassName,
    sideNavClassName,
    children,
    topbar: topbarContent,
    footer: footerContent,
    sideNav: sideNavContent,
    useAccountSettingsNav,
    useProfileSettingsNav,
    withCreativeProfile,
    accountSettingsNavProps,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const containerClasses = containerClassName || css.container;

  // TODO: since responsiveAreas are still experimental,
  //       we don't separate "aside" through layoutComposer
  const layoutAreas = `
    topbar
    main
    footer
  `;

  return (
    <LayoutComposer areas={layoutAreas} className={classes} {...rest}>
      {layoutProps => {
        const { Topbar, Main, Footer } = layoutProps;
        return (
          <>
            <Topbar as="header" className={css.topbar}>
              {topbarContent}
            </Topbar>
            <Main as="div" className={containerClasses}>
              <aside className={classNames(css.sideNav, sideNavClassName)}>
                {useAccountSettingsNav ? (
                  <LayoutWrapperAccountSettingsSideNav
                    accountSettingsNavProps={accountSettingsNavProps}
                  />
                ) : null}
                {useProfileSettingsNav ? (
                  <LayoutWrapperProfileSettingsSideNav
                    accountSettingsNavProps={accountSettingsNavProps}
                    withCreativeProfile={withCreativeProfile}
                  />
                ) : null}
                {sideNavContent}
              </aside>
              <main className={classNames(css.main, mainColumnClassName)}>{children}</main>
            </Main>
            <Footer>{footerContent}</Footer>
          </>
        );
      }}
    </LayoutComposer>
  );
};

export default LayoutSideNavigation;
