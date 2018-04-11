import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './DotLine.css';

//
// Render a row of dots (within an SVGContainer)
//   TODO: Make dots clickable
//
export default class DotLine extends Component {

   static propTypes = {
      width: PropTypes.string,			// Added via React.cloneElement() in <SVGContainer/>
      height: PropTypes.string,			// Added via React.cloneElement() in <SVGContainer/>
      dotRadius: PropTypes.string.isRequired,	// Radius of dots
      dotPositions: PropTypes.array.isRequired,	// Horizontal position of dots to be rendered (default range: 0.0 - 1.0)
      positionFn: PropTypes.func		// Optional function to map position values to the range 0.0 - 1.0
   }

   render() {
      const className = this.props.className;
      const positionFn = this.props.positionFn;
      const width = this.props.width;
      const height = this.props.height;
      const halfHeight = this.numericPart(height)/2 + this.unitPart(height);

      let results;
   
      if (positionFn) {
         results = this.props.dotPositions.map(
	    (val, index) => <circle className={className} key={index+1} cx={positionFn(val)+'%'} cy={halfHeight} r={this.props.dotRadius} />);
      } else {
	 results = this.props.dotPositions.map(
	    (val, index) => <circle className={className} key={index+1} cx={val*100+'%'} cy={halfHeight} r={this.props.dotRadius} />);
      }

      // Add line at start so it displays "behind" dots
      results.unshift(<line className={className} key='0' x1='0' y1={halfHeight} x2={width} y2={halfHeight} />);

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

   getStyle(oElm, css3Prop){
      var strValue = '';

      if (window.getComputedStyle){
	 strValue = getComputedStyle(oElm).getPropertyValue(css3Prop);
      } else if (oElm.currentStyle){
	 try {
	    strValue = oElm.currentStyle[css3Prop];
	 } catch (e) {}
      }

      return strValue;
   }
}
