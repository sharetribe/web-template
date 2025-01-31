import React, { useRef, useState, useEffect } from 'react';
import { Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { NamedLink } from '../index';
import css from './ScrollableLinks.module.css';

export const ScrollableLinks = props => {
  const { links, selectedLinkId } = props;
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      // Check if scrolling is possible to the left or right
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    updateScrollState(); // Check on mount
    const container = scrollContainerRef.current;
    if (container) {
      // Update scroll state on scroll and resize
      container.addEventListener('scroll', updateScrollState);
      window.addEventListener('resize', updateScrollState);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', updateScrollState);
      }
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  return (
    <div className={css.root}>
      <Button
        type="text"
        icon={<LeftOutlined />}
        onClick={scrollLeft}
        className={css.scrollButtonLeft}
        disabled={!canScrollLeft} // Disable button if not scrollable to the left
      />

      <div ref={scrollContainerRef} className={css.linksContainer}>
        {links.map((link, index) => {
          return (
            <NamedLink
              key={link.id}
              name={link.name}
              active={selectedLinkId === link.id}
              activeClassName={css.activeLink}
              to={link.to}
              params={link.params}
              className={css.defaultLink}
            >
              {link.displayText}
            </NamedLink>
          );
        })}
      </div>

      <Button
        type="text"
        icon={<RightOutlined />}
        onClick={scrollRight}
        className={css.scrollButtonRight}
        disabled={!canScrollRight} // Disable button if not scrollable to the right
      />
    </div>
  );
};

export default ScrollableLinks;
