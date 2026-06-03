import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../../util/reactIntl';
import { NamedLink } from '../../../../components';
import { useConfiguration } from '../../../../context/configurationContext';

import {
  defaultTopbarCategoryDropdowns,
  fetchLocalTopbarData,
  getCategoryDropdownsConfig,
  resolveDropdownMenuItems,
} from '../TopbarDesktop/CustomLinksMenu/categoryDropdowns';
import {
  fetchLocalDesignUsers,
  resolveUserDropdownMenuItems,
} from '../TopbarDesktop/CustomLinksMenu/userDropdowns';

import css from './TopbarMobileMenu.module.css';

const Chevron = ({ open }) => (
  <span className={classNames(css.mobileNavChevron, open ? css.mobileNavChevronOpen : null)} />
);

const AccordionSection = ({ labelId, children, open, onToggle }) => {
  if (!children || (Array.isArray(children) && children.flat().filter(Boolean).length === 0)) {
    return null;
  }
  return (
    <>
      <li
        className={classNames(
          css.mobileNavSectionTitle,
          open ? css.mobileNavSectionTitleOpen : null
        )}
        onClick={onToggle}
        role="button"
        aria-expanded={open}
      >
        <FormattedMessage id={labelId} />
        <Chevron open={open} />
      </li>
      {open ? children : null}
    </>
  );
};

/**
 * Mobile-appropriate nav menu: fetches category + designer data, renders as
 * accordion sections (click to expand/collapse) aligned with other mobile menu items.
 */
const MobileCustomLinksMenu = ({ intl }) => {
  const config = useConfiguration();
  const [mounted, setMounted] = useState(false);
  const [localTopbarData, setLocalTopbarData] = useState(null);
  const [localDesignUsers, setLocalDesignUsers] = useState([]);
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = key => setOpenSection(prev => (prev === key ? null : key));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let isActive = true;
    fetchLocalTopbarData(window.fetch.bind(window)).then(data => {
      if (isActive && data) setLocalTopbarData(data);
    });
    return () => {
      isActive = false;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    let isActive = true;
    fetchLocalDesignUsers().then(users => {
      if (isActive) setLocalDesignUsers(users || []);
    });
    return () => {
      isActive = false;
    };
  }, [mounted]);

  const categoryDropdowns = getCategoryDropdownsConfig(localTopbarData);
  const fallbackDropdown1 = localTopbarData
    ? []
    : defaultTopbarCategoryDropdowns.menuLinksDropdown1;
  const fallbackDropdown2 = localTopbarData
    ? []
    : defaultTopbarCategoryDropdowns.menuLinksDropdown2;

  const items1 = resolveDropdownMenuItems(
    categoryDropdowns.menuLinksDropdown1,
    config?.categoryConfiguration,
    fallbackDropdown1
  );
  const items2 = resolveDropdownMenuItems(
    categoryDropdowns.menuLinksDropdown2,
    config?.categoryConfiguration,
    fallbackDropdown2
  );
  const userItems = resolveUserDropdownMenuItems(localDesignUsers);

  const leftOneSearch = intl.formatMessage({ id: 'Topbar.custom.leftOneHref' });

  const renderCategoryItems = items =>
    items.map((item, i) => {
      const search = item.href?.replace(/^\/s/, '') || '';
      return (
        <li key={i} className={classNames(css.navigationLink, css.mobileNavSubItem)}>
          <NamedLink name="SearchPage" to={{ search }}>
            {item.text}
          </NamedLink>
        </li>
      );
    });

  const renderUserItems = items =>
    items.map((item, i) => (
      <li key={i} className={classNames(css.navigationLink, css.mobileNavSubItem)}>
        <NamedLink name={item.route.name} params={item.route.params}>
          {item.text}
        </NamedLink>
      </li>
    ));

  return (
    <ul className={css.customLinksWrapper}>
      <li className={css.navigationLink}>
        <NamedLink name="SearchPage" to={{ search: leftOneSearch }}>
          <FormattedMessage id="Topbar.custom.leftOne" />
        </NamedLink>
      </li>

      <AccordionSection
        labelId="Topbar.custom.menuOne"
        open={openSection === 'menu1'}
        onToggle={() => toggleSection('menu1')}
      >
        {renderCategoryItems(items1)}
      </AccordionSection>

      <AccordionSection
        labelId="Topbar.custom.menuTwo"
        open={openSection === 'menu2'}
        onToggle={() => toggleSection('menu2')}
      >
        {renderCategoryItems(items2)}
      </AccordionSection>

      <AccordionSection
        labelId="Topbar.custom.menuThree"
        open={openSection === 'menu3'}
        onToggle={() => toggleSection('menu3')}
      >
        {renderUserItems(userItems)}
      </AccordionSection>
    </ul>
  );
};

export default MobileCustomLinksMenu;
