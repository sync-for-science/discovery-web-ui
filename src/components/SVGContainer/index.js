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

   constructor(...args) {
      super(...args);
      this.state = {
	 width: '0px',
	 height: '0px'
      };
      this.updateDimensions = this.updateDimensions.bind(this);
   }

   updateDimensions() {
      const elt = document.querySelector('.'+this.props.className);
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
      const className = this.props.className;
      const { width, height } = this.state;
      const childrenWithSizeProps = React.Children.map(this.props.children,
						child => React.cloneElement(child, {width: width, height: height}));
      return (
	 <div className={className}>
	    <svg width={width} height={height} preserveAspectRatio={par} xmlns='http://www.w3.org/2000/svg'>
	       { childrenWithSizeProps }
	    </svg>
	 </div>	 
      )
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
