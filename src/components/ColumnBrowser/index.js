import React, { useRef, useState, useEffect } from 'react';

const ColumnBrowser = ({ children, columns }) => {
  const innerView = useRef();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollright, setCanScrollright] = useState(false);
  const distance = 50;

  const onNavClick = (dir) => {
    if (dir === 'left') {
      innerView.scrollBy({ left: distance, behavior: 'smooth' });
    } else {
      innerView.scrollBy({ right: distance, behavior: 'smooth' });
    }
  };

  const checkForScrollPosition = () => {
    console.log('Checking scroll...');
    setCanScrollLeft(innerView.current.scrollLeft > 0);
    setCanScrollright(innerView.current.scrollLeft !== innerView.current.scrollWidth - innerView.current.clientWidth);
  };

  useEffect(() => {
    if (innerView.current) {
      innerView.current.addEventListener('scroll', checkForScrollPosition);
    }

    // clean up on unmount
    return () => innerView.current.removeEventListener('scroll', checkForScrollPosition);
  }, []);

  return (
    <>
      <div className="tiles-view-nav-left">
        <button
          className={true ? 'tiles-view-nav-left-button-on' : 'tiles-view-nav-left-button-off'}
          onClick={() => onNavClick('left')}
          disabled={!canScrollLeft}
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
          className={true ? 'tiles-view-nav-right-button-on' : 'tiles-view-nav-right-button-off'}
          onClick={() => onNavClick('left')}
          disabled={!canScrollright}
        />
      </div>
    </>
  );
};
export default ColumnBrowser;
