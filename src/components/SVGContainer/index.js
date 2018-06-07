import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './SVGContainer.css';

//
// The container for a collection of SVG elements
//    Gets width, height from the CSS class
//
export default class SVGContainer extends Component {

   static propTypes = {
      preserveAspectRatio: PropTypes.string		// Default is 'xMidYMid meet' if not provided
   }

   state = {
      width: '0px',
      height: '0px'
   };

   updateDimensions = () => {
      const selector = this.props.className.split(' ').map(name => '.'+name).join('');
      const elt = document.querySelector(selector);
      this.setState({ width: this.getStyle(elt, 'width'),
		      height: this.getStyle(elt, 'height') });
   }

   componentDidMount() {
      this.updateDimensions();
      window.addEventListener('resize', this.updateDimensions);       
   }

   componentWillUnmount() {
      window.removeEventListener('resize', this.updateDimensions);
   }

   render() {
      const par = this.props.preserveAspectRatio ? this.props.preserveAspectRatio : 'xMidYMid meet';
      const { width, height } = this.state;
      const childrenWithSizeProps = React.Children.map(this.props.children,
						       child => React.cloneElement(child, {width: width, height: height}));
      return (
	 <div className={this.props.className}>
	    <svg width={width} height={height} preserveAspectRatio={par} xmlns='http://www.w3.org/2000/svg'>
	       { childrenWithSizeProps }
	    </svg>
	 </div>	 
      )
   }

   getStyle(oElm, css3Prop){
      try {
	 if (window.getComputedStyle){
	    return getComputedStyle(oElm).getPropertyValue(css3Prop);
	 } else if (oElm.currentStyle){
	    return oElm.currentStyle[css3Prop];
	 }
      } catch (e) {
      	 return '';
      }
   }
}
