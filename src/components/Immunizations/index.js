import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './Immunizations.css';
import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderImmunizations } from '../../fhirUtil.js';
import { stringCompare } from '../../util.js';

//
// Display the 'Immunizations' category if there are matching resources
//
export default class Immunizations extends Component {

   static propTypes = {
      data: PropTypes.array.isRequired,
      isEnabled: PropTypes.bool
   }

   state = {
      matchingData: null
   }

   setMatchingData() {
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Immunizations]');
      if (match.length > 0) {
	 this.setState({ matchingData: match.sort((a, b) => stringCompare(a.data.vaccineCode.coding[0].display, b.data.vaccineCode.coding[0].display)) });
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
		  <div className={isEnabled ? 'content-header' : 'content-header-disabled'}>Immunizations</div>
	          <div className='content-body'>
		     { isEnabled && renderImmunizations(this.state.matchingData, this.props.className) }
	          </div>
	       </div> );
   }
}
