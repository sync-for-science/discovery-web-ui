import React from 'react';
import PropTypes from 'prop-types';

import './DocumentReferences.css';
import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderDisplay } from '../../fhirUtil.js';
import { stringCompare, formatContentHeader } from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Document References' category if there are matching resources
//
export default class DocumentReferences extends React.Component {

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
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Document References]');
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
	       <div className={this.props.className}>
		  { formatContentHeader(this.props.isEnabled, 'Document References', this.state.matchingData[0].itemDate, this.context) }
	          <div className='content-body'>
		     { this.props.isEnabled && renderDisplay(this.state.matchingData, this.props.className, this.context) }
	          </div>
	       </div> );
   }
}
