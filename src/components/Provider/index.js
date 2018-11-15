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
      dotPositionsFn: PropTypes.func.isRequired,
      dotClickFn: PropTypes.func.isRequired,
      enabledFn: PropTypes.func.isRequired
   }

   state = {
      isEnabled: true
   }

   componentDidMount() {
      window.addEventListener('keydown', this.onKeydown);
   }

   componentWillUnmount() {
      window.removeEventListener('keydown', this.onKeydown);
   }

   onKeydown = (event) => {
      if (event.key === 'Enter') {
	 // Do nothing (don't want in-focus buttons to toggle on Enter
	 event.preventDefault();
      }
   }

   handleButtonClick = () => {
      this.props.enabledFn('Provider', this.props.providerName, !this.state.isEnabled);
      this.setState({isEnabled: !this.state.isEnabled});
   }

   render() {
      return (
	 <div className='provider'>
	    <div className='provider-nav'>
	       <button className={this.state.isEnabled ? 'provider-button-enabled' : 'provider-button-disabled'} onClick={this.handleButtonClick} >
	          { this.props.providerName }
	       </button>
	    </div>
	    <SVGContainer className='provider-svg-container' svgClassName='provider-svg' svgWidth={this.props.svgWidth}>
	       <DotLine dotPositions={this.props.dotPositionsFn(this.constructor.name, this.props.providerName, this.state.isEnabled)}
			context={ {parent:this.constructor.name, rowName:this.props.providerName} }
			dotClickFn={this.props.dotClickFn} />
	    </SVGContainer>
	 </div>
      )
   }
}
