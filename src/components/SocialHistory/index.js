import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './SocialHistory.css';

import FhirTransform from '../../FhirTransform.js';
import { renderSocialHistory } from '../../fhirUtil.js';
import { stringCompare } from '../../util.js';

//
// Display the 'Social History' category if there are matching resources
//
export default class SocialHistory extends Component {

   static propTypes = {
      data: PropTypes.array.isRequired
   }

   state = {
      matchingData: null
   }

   setMatchingData() {
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Social History]');
      if (match.length > 0) {
	 this.setState({ matchingData: match.sort((a, b) => stringCompare(a.data.code.coding[0].display, b.data.code.coding[0].display)) });
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

   render() {
      return ( this.state.matchingData &&
	       <div className={this.props.className}>
	          <div className={this.props.className+'-header'}>Social History</div>
	          <div className={this.props.className+'-body'}>
		     { renderSocialHistory(this.state.matchingData, this.props.className) }
	          </div>
	       </div> );
   }
}
