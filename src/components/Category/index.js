import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './Category.css';
import config from '../../config.js';

import SVGContainer from '../SVGContainer';
import DotLine from '../DotLine';

//
// Render a category line of ParticipantDetail page
//
export default class Category extends Component {

   static propTypes = {
      category: PropTypes.string,
      active: PropTypes.array,
      highlight: PropTypes.array,
      inactive: PropTypes.array
   }

   render() {
      return (
	 <div className='category'>
	    <div className='category-nav'>
	       { this.props.category }
	    </div>
	    <SVGContainer className='category-svg'>
	       <DotLine className='active-dots' key='active' dotRadius={config.normalDotRadius} dotPositions={this.props.active} />
	       <DotLine className='highlight-dots' key='highlight' dotRadius={config.highlightDotRadius} dotPositions={this.props.highlight} />
	       <DotLine className='inactive-dots' key='inactive' dotRadius={config.normalDotRadius} dotPositions={this.props.inactive} />
	    </SVGContainer>
	 </div>
      )
   }
}
