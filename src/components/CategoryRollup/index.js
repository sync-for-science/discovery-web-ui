import React from 'react';
import PropTypes from 'prop-types';

import '../../css/Selector.css';
import './CategoryRollup.css'

import SVGContainer from '../SVGContainer';
import DotLine from '../DotLine';

//
// Render the DiscoveryApp "rollup" category line
//
export default class CategoryRollup extends React.Component {

   static myName = 'CategoryRollup';

   static propTypes = {
      svgWidth: PropTypes.string.isRequired,
      dotPositionsFn: PropTypes.func.isRequired,
      dotClickFn: PropTypes.func.isRequired,
      isExpanded: PropTypes.bool.isRequired,
      expansionFn: PropTypes.func.isRequired,
      allOnOffFn: PropTypes.func.isRequired,
      noDots: PropTypes.bool
   }

   state = {
      isExpanded: this.props.isExpanded
   }

   handleTwistyClick = () => {
      this.setState({isExpanded: !this.state.isExpanded});
      this.props.expansionFn('Categories', !this.state.isExpanded);
   }

   handleDoubleClick = () => {
      this.props.allOnOffFn('Category');
   }
	
   render() {
      return (
	 <div className='selector-rollup'>
	    <div className={this.state.isExpanded ? 'selector-rollup-nav-enabled' : 'selector-rollup-nav-disabled'}
		 onClick={this.handleTwistyClick} onDoubleClick={this.handleDoubleClick} >
	      {/*Categories*/}Show
	    </div>
	    <SVGContainer className='category-rollup-svg-container' style={this.props.noDots ? {backgroundImage:'none'} : null}
			  svgClassName='category-rollup-svg' svgWidth={this.props.svgWidth}>
	       { !this.props.noDots &&
		 <DotLine dotPositions={this.props.dotPositionsFn(CategoryRollup.myName, 'Categories', true)}
			  context={ {parent:CategoryRollup.myName, rowName:'Categories'} }
			  dotClickFn={this.props.dotClickFn} /> }
	    </SVGContainer>
	 </div>
      )
   }
}
