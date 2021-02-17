import React from 'react';
import PropTypes from 'prop-types';

import './DotLine.css';
import config from '../../config.js';

import { numericPart, unitPart } from '../../util.js';

export default class DotLine extends React.Component {
  static propTypes = {
    width: PropTypes.string, // Added via React.cloneElement() in <SVGContainer/>
    height: PropTypes.string, // Added via React.cloneElement() in <SVGContainer/>
    dotPositions: PropTypes.arrayOf(PropTypes.shape({ // Dots to be rendered
      position: PropTypes.number.isRequired, //   Horizontal position (range: 0.0 - 1.0)
      date: PropTypes.string.isRequired, //   Associated date
      inRange: PropTypes.bool.isRequired,
      inCollection: PropTypes.bool.isRequired,
      recentlyAdded: PropTypes.bool.isRequired,
      dotType: PropTypes.string.isRequired, //   active/inactive/active-highlight/inactive-highlight/view-accent/view-last-accent/
      //      view-accent-highlight/active-search/inactive-search/active-highlight-search/
      //      inactive-highlight-search
    })).isRequired,
    context: PropTypes.shape({
      parent: PropTypes.string.isRequired, // Parent component name
      rowName: PropTypes.string.isRequired, // Specific category/provider name
    }),
    dotClickFn: PropTypes.func, // Callback when a dot is clicked
  }

  getDotClass = (dot) => {
    const { recentlyAdded, inCollection, inRange } = dot;
    const classes = {
      'timeline-dot': true,
      'in-range': inRange,
      'in-collection': inCollection,
      'recently-added': recentlyAdded,
    };
    // TODO: library function, like cx(), that does not rely on hooks API?
    return Object.entries(classes).reduce((acc, [k, v]) => (v ? [...acc, k] : acc), []).join(' ');
  };

  renderDot = (result, dot, index) => {
    // TODO: make consistent (need units?)
    const halfHeight = numericPart(this.props.height) / 2 + unitPart(this.props.height);
    const clickHandlerProps = {
      style: this.props.dotClickFn ? undefined : { cursor: 'default' },
      onClick: this.props.dotClickFn ? (_event) => this.props.dotClickFn(this.props.context, dot.date, dot.dotType) : undefined,
    };
    // const isContent = ['Category', 'Provider'].includes(this.props.context.parent);
    result.push(<circle
      className={this.getDotClass(dot)}
      key={index}
      cx={`${dot.position * 100}%`}
      cy={halfHeight}
      r={config.normalDotRadius}
      {...clickHandlerProps} // eslint-disable-line react/jsx-props-no-spreading
    />);

    return result;
  }

  render() {
    return this.props.dotPositions.length > 0 ? this.props.dotPositions.reduce(this.renderDot, []) : null;
  }
}
