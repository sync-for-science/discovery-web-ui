import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './DotLine.css';

//
// Render a row of dots (within an SVGContainer)
//
export default class DotLine extends Component {

   static propTypes = {
      width: PropTypes.string,			  // Added via React.cloneElement() in <SVGContainer/>
      height: PropTypes.string,			  // Added via React.cloneElement() in <SVGContainer/>
      dotRadius: PropTypes.string.isRequired,	  // Radius of dots
      dotPositions: PropTypes.array.isRequired,	  // Horizontal positions of dots to be rendered (default range: 0.0 - 1.0)
      positionFn: PropTypes.func,		  // Optional function to map position values to the range 0.0 - 1.0
      context: PropTypes.shape({
	 parent: PropTypes.string.isRequired,	  // Parent component name
	 rowName: PropTypes.string.isRequired,	  // Specific category/provider name
	 dotType: PropTypes.string.isRequired	  // 'active'/'inactive'/'highlight'
      }).isRequired,
      dotClickFn: PropTypes.func.isRequired	  // Callback when a dot is clicked
   }

   render() {
      const halfHeight = this.numericPart(this.props.height)/2 + this.unitPart(this.props.height);

      let results;
   
      if (this.props.positionFn) {
         results = this.props.dotPositions.map(
	    (val, index) => <circle className={this.props.className} key={index+1} cx={this.props.positionFn(val)+'%'} cy={halfHeight} r={this.props.dotRadius}
				    onClick={ e => this.props.dotClickFn(this.props.context, this.props.positionFn(val)) } />);
      } else {
	 results = this.props.dotPositions.map(
	    (val, index) => <circle className={this.props.className} key={index+1} cx={val*100+'%'} cy={halfHeight} r={this.props.dotRadius}
				    onClick={ e => this.props.dotClickFn(this.props.context, val) } />);
      }

      // Add line at start so it displays "behind" dots
      results.unshift(<line className={this.props.className} key='0' x1='0' y1={halfHeight} x2={this.props.width} y2={halfHeight} />);

      return results;
   }

   numericPart(val) {
      const index = val.toString().search(/[A-Za-z%]/);
      return val.toString().substring(0,index);
   }

   unitPart(val) {
      const index = val.toString().search(/[A-Za-z%]/);
       return val.toString().substring(index);
   }
}
