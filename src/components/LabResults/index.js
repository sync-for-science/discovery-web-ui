import React from 'react';
import PropTypes from 'prop-types';

import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderLabs } from '../../fhirUtil.js';
import { stringCompare, formatContentHeader } from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Lab Results' category if there are matching resources
//
export default class LabResults extends React.Component {

   static catName = 'Lab Results';
    
   static contextType = DiscoveryContext;	// Allow the shared context to be accessed via 'this.context'

   static propTypes = {
      data: PropTypes.array.isRequired,
      isEnabled: PropTypes.bool,
      showDate: PropTypes.bool,
      resources: PropTypes.instanceOf(FhirTransform),
      dotClickFn: PropTypes.func
   }

   state = {
      matchingData: null
   }

   setMatchingData() {
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Lab Results]');
      this.setState({ matchingData: match.length > 0 ? match.sort((a, b) => stringCompare(a.data.code.coding[0].display, b.data.code.coding[0].display))
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
	       <div className='lab-results category-container'>
		  { formatContentHeader(this.props.isEnabled, 'Lab Results', this.state.matchingData[0].itemDate, this.context) }
	          <div className='content-body'>
		     { this.props.isEnabled && renderLabs(this.state.matchingData, this.props.resources, this.props.dotClickFn, this.context) }
	          </div>
	       </div> );
   }
}
