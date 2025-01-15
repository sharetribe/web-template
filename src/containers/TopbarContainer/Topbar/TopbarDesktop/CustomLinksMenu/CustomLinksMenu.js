import React, { useEffect, useRef, useState } from 'react';

import PriorityLinks, { CreateListingMenuLink } from './PriorityLinks';
import LinksMenu from './LinksMenu';

import css from './CustomLinksMenu.module.css';

const draftId = '00000000-0000-0000-0000-000000000000';
const createListingLinkConfig = intl => ({
  group: 'primary',
  text: intl.formatMessage({ id: 'TopbarDesktop.createListing' }),
  type: 'internal',
  route: {
    name: 'EditListingPage',
    params: { slug: 'draft', id: draftId, type: 'new', tab: 'details' },
  },
  highlight: true,
});

/**
 * Group links to 2 groups:
 * - priorityLinks (Those primary links that fit into current width of the TopbarDesktop.)
 * - menuLinks (The rest of the links that are shown inside dropdown menu.)
 *
 * @param {*} links array of link configs in an order where primary group is shown first
 * @param {*} containerWidth width reserved for the CustomLinksMenu component
 * @param {*} menuMoreWidth width that the "More" label takes
 * @returns Object containing arrays: { priorityLinks, menuLinks }
 */
const groupMeasuredLinks = (links, containerWidth, menuMoreWidth) => {
  const isMeasured = !!links?.[0]?.width && menuMoreWidth > 0;
  const hasNoPrimaryLinks = !links.find(l => l.group === 'primary');
  // - We can't calculate groups, if the width of the rendered links are not measured
  // - We don't need to calculate groups, if links don't contain any 'primary' links
  if (!isMeasured || hasNoPrimaryLinks) {
    return { priorityLinks: [], menuLinks: links };
  }

  const groupedLinks = links.reduce(
    (pickedLinks, link, i) => {
      const isPrimary = link.group === 'primary';
      const isLast = i === links.length - 1;
      // Has menuLinks at this point of the iteration (seconary links are at the end of the array)
      const hasMenuLinks = pickedLinks.menuLinks?.length > 0;

      const hasSpace =
        isLast && !hasMenuLinks
          ? link.cumulatedWidth <= containerWidth
          : link.cumulatedWidth + menuMoreWidth <= containerWidth;

      return isPrimary && hasSpace
        ? {
            priorityLinks: [...pickedLinks.priorityLinks, link],
            menuLinks: pickedLinks.menuLinks,
          }
        : {
            priorityLinks: pickedLinks.priorityLinks,
            menuLinks: [...pickedLinks.menuLinks, link],
          };
    },
    { priorityLinks: [], menuLinks: [] }
  );
  return groupedLinks;
};

const calculateContainerWidth = (containerRefTarget, parentWidth) => {
  // Siblings include logo, search form, (inbox, profile menu || login signup)
  const siblingArray = containerRefTarget?.parentNode?.childNodes
    ? Array.from(containerRefTarget.parentNode.childNodes).filter(n => n !== containerRefTarget)
    : [];
  const siblingWidthsCombined = siblingArray.reduce((acc, node) => acc + node.offsetWidth, 0);

  // .root class of the TopbarDesktop has 24px padding on the right
  // Firefox doesn't support computedStyleMap()
  const parentStyleMap = containerRefTarget?.parentElement?.computedStyleMap
    ? containerRefTarget.parentElement.computedStyleMap()
    : null;
  const topbarPaddingRight = parentStyleMap?.get('padding-right')?.value;
  const padding = topbarPaddingRight != null ? topbarPaddingRight : 24;

  // We figure out available width from parent (TopbarDesktop/<nav>) and siblings
  const availableContainerWidth = parentWidth - siblingWidthsCombined - padding;
  return availableContainerWidth;
};

/**
 * Create CustomLinksMenu component that takes all the extra space from the TopbarDesktop and
 * renders primary links directly there if there's enough space - and secondary links are shown inside a "More" menu.
 * If the space is limited, primary links as well as secondary links are shown inside the "More" menu.
 *
 * Note: this component is inherently a bit fragile as it needs to deal with DOM directly. If you customize TopbarDesktop,
 * test the responsiveness thoroughly.
 *
 * props:
 * - customLinks: array of link configurations.
 * - hasClientSideContentReady: indicates if TopbarDesktop is ready to render
 * - currentPage: string that indicates if this is "LandingPage" or "SearchPage", etc.
 * - intl: React Intl instance
 *
 * @param {*} props contains currentPage, customLinks, intl, and hasClientSideContentReady
 * @returns component to be placed inside TopbarDesktop
 */
const CustomLinksMenu = ({ currentPage, customLinks = [], hasClientSideContentReady, intl }) => {
  const containerRef = useRef(null);
  const observer = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [moreLabelWidth, setMoreLabelWidth] = useState(0);
  const [links, setLinks] = useState([createListingLinkConfig(intl), ...customLinks]);
  const [layoutData, setLayoutData] = useState({
    priorityLinks: links,
    menuLinks: links,
    containerWidth: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let animationFrameId = null;
    const body = document.body;
    const container = containerRef.current;

    if (hasClientSideContentReady && moreLabelWidth > 0) {
      // ResizeObserver sets layout data: grouped priority links and links that go to menuLinks dropdown
      observer.current = new ResizeObserver(entries => {
        const containerRefParentWidth = container?.parentNode?.offsetWidth;
        const bodyOffsetWidth = body.offsetWidth;

        for (const entry of entries) {
          // Body's width has changed (aka viewport has changed)
          const isBodyTheTarget = entry.target === body;
          // If the width of the TopbarDesktop (aka <nav>) changes, this assumes that the document.body has the correct width.
          const hasWidthOfTopbarDesktopChanged =
            !isBodyTheTarget && containerRefParentWidth !== bodyOffsetWidth;

          if (isBodyTheTarget || hasWidthOfTopbarDesktopChanged) {
            const target = container;
            const availableContainerWidth = calculateContainerWidth(target, bodyOffsetWidth);

            // The groupedLinks variable contains { priorityLinks, menuLinks }
            const groupedLinks = groupMeasuredLinks(links, availableContainerWidth, moreLabelWidth);
            // The setLayoutData call affects the UI. This pushes the painting to the next frame.
            animationFrameId = window.requestAnimationFrame(() => {
              if (container) {
                setLayoutData({ ...groupedLinks, containerWidth: availableContainerWidth });
              }
            });
            // After setLayoutData is called, don't process other entries
            break;
          }
        }
      });

      if (container) {
        // We need to observe both document body and the component's own container
        // When the window is squeezed, priority links prevent the container to shrink smaller.
        // At that point, we need to calculate the width from the width of the body.
        // It's also possible that some of the other elements get a repaint after window-level repaint (e.g. image loads)
        // In those cases, we just need to
        observer.current.observe(body);
        observer.current.observe(container);
      }
    }
    return () => {
      if (body) {
        observer.current?.unobserve(body);
      }
      if (container) {
        observer.current?.unobserve(container);
      }
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [containerRef, hasClientSideContentReady, moreLabelWidth, links]);

  const { priorityLinks, menuLinks, containerWidth } = layoutData;

  // If there are no custom links, just render createListing link.
  if (customLinks?.length === 0) {
    return <CreateListingMenuLink customLinksMenuClass={css.createListingLinkOnly} />;
  }

  const styleMaybe = mounted ? { style: { width: `${containerWidth}px` } } : {};
  const isMeasured = !!links?.[0]?.width;
  const hasMenuLinks = menuLinks?.length > 0;
  const hasPriorityLinks = isMeasured && priorityLinks.length > 0;

  return (
    <div className={css.customLinksMenu} ref={containerRef} {...styleMaybe}>
      <PriorityLinks links={links} priorityLinks={priorityLinks} setLinks={setLinks} />
      {mounted && hasMenuLinks ? (
        <LinksMenu
          id="linksMenu"
          currentPage={currentPage}
          links={menuLinks}
          showMoreLabel={hasPriorityLinks}
          moreLabelWidth={moreLabelWidth}
          setMoreLabelWidth={setMoreLabelWidth}
          intl={intl}
        />
      ) : null}
    </div>
  );
};

export default CustomLinksMenu;
