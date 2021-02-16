import React, { useRef, useState, useEffect } from 'react';

const ColumnBrowser = ({ children, columns }) => {
  const innerView = useRef();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setcanScrollRight] = useState(false);
  const distance = 50;

  const onNavClick = (dir) => {
    if (dir === 'left') {
      innerView.current.scrollBy({ left: -50, behavior: 'smooth' });
    } else {
      innerView.current.scrollBy({ left: 50, behavior: 'smooth' });
    }
  };

  const checkForScrollPosition = () => {
    setCanScrollLeft(innerView.current.scrollLeft > 0);
    setcanScrollRight(innerView.current.scrollLeft !== innerView.current.scrollWidth - innerView.current.clientWidth);
  };

  useEffect(() => {
    if (innerView.current) {
      innerView.current.addEventListener('scroll', checkForScrollPosition);
      checkForScrollPosition();
    }

    // clean up on unmount
    return () => innerView.current.removeEventListener('scroll', checkForScrollPosition);
  }, []);

  return (
    <>
      <div className="tiles-view-nav-left">
        <button
          className={canScrollLeft ? 'tiles-view-nav-left-button-on' : 'tiles-view-nav-left-button-off'}
          onClick={() => onNavClick('left')}
        />
      </div>

      <div
        className="tiles-view-container-inner"
        ref={innerView}
        onScroll={(e) => {
          // Ignore scroll events on nested divs
          // (this check won't be necessary in React 17)
          if (e.target === e.currentTarget) {
            console.log('scrolling');
          }
        }}
      >
        { columns }
        { children }
      </div>

      <div className="tiles-view-nav-right">
        <button
          className={canScrollRight ? 'tiles-view-nav-right-button-on' : 'tiles-view-nav-right-button-off'}
          onClick={() => onNavClick('right')}
        />
      </div>
    </>
  );
};
export default ColumnBrowser;
