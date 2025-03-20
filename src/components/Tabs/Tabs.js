import React from 'react';
import classNames from 'classnames';
import { TabNav } from '../../components';

import css from './Tabs.module.css';

/**
 * Tabs creates view area that has tabs made out of its children.
 * It only expects all its children to have 'tabLabel', 'tabLinkProps' props.
 * In addition, 'selected' prop specifies which tab is open and 'disabled' renders tab inaccessible.
 *
 * @example
 *  <Tabs>
 *    <Child tabLabel="Tab1" tabLinkProps={{ name: 'SomeTab1Page' }}>
 *      Tab1 stuff
 *    </Child>
 *    <Child tabLabel="Tab2" tabLinkProps={{ name: 'SomeTab2Page' }} selected >
 *      Tab2 stuff
 *    </Child>
 *  </Tabs>
 *
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - The children to render
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.navRootClassName] - Custom class that overrides the default class for the nav element
 * @param {string} [props.tabRootClassName] - Custom class that overrides the default class for the tab element
 * @returns {JSX.Element} Tab navigation component
 */
const Tabs = props => {
  const { children, className, rootClassName, navRootClassName, tabRootClassName } = props;
  const rootClasses = rootClassName || css.root;
  const classes = classNames(rootClasses, className);

  const tabNavTabs = React.Children.map(children, child => {
    const { tabId, tabLabel, tabLinkProps } = child.props;

    // Child components need to have TabNav props included
    if (!tabId || !tabLabel || !tabLinkProps) {
      throw new Error(
        `Tabs component: a child component is missing required props.
        tabId: (${tabId})
        tabLabel: (${tabLabel})
        tabLinkProps: (${tabLinkProps})`
      );
    }

    return {
      id: tabId,
      text: child.props.tabLabel,
      linkProps: child.props.tabLinkProps,
      disabled: child.props.disabled,
      selected: child.props.selected,
    };
  });

  const childArray = React.Children.toArray(children);
  const selectedTabPanel = childArray.find(c => c.props.selected);

  // One of the children needs to be selected
  if (!selectedTabPanel) {
    throw new Error(`Tabs component: one Child should have 'selected' prop.`);
  }

  return (
    <div className={classes}>
      <TabNav
        rootClassName={navRootClassName}
        tabs={tabNavTabs}
        tabRootClassName={tabRootClassName}
      />
      {selectedTabPanel}
    </div>
  );
};

export default Tabs;
