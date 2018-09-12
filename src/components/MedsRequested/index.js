import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { get } from 'axios';

import './MedsRequested.css';
import '../ContentPanel/ContentPanel.css';
import config from '../../config.js';

import FhirTransform from '../../FhirTransform.js';
import { renderMeds } from '../../fhirUtil.js';
import { stringCompare } from '../../util.js';

//
// Display the 'Meds Requested' category if there are matching resources
//
export default class MedsRequested extends Component {

   static propTypes = {
      data: PropTypes.array.isRequired
   }

   state = {
      matchingData: null,
      loadingRefs: 0
   }

   sortMeds(a, b) {
      return stringCompare(a.data.medicationCodeableConcept ? a.data.medicationCodeableConcept.coding[0].display : '',
			   b.data.medicationCodeableConcept ? b.data.medicationCodeableConcept.coding[0].display : '');
   }

   setMatchingData() {
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Meds Requested]');
      if (match.length > 0) {
   	 let withCode = [];
   	 for (var elt of match) {
   	    if (elt.data.medicationCodeableConcept) {
   	       withCode.push(elt);
   	    } else {
   	       this.resolveMedicationReference(elt)
   	    }
   	    this.resolveReasonReference(elt);
   	 }
   	 this.setState({ matchingData: withCode.sort(this.sortMeds) });
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

   resolveMedicationReference(elt) {
      if (elt.data.medicationReference && !elt.data.medicationReference.code) {
	 this.setState({loadingRefs: this.state.loadingRefs+1});
	 get(config.serverUrl + '/reference/' + encodeURIComponent(elt.provider) + '/' + encodeURIComponent(elt.data.medicationReference.reference))
	    .then(response => {
		// Add the de-referenced data to the medicationReference element AND create the medicationCodeableConcept element
		elt.data.medicationReference = Object.assign(elt.data.medicationReference, response.data);
		elt.data.medicationCodeableConcept = response.data.code;
		this.setState({loadingRefs: this.state.loadingRefs-1,
			       matchingData: this.state.matchingData.concat([elt]).sort(this.sortMeds)});
	    })
	    .catch(fetchError => {
		console.log(fetchError);
		this.setState({loadingRefs: this.state.loadingRefs-1});
	    });
      } else {
	 console.log('Missing medicationReference!');
      }
   }

   // TODO: Handle multiple reason references per single medication request
   //       Move to fhirUtil.js (with callback for state management)
   resolveReasonReference(elt) {
      if (elt.data.reasonReference && elt.data.reasonReference[0] && !elt.data.reasonReference[0].code) {
	 this.setState({loadingRefs: this.state.loadingRefs+1});
	 get(config.serverUrl + '/reference/' + encodeURIComponent(elt.provider) + '/' + encodeURIComponent(elt.data.reasonReference[0].reference))
	    .then(response => {
		// Add the de-referenced data to the reasonReference element
		elt.data.reasonReference[0] = Object.assign(elt.data.reasonReference[0], response.data);
		this.setState({loadingRefs: this.state.loadingRefs-1});
	    })
	    .catch(fetchError => {
		console.log(fetchError);
		this.setState({loadingRefs: this.state.loadingRefs-1});
	    });
      }
   }

   render() {
      let isEnabled = this.props.enabledFn('Category', 'Meds Requested');
      return ( this.state.matchingData &&
	       <div className={this.props.className}>
		  <div className={isEnabled ? 'content-header' : 'content-header-disabled'}>Meds Requested</div>
	          <div className='content-body'>
		     { isEnabled && renderMeds(this.state.matchingData, this.props.className) }
	             { isEnabled && this.state.loadingRefs > 0 && <div className={this.props.className+'-loading'}>Loading ...</div> }
	          </div>
	       </div> );
   }
}
