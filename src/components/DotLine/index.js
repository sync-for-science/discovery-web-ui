import React, { useMemo } from 'react';
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

const Dot = ({
  dot, dotClickFn, height,
}) => {
  const { recentlyAdded, inCollection, inRange } = dot;
  const className = useMemo(() => getDotClass(recentlyAdded, inCollection, inRange), [recentlyAdded, inCollection, inRange]);

  return (
    <circle
      className={className}
      cx={`${dot.position * 100}%`}
      cy={height}
      r={config.normalDotRadius}
      style={dotClickFn ? { cursor: 'pointer' } : undefined}
      onClick={dotClickFn ? (_event) => dotClickFn(dot.date, dot.dotType) : undefined}
    />
  );
};

const DotLine = ({
  height, dotClickFn, dotPositions,
}) => {
  const halfHeight = numericPart(height) / 2 + unitPart(height);

  return dotPositions.map((dot) => (
    <Dot
      key={dot.date}
      dot={dot}
      dotClickFn={dotClickFn}
      height={halfHeight}
    />
  ));
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
  dotClickFn: PropTypes.func, // Callback when a dot is clicked
};

export default React.memo(DotLine);
