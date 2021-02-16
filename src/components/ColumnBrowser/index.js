import React, { useRef } from 'react';

const ColumnBrowser = ({ children, columns }) => {
  const innerView = useRef();

  const onNavClick = (dir) => {
    if (dir === 'left') {
      // innerView.current.scroll
    } else {
    }
  };

  return (
    <>
      <div className="tiles-view-nav-left">
        <button
          className={true ? 'tiles-view-nav-left-button-on' : 'tiles-view-nav-left-button-off'}
          onClick={() => onNavClick('left')}
        />
      </div>

      <div className="tiles-view-container-inner" ref={innerView}>
        { columns }
        { children }
      </div>

      <div className="tiles-view-nav-right">
        <button
          className={true ? 'tiles-view-nav-right-button-on' : 'tiles-view-nav-right-button-off'}
          onClick={() => onNavClick('left')}
        />
      </div>
    </>
  );
};
export default ColumnBrowser;
