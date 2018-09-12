import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './ProviderRollup.css';

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
	       <DotLine key='inactive'
			dotPositions={this.props.callbackFn(this.constructor.name, 'Providers', true, 'inactive')}
			context={ {parent:this.constructor.name, rowName:'Providers', dotType:'inactive'} }
			dotClickFn={this.props.dotClickFn} />
	       <DotLine key='active'
			dotPositions={this.props.callbackFn(this.constructor.name, 'Providers', true, 'active')}
			context={ {parent:this.constructor.name, rowName:'Providers', dotType:'active'} }
			dotClickFn={this.props.dotClickFn} />
	       <DotLine key='inactiveHighlight'
			dotPositions={this.props.callbackFn(this.constructor.name, 'Providers', true, 'inactiveHighlight')}
			context={ {parent:this.constructor.name, rowName:'Providers', dotType:'inactiveHighlight'} }
			dotClickFn={this.props.dotClickFn} />
	       <DotLine key='activeHighlight'
			dotPositions={this.props.callbackFn(this.constructor.name, 'Providers', true, 'activeHighlight')}
			context={ {parent:this.constructor.name, rowName:'Providers', dotType:'activeHighlight'} }
			dotClickFn={this.props.dotClickFn} />
	    </SVGContainer>
	 </div>
      )
   }
}
