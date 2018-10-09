import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './MedsAdministration.css';
import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderDisplay } from '../../fhirUtil.js';
import { stringCompare } from '../../util.js';

//
// Display the 'Meds Administration' category if there are matching resources
//
export default class MedsAdministration extends Component {

   static propTypes = {
      data: PropTypes.array.isRequired,
      isEnabled: PropTypes.bool
   }

   state = {
      matchingData: null
   }

   setMatchingData() {
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Meds Administration]');
      if (match.length > 0) {
	 this.setState({ matchingData: match.sort((a, b) => stringCompare(a.data.code.coding[0].display, b.data.code.coding[0].display)) });
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

   render() {
      let isEnabled = this.props.isEnabled === undefined || this.props.isEnabled;
      return ( this.state.matchingData &&
	       <div className={this.props.className}>
		  <div className={isEnabled ? 'content-header' : 'content-header-disabled'}>Meds Administration</div>
	          <div className='content-body'>
		     { isEnabled && renderDisplay(this.state.matchingData, this.props.className) }
	          </div>
	       </div> );
   }
}
