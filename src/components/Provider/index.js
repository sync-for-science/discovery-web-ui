import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './Provider.css';

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
      dotClickFn: PropTypes.func.isRequired,
      enabledFn: PropTypes.func.isRequired
   }

   state = {
      isEnabled: true
   }

   handleClick = () => {
      this.props.enabledFn('Provider', this.props.providerName, !this.state.isEnabled);
      this.setState({isEnabled: !this.state.isEnabled});
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
	       <DotLine key='inactive'
			dotPositions={this.props.callbackFn(this.constructor.name, this.props.providerName, this.state.isEnabled, 'inactive')}
			context={ {parent:this.constructor.name, rowName:this.props.providerName, dotType:'inactive'} }
			dotClickFn={this.props.dotClickFn} />
	       <DotLine key='active'
			dotPositions={this.props.callbackFn(this.constructor.name, this.props.providerName, this.state.isEnabled, 'active')}
			context={ {parent:this.constructor.name, rowName:this.props.providerName, dotType:'active'} }
			dotClickFn={this.props.dotClickFn} />
	       <DotLine key='inactiveHighlight'
			dotPositions={this.props.callbackFn(this.constructor.name, this.props.providerName, this.state.isEnabled, 'inactiveHighlight')}
			context={ {parent:this.constructor.name, rowName:this.props.providerName, dotType:'inactiveHighlight'} }
			dotClickFn={this.props.dotClickFn} />
	       <DotLine key='activeHighlight'
			dotPositions={this.props.callbackFn(this.constructor.name, this.props.providerName, this.state.isEnabled, 'activeHighlight')}
			context={ {parent:this.constructor.name, rowName:this.props.providerName, dotType:'activeHighlight'} }
			dotClickFn={this.props.dotClickFn} />
	    </SVGContainer>
	 </div>
      )
   }
}
