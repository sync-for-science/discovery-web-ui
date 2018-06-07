import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './CategoryRollup.css';
import config from '../../config.js';

import SVGContainer from '../SVGContainer';
import DotLine from '../DotLine';

//
// Render the "rollup" category line of ParticipantDetail page
//
export default class CategoryRollup extends Component {

   static propTypes = {
      callbackFn: PropTypes.func.isRequired,
      dotClickFn: PropTypes.func.isRequired,
      expansionFn: PropTypes.func.isRequired
   }

   state = {
      isExpanded: true
   }

   handleClick = () => {
      this.setState({isExpanded: !this.state.isExpanded});
      this.props.expansionFn('Categories', !this.state.isExpanded);
   }

   render() {
      return (
	 <div className='category-rollup'>
	    <div className={this.state.isExpanded ? 'category-rollup-nav-enabled' : 'category-rollup-nav-disabled'} onClick={this.handleClick} >
	       Categories
	    </div>
	    <SVGContainer className='category-rollup-svg'>
	       <DotLine className='inactive-dots' key='inactive' dotRadius={config.normalDotRadius}
			dotPositions={this.props.callbackFn(this.constructor.name, 'Categories', 'inactive')}
			context={ {parent:this.constructor.name, rowName:'Categories', dotType:'inactive'} }
			dotClickFn={this.props.dotClickFn} />
	       <DotLine className='active-dots' key='active' dotRadius={config.normalDotRadius}
			dotPositions={this.props.callbackFn(this.constructor.name, 'Categories', 'active')}
			context={ {parent:this.constructor.name, rowName:'Categories', dotType:'active'} }
			dotClickFn={this.props.dotClickFn} />
	       <DotLine className='highlight-dots' key='highlight' dotRadius={config.highlightDotRadius}
			dotPositions={this.props.callbackFn(this.constructor.name, 'Categories', 'highlight')}
			context={ {parent:this.constructor.name, rowName:'Categories', dotType:'highlight'} }
			dotClickFn={this.props.dotClickFn} />
	    </SVGContainer>
	 </div>
      )
   }
}
