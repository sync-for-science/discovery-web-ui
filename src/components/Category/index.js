import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './Category.css';

import SVGContainer from '../SVGContainer';
import DotLine from '../DotLine';

//
// Render a category line of ParticipantDetail page
//
export default class Category extends Component {

   static propTypes = {
      categoryName: PropTypes.string.isRequired,
      svgWidth: PropTypes.string.isRequired,
      callbackFn: PropTypes.func.isRequired,
      dotClickFn: PropTypes.func.isRequired,
      enabledFn: PropTypes.func.isRequired
   }

   state = {
      isEnabled: true
   }

   handleClick = () => {
      this.props.enabledFn('Category', this.props.categoryName, !this.state.isEnabled);
      this.setState({isEnabled: !this.state.isEnabled});
   }

   render() {
      return (
	 <div className='category'>
	    <div className='category-nav'>
	       <button className={this.state.isEnabled ? 'category-button-enabled' : 'category-button-disabled'} onClick={this.handleClick} >
	          { this.props.categoryName }
	       </button>
	    </div>
	    <SVGContainer className='category-svg-container' svgClassName='category-svg' svgWidth={this.props.svgWidth}>
	       <DotLine key='inactive'
			dotPositions={this.props.callbackFn(this.constructor.name, this.props.categoryName, this.state.isEnabled, 'inactive')}
			context={ {parent:this.constructor.name, rowName:this.props.categoryName, dotType:'inactive'} }
			dotClickFn={this.props.dotClickFn} />
	       <DotLine key='active'
			dotPositions={this.props.callbackFn(this.constructor.name, this.props.categoryName, this.state.isEnabled, 'active')}
			context={ {parent:this.constructor.name, rowName:this.props.categoryName, dotType:'active'} }
			dotClickFn={this.props.dotClickFn} />
	       <DotLine key='inactiveHighlight'
			dotPositions={this.props.callbackFn(this.constructor.name, this.props.categoryName, this.state.isEnabled, 'inactiveHighlight')}
			context={ {parent:this.constructor.name, rowName:this.props.categoryName, dotType:'inactiveHighlight'} }
			dotClickFn={this.props.dotClickFn} />
	       <DotLine key='activeHighlight'
			dotPositions={this.props.callbackFn(this.constructor.name, this.props.categoryName, this.state.isEnabled, 'activeHighlight')}
			context={ {parent:this.constructor.name, rowName:this.props.categoryName, dotType:'activeHighlight'} }
			dotClickFn={this.props.dotClickFn} />
	    </SVGContainer>
	 </div>
      )
   }
}
