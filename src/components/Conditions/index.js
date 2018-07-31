import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './Conditions.css';

import FhirTransform from '../../FhirTransform.js';
import { renderDisplay } from '../../fhirUtil.js';
import { stringCompare } from '../../util.js';

//
// Display the 'Conditions' category if there are matching resources
//
export default class Conditions extends Component {

   static propTypes = {
      id: PropTypes.string,
      data: PropTypes.oneOfType([
	 PropTypes.object,
	 PropTypes.array,
	 PropTypes.string,
	 PropTypes.number
      ]).isRequired
   }

   state = {
      matchingData: null
   }

   componentDidMount() {
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Conditions]');
      if (match.length > 0) {
	 this.setState({ matchingData: match.sort((a, b) => stringCompare(a.data.code.coding[0].display, b.data.code.coding[0].display)) });
      }
   }

   render() {
      let data = this.state.matchingData;
      if (this.state.matchingData) {
	 return (
	    <div id={this.props.id} className={this.props.className}>
	       <div className={this.props.className+'-header'}>Conditions</div>
	       <div className={this.props.className+'-body'}>
		  { renderDisplay(data, this.props.className) }
	       </div>
	    </div>
	 );
      } else {
	 return null;
      }
   }
}
