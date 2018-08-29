import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './MedsDispensed.css';

import FhirTransform from '../../FhirTransform.js';
import { renderMeds } from '../../fhirUtil.js';
import { stringCompare } from '../../util.js';

//
// Display the 'Meds Dispensed' category if there are matching resources
//
export default class MedsDispensed extends Component {

   static propTypes = {
      data: PropTypes.array.isRequired
   }

   state = {
      matchingData: null
   }

   setMatchingData() {
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Meds Dispensed]');
      if (match.length > 0) {
	 this.setState({ matchingData: match.sort((a, b) => stringCompare(a.data.medicationCodeableConcept.coding[0].display,
									  b.data.medicationCodeableConcept.coding[0].display)) });
      } else {
	 this.setState({ matchingData: null });
      }
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
	       <div className={this.props.className}>
	          <div className={this.props.className+'-header'}>Meds Dispensed</div>
	          <div className={this.props.className+'-body'}>
		     { renderMeds(this.state.matchingData, this.props.className) }
	          </div>
	       </div> );
   }
}
