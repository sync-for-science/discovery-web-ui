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
      data: PropTypes.array.isRequired
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
      return ( this.state.matchingData &&
	       <div className={this.props.className}>
	          <div className={this.props.className+'-header'}>Immunizations</div>
	          <div className={this.props.className+'-body'}>
		     { renderVaccines(this.state.matchingData, this.props.className) }
	          </div>
	       </div> );
   }
}
