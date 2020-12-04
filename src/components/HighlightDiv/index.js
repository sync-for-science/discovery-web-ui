import React from 'react';
import PropTypes from 'prop-types';

import './HighlightDiv.css';

import DiscoveryContext from '../DiscoveryContext';

//
// Highlight Div
//
// Alters style of resources if present in context.lastHighlightedResources (and context.highlightedResources if 'showAllHighlights')
//
export default class HighlightDiv extends React.Component {

   static contextType = DiscoveryContext; // Allow the shared context to be accessed via 'this.context'

   static propTypes = {
      matchingResources: PropTypes.array,
      showAllHighlights: PropTypes.bool
   }

   intersects(arr1, arr2) {
      try {
 if (arr1.length > arr2.length) {
    return arr1.some(elt => arr2.includes(elt));
 } else {
    return arr2.some(elt => arr1.includes(elt));
 }
      } catch (e) {
 return false;
      }
   }

   render() {
      let lastIntersects = this.intersects(this.context.lastHighlightedResources, this.props.matchingResources);
      let intersects = this.intersects(this.context.highlightedResources, this.props.matchingResources);
      let intersectClass = lastIntersects ? ' highlight-resource-last' : (this.props.showAllHighlights && intersects ? ' highlight-resource' : '');
      return (
 <div className={this.props.className + intersectClass}>
    {this.props.children}
 </div>
      );
   }
}
