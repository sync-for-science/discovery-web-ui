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
      categoryName: PropTypes.string.isRequired,
      callbackFn: PropTypes.func.isRequired,
      dotClickFn: PropTypes.func.isRequired
   }

   state = {
      isEnabled: true
   }

   handleClick = () => {
      this.setState({isEnabled: !this.state.isEnabled});
   }

   renderDotLines() {
      return [
	 <DotLine className='inactive-dots' key='inactive' dotRadius={config.normalDotRadius}
		  dotPositions={this.props.callbackFn(this.constructor.name, this.props.categoryName, 'inactive')}
		  context={ {parent:this.constructor.name, rowName:this.props.categoryName, dotType:'inactive'} }
		  dotClickFn={this.props.dotClickFn} />,
	 <DotLine className='active-dots' key='active' dotRadius={config.normalDotRadius}
		  dotPositions={this.props.callbackFn(this.constructor.name, this.props.categoryName, 'active')}
		  context={ {parent:this.constructor.name, rowName:this.props.categoryName, dotType:'active'} }
		  dotClickFn={this.props.dotClickFn} />,
	 <DotLine className='highlight-dots' key='highlight' dotRadius={config.highlightDotRadius}
		  dotPositions={this.props.callbackFn(this.constructor.name, this.props.categoryName, 'highlight')}
		  context={ {parent:this.constructor.name, rowName:this.props.categoryName, dotType:'highlight'} }
		  dotClickFn={this.props.dotClickFn} />
      ]
   }

   render() {
      return (
	 <div className='category'>
	    <div className='category-nav'>
	       <button className={this.state.isEnabled ? 'category-button-enabled' : 'category-button-disabled'} onClick={this.handleClick} >
	          { this.props.categoryName }
	       </button>
	    </div>
	    <SVGContainer className='category-svg'>
	       {this.state.isEnabled ? this.renderDotLines() : null}
	    </SVGContainer>
	 </div>
      )
   }
}
