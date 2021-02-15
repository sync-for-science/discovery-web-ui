import React from 'react';
import PropTypes from 'prop-types';

import './HighlightDiv.css';

export default class HighlightDiv extends React.Component {
  static propTypes = {
    matchingResources: PropTypes.array,
    showAllHighlights: PropTypes.bool,
  }

  intersects(arr1, arr2) {
    try {
      if (arr1.length > arr2.length) {
        return arr1.some((elt) => arr2.includes(elt));
      }
      return arr2.some((elt) => arr1.includes(elt));
    } catch (e) {
      return false;
    }
  }

  render() {
    // TODO: remove this obsolete component.
    // HighlightDiv is still imported and used by src/fhirUtil.js:
    console.error('HighlightDiv: this component is obsolete.'); // eslint-disable-line no-console

    return (
      <div className={this.props.className}>
        {this.props.children}
      </div>
    );
  }
}
