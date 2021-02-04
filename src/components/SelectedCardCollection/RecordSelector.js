import React from 'react';
import { array, string } from 'prop-types';

const showCount = (count) => {
  if (count > 1) {
    return ` [${count}]`;
  }
  return null;
};

const RecordSelector = ({ label, uuids }) => (
  <button
    className="tile-standard"
  >
    {label}
    {showCount(uuids.length)}
  </button>
);

RecordSelector.propTypes = {
  // displayCoding: shape({
  //   code: string.isRequired,
  //   display: string.isRequired,
  // }).isRequired,
  label: string.isRequired,
  uuids: array.isRequired,
};

export default RecordSelector;
