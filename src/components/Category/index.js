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
      category: PropTypes.string.isRequired,
      callbackFn: PropTypes.func.isRequired
   }

   render() {
      return (
	 <div className='category'>
	    <div className='category-nav'>
	       { this.props.category }
	    </div>
	    <SVGContainer className='category-svg'>
	       <DotLine className='inactive-dots' key='inactive' dotRadius={config.normalDotRadius}
			dotPositions={this.props.callbackFn(this.constructor.name, this.props.category, 'inactive')} />
	       <DotLine className='active-dots' key='active' dotRadius={config.normalDotRadius}
			dotPositions={this.props.callbackFn(this.constructor.name, this.props.category, 'active')} />
	       <DotLine className='highlight-dots' key='highlight' dotRadius={config.highlightDotRadius}
			dotPositions={this.props.callbackFn(this.constructor.name, this.props.category, 'highlight')} />
	    </SVGContainer>
	 </div>
      )
   }
}
