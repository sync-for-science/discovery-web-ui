import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './VitalSigns.css';
import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderVitals } from '../../fhirUtil.js';

//
// Display the 'Vital Signs' category if there are matching resources
//
export default class VitalSigns extends Component {

   static propTypes = {
      data: PropTypes.array.isRequired,
      isEnabled: PropTypes.bool
   }

   state = {
      matchingData: null
   }

   setMatchingData() {
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Vital Signs]');
      this.setState({ matchingData: match.length > 0 ? match : null });
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
      let isEnabled = this.props.isEnabled === undefined || this.props.isEnabled;
      return ( this.state.matchingData &&
	       <div className={this.props.className}>
		  <div className={isEnabled ? 'content-header' : 'content-header-disabled'}>Vital Signs</div>
	          <div className='content-body'>
		     { isEnabled && renderVitals(this.state.matchingData, this.props.className) }
	          </div>
	       </div> );
   }
}
