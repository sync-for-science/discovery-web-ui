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
      dotPositionsFn: PropTypes.func.isRequired,
      dotClickFn: PropTypes.func.isRequired,
      expansionFn: PropTypes.func.isRequired,
      noDots: PropTypes.bool
   }

   state = {
      isExpanded: true
   }

   handleTwistyClick = () => {
      this.setState({isExpanded: !this.state.isExpanded});
      this.props.expansionFn('Categories', !this.state.isExpanded);
   }

   render() {
      return (
	 <div className='category-rollup'>
	    <div className={this.state.isExpanded ? 'category-rollup-nav-enabled' : 'category-rollup-nav-disabled'} onClick={this.handleTwistyClick} >
	       Categories
	    </div>
	    <SVGContainer className='category-rollup-svg-container' style={this.props.noDots ? {backgroundImage:'none'} : null}
			  svgClassName='category-rollup-svg' svgWidth={this.props.svgWidth}>
	       { !this.props.noDots &&
		 <DotLine dotPositions={this.props.dotPositionsFn(this.constructor.name, 'Categories', true)}
			  context={ {parent:this.constructor.name, rowName:'Categories'} }
			  dotClickFn={this.props.dotClickFn} /> }
	    </SVGContainer>
	 </div>
      )
   }
}
