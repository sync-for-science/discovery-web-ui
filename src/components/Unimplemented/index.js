import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './Unimplemented.css';
import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { stringCompare, formatDate, isValid, ignoreCategories } from '../../util.js';

//
// Display the 'Unimplemented' categories if there are matching resources
//
export default class Unimplemented extends Component {

   static propTypes = {
      data: PropTypes.array.isRequired,
      isEnabled: PropTypes.bool,
      showDate: PropTypes.bool
   }

   state = {
      matchingData: null
   }

   setMatchingData() {
      let queryString = '[* ' + ignoreCategories().map(cat => 'category='+cat).join(' | ') + ']';
      let match = FhirTransform.getPathItem(this.props.data, queryString);
      this.setState({ matchingData: match.length > 0 ? match.sort((a, b) => stringCompare(a.category, b.category)) : null });
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
      let renderedCats = [];
      return ( this.state.matchingData &&
	       this.state.matchingData.map((elt, index) => {
		  if (renderedCats.includes(elt.category)) {
		     return null;
		  } else {
		     renderedCats.push(elt.category);
		     return (
			<div className={this.props.className} key={index} >
			   <div className='content-header-container' >
		              { itemDate &&
				<div className={this.props.isEnabled ? 'content-header-date' : 'content-header-date-disabled'}>{itemDate}</div> }
		              <div className={this.props.isEnabled ? 'content-header' : 'content-header-disabled'}>{elt.category}</div>
			   </div>
			   <div className='unimplemented-label'>
			      { this.props.isEnabled && '[Not in S4S / currently unimplemented]' }
			   </div>
			</div> );
		  }
	       } )
	     );
   }
}
