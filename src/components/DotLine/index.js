import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './DotLine.css';

//
// Render a row of dots (within an SVGContainer)
//
export default class DotLine extends Component {

   static propTypes = {
      width: PropTypes.string,				 // Added via React.cloneElement() in <SVGContainer/>
      height: PropTypes.string,				 // Added via React.cloneElement() in <SVGContainer/>
      dotRadius: PropTypes.string.isRequired,		 // Radius of dots
      dotPositions: PropTypes.arrayOf(PropTypes.shape({	 // Dots to be rendered
         position: PropTypes.number.isRequired,		 //    Horizontal position (default range: 0.0 - 1.0)
	 date: PropTypes.string.isRequired		 //    Associated date
      })).isRequired,
      positionFn: PropTypes.func,			 // Optional function to map position values to the range 0.0 - 1.0
      context: PropTypes.shape({
	 parent: PropTypes.string.isRequired,		 // Parent component name
	 rowName: PropTypes.string.isRequired,		 // Specific category/provider name
	 dotType: PropTypes.string.isRequired		 // 'active'/'inactive'/'highlight'
      }),
      dotClickFn: PropTypes.func			 // Callback when a dot is clicked
   }

   render() {
      // TODO: make consistent (need units?)
      const halfHeight = this.numericPart(this.props.height)/2 + this.unitPart(this.props.height);
       
      let results = null;
   
      if (this.props.positionFn && this.props.dotPositions) {
         results = this.props.dotPositions.map(
	    (val, index) => <circle className={this.props.className} key={index+1} cx={this.props.positionFn(val.position)+'%'}
	    			    cy={halfHeight} r={this.props.dotRadius}
				    onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, val.date) : null } />);
      } else if (this.props.dotPositions) {
	 results = this.props.dotPositions.map(
	    (val, index) => <circle className={this.props.className} key={index+1} cx={val.position*100+'%'} cy={halfHeight} r={this.props.dotRadius}
				    onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, val.date) : null } />);
      }

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
