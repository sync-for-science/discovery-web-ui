import React from 'react';
import PropTypes from 'prop-types';

import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderVitals } from '../../fhirUtil.js';
import { formatContentHeader } from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Vital Signs' category if there are matching resources
//
export default class VitalSigns extends React.Component {

   static contextType = DiscoveryContext;	// Allow the shared context to be accessed via 'this.context'

   static propTypes = {
      data: PropTypes.array.isRequired,
      isEnabled: PropTypes.bool,
      showDate: PropTypes.bool,
      resources: PropTypes.instanceOf(FhirTransform)
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
      return ( this.state.matchingData &&
	       (this.props.isEnabled || this.context.trimLevel==='none') &&	// Don't show this category (at all) if disabled and trim set
	       <div className={this.props.className + ' category-container'}>
		  { formatContentHeader(this.props.isEnabled, 'Vital Signs', this.state.matchingData[0].itemDate, this.context) }
		  { this.props.isEnabled && renderVitals(this.state.matchingData, this.props.resources, this.context) }
	       </div> );
   }
}
