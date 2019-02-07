import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './Benefits.css';

import FhirTransform from '../../FhirTransform.js';
import { renderEOB } from '../../fhirUtil.js';
import { formatDate, isValid } from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Benefits' category if there are matching resources
//
export default class Benefits extends Component {

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
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Benefits]');
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
      let itemDate =  this.props.showDate && isValid(this.state, st => st.matchingData[0]) && formatDate(this.state.matchingData[0].itemDate, true, true);
      return ( this.state.matchingData &&
	       <div className={this.props.className}>
	          <div className='content-header-container'>
		     { itemDate &&
		       <div className={this.props.isEnabled ? 'content-header-date' : 'content-header-date-disabled'}>{itemDate}</div> }
		     <div className={this.props.isEnabled ? 'content-header' : 'content-header-disabled'}>Benefits</div>
	          </div>
	          <div className='content-body'>
		     { this.props.isEnabled && renderEOB(this.state.matchingData, this.props.className, this.context) }
	          </div>
	       </div> );
   }
}
