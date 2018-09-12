import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './CategoryRollup.css';

import SVGContainer from '../SVGContainer';
import DotLine from '../DotLine';

//
// Render the "rollup" category line of ParticipantDetail page
//
export default class CategoryRollup extends Component {

   static propTypes = {
      svgWidth: PropTypes.string.isRequired,
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
	    <SVGContainer className='category-rollup-svg-container' svgClassName='category-rollup-svg' svgWidth={this.props.svgWidth}>
	       <DotLine key='inactive'
			dotPositions={this.props.callbackFn(this.constructor.name, 'Categories', true, 'inactive')}
			context={ {parent:this.constructor.name, rowName:'Categories', dotType:'inactive'} }
			dotClickFn={this.props.dotClickFn} />
	       <DotLine key='active'
			dotPositions={this.props.callbackFn(this.constructor.name, 'Categories', true, 'active')}
			context={ {parent:this.constructor.name, rowName:'Categories', dotType:'active'} }
			dotClickFn={this.props.dotClickFn} />
	       <DotLine key='inactiveHighlight'
			dotPositions={this.props.callbackFn(this.constructor.name, 'Categories', true, 'inactiveHighlight')}
			context={ {parent:this.constructor.name, rowName:'Categories', dotType:'inactiveHighlight'} }
			dotClickFn={this.props.dotClickFn} />
	       <DotLine key='activeHighlight'
			dotPositions={this.props.callbackFn(this.constructor.name, 'Categories', true, 'activeHighlight')}
			context={ {parent:this.constructor.name, rowName:'Categories', dotType:'activeHighlight'} }
			dotClickFn={this.props.dotClickFn} />
	    </SVGContainer>
	 </div>
      )
   }
}
