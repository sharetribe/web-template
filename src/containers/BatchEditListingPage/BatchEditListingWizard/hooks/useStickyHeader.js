import { useEffect } from 'react';
import throttle from 'lodash/throttle';

const useStickyHeader = (css, scrollThreshold = 50) => {
  const {
    stickyHeader: stickyHeaderClass,
    subTitle: subtitleClass,
    hidden: hiddenClass,
    scrolled: scrolledClass,
  } = css;
  useEffect(() => {
    const stickyHeader = document.querySelector(`.${stickyHeaderClass}`);
    const subtitle = document.querySelector(`.${subtitleClass}`);

    if (!stickyHeader || !subtitle) return; // Guard clause to ensure elements are found

    // Throttled scroll handler to improve performance
    const handleScroll = throttle(() => {
      if (window.scrollY > scrollThreshold) {
        stickyHeader.classList.add(scrolledClass);
        subtitle.classList.add(hiddenClass);
      } else {
        stickyHeader.classList.remove(scrolledClass);
        subtitle.classList.remove(hiddenClass); // Ensure subtitle is shown when scrolling up
      }
    }, 100);

    // Attach event listeners
    window.addEventListener('scroll', handleScroll);

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [css, scrollThreshold]);
};

export default useStickyHeader;
