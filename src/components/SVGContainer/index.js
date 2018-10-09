import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './SVGContainer.css';
import { getStyle } from '../../util.js';

//
// The container for a collection of SVG elements
//    Gets height from the CSS class
//
export default class SVGContainer extends Component {

   static propTypes = {
      preserveAspectRatio: PropTypes.string,		// Default is 'xMidYMid meet' if not provided
      svgClassName: PropTypes.string.isRequired,
      svgWidth: PropTypes.string.isRequired
   }

   state = {
      height: '0px'
   };

   componentDidMount() {
      const selector = this.props.className.split(' ').map(name => '.'+name).join(''),
	    elt = document.querySelector(selector);
      this.setState({ height: getStyle(elt, 'height') });
   }

   render() {
      const par = this.props.preserveAspectRatio ? this.props.preserveAspectRatio : 'xMidYMid meet',
	    height = this.state.height,
	    width = this.props.svgWidth,
	    childrenWithSizeProps = React.Children.map(this.props.children,
						       child => React.cloneElement(child, {width: width, height: height}));
      return (
	 <div className={this.props.className}>
	    <svg className={this.props.svgClassName} width={width} height={height} preserveAspectRatio={par} xmlns='http://www.w3.org/2000/svg'>
	       { childrenWithSizeProps }
	    </svg>
	 </div>	 
      )
   }
}