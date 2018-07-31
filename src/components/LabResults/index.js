import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './LabResults.css';

import FhirTransform from '../../FhirTransform.js';
import { formatDPs } from '../../fhirUtil.js';
import { stringCompare } from '../../util.js';

//
// Display the 'Lab Results' category if there are matching resources
//
export default class LabResults extends Component {

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
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Lab Results]');
      if (match.length > 0) {
	  this.setState({ matchingData: match.sort((a, b) => stringCompare(a.data.code.coding[0].display, b.data.code.coding[0].display)) });
      }
   }

   renderSingleValueElt(elt, index) {
      return (
	 <div className='lab-results-container' key={index}>
	    <div className='lab-results-name'>{elt.data.code.coding[0].display}</div>
	    <div className='lab-results-value'>{formatDPs(elt.data.valueQuantity.value,1)}</div>
	    <div className='lab-results-unit'>{elt.data.valueQuantity.unit}</div>
	 </div>
      );
   }

   render() {
      let data = this.state.matchingData;
      if (this.state.matchingData) {
	 return (
	    <div id={this.props.id} className={this.props.className}>
	       <div className={this.props.className+'-header'}>Lab Results</div>
	       <div className={this.props.className+'-body'}>
 		  { data.map( (elt, index) => this.renderSingleValueElt(elt, index) ) }
	       </div>
	    </div>
	 );
      } else {
	 return null;
      }
   }
}
