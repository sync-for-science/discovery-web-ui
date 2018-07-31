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
      this.props.expansionFn('Providers', !this.state.isExpanded);
   }

   render() {
      return (
	 <div className='provider-rollup'>
	    <div className={this.state.isExpanded ? 'provider-rollup-nav-enabled' : 'provider-rollup-nav-disabled'} onClick={this.handleClick} >
	       Providers
	    </div>
	    <SVGContainer className='provider-rollup-svg-container' svgClassName='provider-rollup-svg' svgWidth={this.props.svgWidth}>
	       <DotLine className='inactive-dots' key='inactive' dotRadius={config.normalDotRadius}
			dotPositions={this.props.callbackFn(this.constructor.name, 'Providers', 'inactive')}
			context={ {parent:this.constructor.name, rowName:'Providers', dotType:'inactive'} }
			dotClickFn={this.props.dotClickFn} />
	       <DotLine className='active-dots' key='active' dotRadius={config.normalDotRadius}
			dotPositions={this.props.callbackFn(this.constructor.name, 'Providers', 'active')}
			context={ {parent:this.constructor.name, rowName:'Providers', dotType:'active'} }
			dotClickFn={this.props.dotClickFn} />
	       <DotLine className='highlight-dots' key='highlight' dotRadius={config.normalDotRadius}
			dotPositions={this.props.callbackFn(this.constructor.name, 'Providers', 'highlight')}
			context={ {parent:this.constructor.name, rowName:'Providers', dotType:'highlight'} }
			dotClickFn={this.props.dotClickFn} />
	       <DotLine className='highlight-ring-dots' key='highlight-ring' dotRadius={config.highlightDotRadius}
			dotPositions={this.props.callbackFn(this.constructor.name, 'Providers', 'highlight')}
			context={ {parent:this.constructor.name, rowName:'Providers', dotType:'highlight'} }
			dotClickFn={this.props.dotClickFn} />
	    </SVGContainer>
	 </div>
      )
   }
}
