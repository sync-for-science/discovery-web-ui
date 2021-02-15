import React from 'react';

const ColumnBrowser = ({ children, columns }) => {
  // console.log('columns.length: ', columns.length);
  return (
    <div className="tiles-view-container-inner">
      { columns }
      { children }
    </div>
  );
};

export default ColumnBrowser;
