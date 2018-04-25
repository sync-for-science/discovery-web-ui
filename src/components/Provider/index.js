import React, { Component } from 'react';
import PropTypes from 'prop-types';
//import { Button } from 'react-bootstrap';

import './Provider.css';
import config from '../../config.js';

import SVGContainer from '../SVGContainer';
import DotLine from '../DotLine';

//
// Render a provider line of ParticipantDetail page
//
export default class Provider extends Component {

   static propTypes = {
      provider: PropTypes.string,
      active: PropTypes.array,
      highlight: PropTypes.array,
      inactive: PropTypes.array
   }

   render() {
      return (
	 <div className='provider'>
	    <div className='provider-nav'>
	       { this.props.provider }
	    </div>
	    <SVGContainer className='provider-svg'>
	       <DotLine className='active-dots' key='active' dotRadius={config.normalDotRadius} dotPositions={this.props.active} />
	       <DotLine className='highlight-dots' key='highlight' dotRadius={config.highlightDotRadius} dotPositions={this.props.highlight} />
	       <DotLine className='inactive-dots' key='inactive' dotRadius={config.normalDotRadius} dotPositions={this.props.inactive} />
	    </SVGContainer>
	 </div>
      )
   }
}
