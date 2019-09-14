import React from 'react';
import PropTypes from 'prop-types';

import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderExams, primaryTextValue } from '../../fhirUtil.js';
import { Const, stringCompare, formatContentHeader } from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Exams' category if there are matching resources
//
export default class Exams extends React.Component {

   static catName = 'Exams';
    
   static contextType = DiscoveryContext;	// Allow the shared context to be accessed via 'this.context'

   static compareFn(a, b) {
      return stringCompare(Exams.primaryText(a), Exams.primaryText(b));
   }

   static code(elt) {
      return elt.data.code;		// LOINC
   }

   static primaryText(elt) {
//      return elt.data.code.coding[0].display;
//      return tryWithDefault(elt, elt => Exams.code(elt).coding[0].display, Const.unknownValue);
      return primaryTextValue(Exams.code(elt));
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
      let match = FhirTransform.getPathItem(this.props.data, `[*category=${Exams.catName}]`);
      this.setState({ matchingData: match.length > 0 ? match.sort(Exams.compareFn)
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
      return ( this.state.matchingData &&
	       (this.props.isEnabled || this.context.trimLevel===Const.trimNone) &&	// Don't show this category (at all) if disabled and trim set
	       <div className='exams category-container'>
		  { formatContentHeader(this.props.isEnabled, Exams.catName, this.state.matchingData[0], this.context) }
		  <div className='content-body'>
		     { this.props.isEnabled && renderExams(this.state.matchingData, this.context) }
		  </div>
	       </div> );
   }
}
