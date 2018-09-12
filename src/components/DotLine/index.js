import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './DotLine.css';
import config from '../../config.js';

import { numericPart, unitPart } from '../../util.js';

//
// Render a row of dots (within an SVGContainer)
//
export default class DotLine extends Component {

   static propTypes = {
      width: PropTypes.string,				 // Added via React.cloneElement() in <SVGContainer/>
      height: PropTypes.string,				 // Added via React.cloneElement() in <SVGContainer/>
      dotPositions: PropTypes.arrayOf(PropTypes.shape({	 // Dots to be rendered
         position: PropTypes.number.isRequired,		 //    Horizontal position (range: 0.0 - 1.0)
	 date: PropTypes.string.isRequired		 //    Associated date
      })).isRequired,
      context: PropTypes.shape({
	 parent: PropTypes.string.isRequired,		 // Parent component name
	 rowName: PropTypes.string.isRequired,		 // Specific category/provider name
	 dotType: PropTypes.string.isRequired		 // 'active'/'inactive'/'activeHighlight'/'inactiveHighlight'
      }),
      dotClickFn: PropTypes.func			 // Callback when a dot is clicked
   }

   render() {
      // TODO: make consistent (need units?)
      const halfHeight = numericPart(this.props.height)/2 + unitPart(this.props.height);
       
      if (this.props.dotPositions.length > 0) {
	 switch (this.props.context.dotType) {
	    case 'inactive':
	       return this.props.dotPositions.map(
		   (val, index) => <circle className='inactive-dots' key={index} cx={val.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
					   onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, val.date) : null } />);
	    case 'activeHighlight':
	       let ahResults = this.props.dotPositions.map(
		   (val, index) => <circle className='active-highlight-dots' key={'h'+index} cx={val.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
					   onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, val.date) : null } />);
	       return ahResults.concat(this.props.dotPositions.map(
		   (val, index) => <circle className='highlight-ring-dots' key={'r'+index} cx={val.position*100+'%'} cy={halfHeight} r={config.highlightDotRadius}
					   onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, val.date) : null } />));
	    case 'inactiveHighlight':
	       let ihResults = this.props.dotPositions.map(
		   (val, index) => <circle className='inactive-highlight-dots' key={'h'+index} cx={val.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
					   onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, val.date) : null } />);
	       return ihResults.concat(this.props.dotPositions.map(
		   (val, index) => <circle className='highlight-ring-dots' key={'r'+index} cx={val.position*100+'%'} cy={halfHeight} r={config.highlightDotRadius}
					   onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, val.date) : null } />));
	    default: // 'active'
	       return this.props.dotPositions.map(
		   (val, index) => <circle className='active-dots' key={index} cx={val.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
					   onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, val.date) : null } />);
	 }
      } else {
	  return null;
      }
   }
}
