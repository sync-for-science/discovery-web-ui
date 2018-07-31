import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './Immunizations.css';

import FhirTransform from '../../FhirTransform.js';
import { renderVaccines } from '../../fhirUtil.js';
import { stringCompare } from '../../util.js';

//
// Display the 'Immunizations' category if there are matching resources
//
export default class Immunizations extends Component {

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
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Immunizations]');
      if (match.length > 0) {
	 this.setState({ matchingData: match.sort((a, b) => stringCompare(a.data.vaccineCode.coding[0].display, b.data.vaccineCode.coding[0].display)) });
      }
   }

   render() {
      let data = this.state.matchingData;
      if (this.state.matchingData) {
	 return (
	    <div id={this.props.id} className={this.props.className}>
	       <div className={this.props.className+'-header'}>Immunizations</div>
	       <div className={this.props.className+'-body'}>
		  { renderVaccines(data, this.props.className) }
	       </div>
	    </div>
	 );
      } else {
	 return null;
      }
   }
}
