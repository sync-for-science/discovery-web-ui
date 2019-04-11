import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

import '../ContentPanel/ContentPanel.css';
import config from '../../config.js';

import FhirTransform from '../../FhirTransform.js';
import { renderMeds } from '../../fhirUtil.js';
import { stringCompare, shallowEqArray, formatContentHeader } from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Meds Requested' category if there are matching resources
//
export default class MedsRequested extends React.Component {

   static catName = 'Meds Requested';
    
   static contextType = DiscoveryContext;	// Allow the shared context to be accessed via 'this.context'

   static propTypes = {
      data: PropTypes.array.isRequired,
      isEnabled: PropTypes.bool,
      showDate: PropTypes.bool
   }

   state = {
      matchingData: null,
      loadingRefs: 0
   }

   AxiosCancelSource = axios.CancelToken.source();

   sortMeds(a, b) {
      return stringCompare(a.data.medicationCodeableConcept ? a.data.medicationCodeableConcept.coding[0].display : '',
			   b.data.medicationCodeableConcept ? b.data.medicationCodeableConcept.coding[0].display : '');
   }

   setMatchingData() {
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Meds Requested]');
      let withCode = [];

      if (match.length > 0) {
  	 for (let elt of match) {
   	    if (elt.data.medicationCodeableConcept) {
   	       withCode.push(elt);
   	    } else {
   	       this.resolveMedicationReference(elt)
   	    }
   	    this.resolveReasonReference(elt);
   	 }
      }

      this.setState({ matchingData: withCode.length > 0 ? withCode.sort(this.sortMeds) : null });
   }	

   componentDidMount() {
      this.setMatchingData();
   }

   componentDidUpdate(prevProps, prevState) {
      if (!shallowEqArray(prevProps.data, this.props.data)) {
	 this.setMatchingData();
      }
   }

   componentWillUnmount() {
      // Cancel any pending async gets
      this.AxiosCancelSource.cancel('unmounting');
   }

   resolveMedicationReference(elt) {
      if (elt.data.medicationReference && !elt.data.medicationReference.code) {
	 this.setState({loadingRefs: this.state.loadingRefs+1});
	 axios.get(config.serverUrl + '/reference/' + encodeURIComponent(elt.provider) + '/' + encodeURIComponent(elt.data.medicationReference.reference),
		   { cancelToken: this.AxiosCancelSource.token } )
	    .then(response => {
		// Add the de-referenced data to the medicationReference element AND create the medicationCodeableConcept element
		elt.data.medicationReference = Object.assign(elt.data.medicationReference, response.data);
		elt.data.medicationCodeableConcept = response.data.code;
		this.setState({ loadingRefs: this.state.loadingRefs-1,
			        matchingData: this.state.matchingData ? this.state.matchingData.concat([elt]).sort(this.sortMeds)
								      : [ elt ] });
	    })
	    .catch(thrown => {
		if (!axios.isCancel(thrown)) {
		   console.log(thrown);
		   this.setState({loadingRefs: this.state.loadingRefs-1});
		}
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
	 axios.get(config.serverUrl + '/reference/' + encodeURIComponent(elt.provider) + '/' + encodeURIComponent(elt.data.reasonReference[0].reference),
		   { cancelToken: this.AxiosCancelSource.token } )
	    .then(response => {
		// Add the de-referenced data to the reasonReference element
		elt.data.reasonReference[0] = Object.assign(elt.data.reasonReference[0], response.data);
		this.setState({loadingRefs: this.state.loadingRefs-1});
	    })
	    .catch(thrown => {
		if (!axios.isCancel(thrown)) {
		   console.log(thrown);
		   this.setState({loadingRefs: this.state.loadingRefs-1});
		}
	    });
      }
   }

   render() {
      return ( this.state.matchingData &&
	       (this.props.isEnabled || this.context.trimLevel==='none') &&	// Don't show this category (at all) if disabled and trim set
	       <div className='meds-requested category-container'>
		  { formatContentHeader(this.props.isEnabled, 'Meds Requested', this.state.matchingData[0].itemDate, this.context) }
	          <div className='content-body'>
		     { this.props.isEnabled && renderMeds(this.state.matchingData, this.context) }
	             { this.props.isEnabled && this.state.loadingRefs > 0 && <div className='category-loading'>Loading ...</div> }
	          </div>
	       </div> );
   }
}
