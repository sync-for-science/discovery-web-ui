import React from 'react';

const noneEnabled = (obj) => Object.values(obj).reduce((acc, isEnabled) => (isEnabled ? false : acc), true);

const NoResultsDisplay = React.memo(({ filteredRecordCount, activeCategories, activeProviders }) => {
  if (filteredRecordCount) {
    return null;
  }

  let message = 'No data found for the selected Records, Providers, and Time period';
  if (noneEnabled(activeCategories)) {
    message = 'No Record type is selected';
  } else if (noneEnabled(activeProviders)) {
    message = 'No Provider is selected';
  }

  return (
    <div className="tiles-view-container-inner-empty" key="1">
      { message }
    </div>
  );
});

export default NoResultsDisplay;
