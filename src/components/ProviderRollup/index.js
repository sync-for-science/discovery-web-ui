import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './ProviderRollup.css';
import config from '../../config.js';

import SVGContainer from '../SVGContainer';
import DotLine from '../DotLine';

//
// Render the "rollup" provider line of ParticipantDetail page
//
export default class ProviderRollup extends Component {

   static propTypes = {
      callbackFn: PropTypes.func.isRequired
   }

   render() {
      return (
	 <div className='provider-rollup'>
	    <div className='provider-rollup-nav'>
	       --- Providers ---
	    </div>
	    <SVGContainer className='provider-rollup-svg'>
	       <DotLine className='inactive-dots' key='inactive' dotRadius={config.normalDotRadius}
			dotPositions={this.props.callbackFn(this.constructor.name, null, 'inactive')} />
	       <DotLine className='active-dots' key='active' dotRadius={config.normalDotRadius}
			dotPositions={this.props.callbackFn(this.constructor.name, null, 'active')} />
	       <DotLine className='highlight-dots' key='highlight' dotRadius={config.highlightDotRadius}
			dotPositions={this.props.callbackFn(this.constructor.name, null, 'highlight')} />
	    </SVGContainer>
	 </div>
      )
   }
}
