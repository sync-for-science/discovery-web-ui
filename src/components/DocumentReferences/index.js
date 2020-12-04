import React from 'react';
import PropTypes from 'prop-types';

import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderDisplay, primaryTextValue } from '../../fhirUtil.js';
import { Const, stringCompare, formatKey, formatContentHeader } from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Document References' category if there are matching resources
//
export default class DocumentReferences extends React.Component {

   static catName = 'Document References';
    
   static contextType = DiscoveryContext; // Allow the shared context to be accessed via 'this.context'

   static compareFn(a, b) {
      return stringCompare(DocumentReferences.primaryText(a), DocumentReferences.primaryText(b));
   }

   static code(elt) {
      return elt.data.code ? elt.data.code : elt.data.type;
   }

   static primaryText(elt) {
      return primaryTextValue(DocumentReferences.code(elt));
   }

   static propTypes = {
      data: PropTypes.array.isRequired,
      isEnabled: PropTypes.bool,
      showDate: PropTypes.bool
   }

   state = {
      matchingData: null
   }

   setMatchingData() {
      let match = FhirTransform.getPathItem(this.props.data, `[*category=${DocumentReferences.catName}]`);
      this.setState({ matchingData: match.length > 0 ? match.sort(DocumentReferences.compareFn)
     : null });
   } 

   componentDidMount() {
      this.setMatchingData();
   }

   componentDidUpdate(prevProps, prevState) {
      if (prevProps.data !== this.props.data) {
 this.setMatchingData();
      }
   }

   render() {
      let firstRes = this.state.matchingData && this.state.matchingData[0];
      return ( this.state.matchingData &&
       (this.props.isEnabled || this.context.trimLevel===Const.trimNone) && // Don't show this category (at all) if disabled and trim set
       <div className='document-references category-container' id={formatKey(firstRes)}>
  { formatContentHeader(this.props.isEnabled, DocumentReferences.catName, firstRes, this.context) }
          <div className='content-body'>
     { this.props.isEnabled && renderDisplay(this.state.matchingData, 'Document', this.context) }
          </div>
       </div> );
   }
}
