import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './Provider.css';
import config from '../../config.js';

import SVGContainer from '../SVGContainer';
import DotLine from '../DotLine';

//
// Render a provider line of ParticipantDetail page
//
export default class Provider extends Component {

   static propTypes = {
      providerName: PropTypes.string.isRequired,
      svgWidth: PropTypes.string.isRequired,
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
		  dotPositions={this.props.callbackFn(this.constructor.name, this.props.providerName, 'inactive')}
		  context={ {parent:this.constructor.name, rowName:this.props.providerName, dotType:'inactive'} }
		  dotClickFn={this.props.dotClickFn} />,
	 <DotLine className='active-dots' key='active' dotRadius={config.normalDotRadius}
		  dotPositions={this.props.callbackFn(this.constructor.name, this.props.providerName, 'active')}
		  context={ {parent:this.constructor.name, rowName:this.props.providerName, dotType:'active'} }
		  dotClickFn={this.props.dotClickFn} />,
	 <DotLine className='highlight-dots' key='highlight' dotRadius={config.normalDotRadius}
		  dotPositions={this.props.callbackFn(this.constructor.name, this.props.providerName, 'highlight')}
		  context={ {parent:this.constructor.name, rowName:this.props.providerName, dotType:'highlight'} }
	  	  dotClickFn={this.props.dotClickFn} />,
	 <DotLine className='highlight-ring-dots' key='highlight-ring' dotRadius={config.highlightDotRadius}
		  dotPositions={this.props.callbackFn(this.constructor.name, this.props.providerName, 'highlight')}
		  context={ {parent:this.constructor.name, rowName:this.props.providerName, dotType:'highlight'} }
		  dotClickFn={this.props.dotClickFn} />
      ]
   }

   render() {
      return (
	 <div className='provider'>
	    <div className='provider-nav'>
	       <button className={this.state.isEnabled ? 'provider-button-enabled' : 'provider-button-disabled'} onClick={this.handleClick} >
	          { this.props.providerName }
	       </button>
	    </div>
	    <SVGContainer className='provider-svg-container' svgClassName='provider-svg' svgWidth={this.props.svgWidth}>
	       {this.state.isEnabled ? this.renderDotLines() : null}
	    </SVGContainer>
	 </div>
      )
   }
}
