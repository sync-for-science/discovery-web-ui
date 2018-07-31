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
      id: PropTypes.string,
      data: PropTypes.oneOfType([
	 PropTypes.object,
	 PropTypes.array,
	 PropTypes.string,
	 PropTypes.number
      ]).isRequired
   }

   state = {
      matchingData: null
   }

   componentDidMount() {
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Meds Dispensed]');
      if (match.length > 0) {
	 this.setState({ matchingData: match.sort((a, b) => stringCompare(a.data.medicationCodeableConcept.coding[0].display,
									  b.data.medicationCodeableConcept.coding[0].display)) });
      }
   }

   render() {
      let data = this.state.matchingData;
      if (this.state.matchingData) {
	 return (
	    <div id={this.props.id} className={this.props.className}>
	       <div className={this.props.className+'-header'}>Meds Dispensed</div>
	       <div className={this.props.className+'-body'}>
		  { renderMeds(data, this.props.className) }
	       </div>
	    </div>
	 );
      } else {
	 return null;
      }
   }
}
