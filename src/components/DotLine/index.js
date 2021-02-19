import React from 'react';
import PropTypes from 'prop-types';

import './DotLine.css';
import config from '../../config.js';

import { numericPart, unitPart } from '../../util.js';

const getDotClass = (recentlyAdded, inCollection, inRange) => {
  const classes = {
    'timeline-dot': true,
    'in-range': inRange,
    'in-collection': inCollection,
    'recently-added': recentlyAdded,
  };
  // TODO: library function, like cx(), that does not rely on hooks API?
  return Object.entries(classes).reduce((acc, [k, v]) => (v ? [...acc, k] : acc), []).join(' ');
};

const DotLine = ({
  height, context, dotClickFn, dotPositions,
}) => {
  const halfHeight = numericPart(height) / 2 + unitPart(height);

  return dotPositions.reduce((result, dot) => {
    const { recentlyAdded, inCollection, inRange } = dot;
    const className = getDotClass(recentlyAdded, inCollection, inRange);

    result.push(<circle
      className={className}
      key={dot.date}
      cx={`${dot.position * 100}%`}
      cy={halfHeight}
      r={config.normalDotRadius}
      style={dotClickFn ? { cursor: 'pointer' } : undefined}
      onClick={dotClickFn ? (_event) => dotClickFn(context, dot.date, dot.dotType) : undefined}
    />);

    return result;
  }, []);
};

DotLine.propTypes = {
  width: PropTypes.string, // Added via React.cloneElement() in <SVGContainer/>
  height: PropTypes.string, // Added via React.cloneElement() in <SVGContainer/>
  dotPositions: PropTypes.arrayOf(PropTypes.shape({ // Dots to be rendered
    position: PropTypes.number.isRequired, //   Horizontal position (range: 0.0 - 1.0)
    date: PropTypes.string.isRequired, //   Associated date
    inRange: PropTypes.bool.isRequired,
    inCollection: PropTypes.bool.isRequired,
    recentlyAdded: PropTypes.bool.isRequired,
  })).isRequired,
  context: PropTypes.shape({
    parent: PropTypes.string.isRequired, // Parent component name
    rowName: PropTypes.string.isRequired, // Specific category/provider name
  }),
  dotClickFn: PropTypes.func, // Callback when a dot is clicked
};

export default React.memo(DotLine);
