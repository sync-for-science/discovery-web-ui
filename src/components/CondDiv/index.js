import React from 'react';
import PropTypes from 'prop-types';

//
// Conditional Div
//
// Returns children unless:
//    1. 'check' is defined AND all of its elements are 'undefined'
//    2. this.context.trimLevel === 'max'
//    3. this.context.trimLevel === 'expected' AND 'check' is defined AND 'expected' is defined AND
//       at least one of the elements of expected === an element of 'check'
//
export default class CondDiv extends React.Component {
  static propTypes = {
    check: PropTypes.oneOfType([
      PropTypes.any,
      PropTypes.arrayOf(PropTypes.any),
    ]),
    expected: PropTypes.oneOfType([
      PropTypes.any,
      PropTypes.arrayOf(PropTypes.any),
    ]),
  }

  //
  // Determine whether a display element/value should be 'trimmed' (not displayed) based on trimLevel
  //
  trim() {
    return false;
  }

  render() {
    // TODO: remove this obsolete component.
    // CondDiv is still imported and used by src/fhirUtil.js:
    console.error('CondDiv: this component is obsolete.'); // eslint-disable-line no-console

    const allUndefined = this.props.hasOwnProperty('check')
    && Array.isArray(this.props.check) ? this.props.check.every((elt) => elt === undefined) : this.props.check === undefined;
    return allUndefined || this.trim(this.props.check, this.props.expected) ? null : this.props.children;
  }
}
