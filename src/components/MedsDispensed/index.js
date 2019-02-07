import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './MedsDispensed.css';
import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderMeds } from '../../fhirUtil.js';
import { stringCompare, formatDate, isValid } from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Meds Dispensed' category if there are matching resources
//
export default class MedsDispensed extends Component {

   static contextType = DiscoveryContext;	// Allow the shared context to be accessed via 'this.context'

   static propTypes = {
      data: PropTypes.array.isRequired,
      isEnabled: PropTypes.bool,
      showDate: PropTypes.bool
   }

   state = {
      matchingData: null
   }

   setMatchingData() {
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Meds Dispensed]');
      this.setState({ matchingData: match.length > 0 ? match.sort((a, b) => stringCompare(a.data.medicationCodeableConcept.coding[0].display,
											  b.data.medicationCodeableConcept.coding[0].display))
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
      let itemDate =  this.props.showDate && isValid(this.state, st => st.matchingData[0]) && formatDate(this.state.matchingData[0].itemDate, true, true);
      return ( this.state.matchingData &&
	       <div className={this.props.className}>
	          <div className='content-header-container'>
		     { itemDate &&
		       <div className={this.props.isEnabled ? 'content-header-date' : 'content-header-date-disabled'}>{itemDate}</div> }
		     <div className={this.props.isEnabled ? 'content-header' : 'content-header-disabled'}>Meds Dispensed</div>
	          </div>
	          <div className='content-body'>
		     { this.props.isEnabled && renderMeds(this.state.matchingData, this.props.className, this.context) }
	          </div>
	       </div> );
   }
}
