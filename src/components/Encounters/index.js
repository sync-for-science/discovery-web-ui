import React from 'react';
import PropTypes from 'prop-types';

import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderEncounters } from '../../fhirUtil.js';
import { stringCompare, formatContentHeader } from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Encounters' category if there are matching resources
//
export default class Encounters extends React.Component {

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
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Encounters]');
      this.setState({ matchingData: match.length > 0 ? match.sort((a, b) => stringCompare(a.data.type[0].coding[0].display, b.data.type[0].coding[0].display))
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
	       (this.props.isEnabled || this.context.trimLevel==='none') &&	// Don't show this category (at all) if disabled and trim set
	       <div className={this.props.className + ' category-container'}>
		  { formatContentHeader(this.props.isEnabled, 'Encounter', this.state.matchingData[0].itemDate, this.context) }
		  { this.props.isEnabled && renderEncounters(this.state.matchingData, this.context) }
	       </div> );
   }
}
