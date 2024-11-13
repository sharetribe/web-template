import React from 'react';
import MyCalendar from '../../components/MyCalendar/MyCalendar';
import CodeChecker from '../../components/CodeChecker/CodeChecker';
const pageComponentMap = {
  overview: MyCalendar,
  gift: CodeChecker,
};

/**
 * A function that returns the component associated with a given pageId.
 * @param {string} pageId - The ID of the page to render.
 * @param {Object} props - Props to be passed to the dynamically loaded component.
 * @returns {React.Component|null} - The component to render, or null if no match is found.
 */
function DynamicLoader(pageId, props) {
  const Component = pageComponentMap[pageId];

  if (Component) {
    // If a component is found for the pageId, return it with the passed props
    return <Component {...props} />;
  }
  // Return null or a default component if there is no match for the pageId
  return null;
}

export default DynamicLoader;
