import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';

import './ContentPanel.css';

//
// Render the content panel of ParticipantDetail page
//
export default class ContentPanel extends Component {

   static propTypes = {
      open: PropTypes.bool.isRequired,
      onClose: PropTypes.func.isRequired,
      contentType: PropTypes.string.isRequired,
      callbackFn: PropTypes.func.isRequired
   }

   state = {
      isOpen: false,
      windowHeight: window.innerHeight,
      topBound: 0,
      positionY: 0
   }

   // Kluge: this function violates locality/independence by needing to know absolute locations of various divs
   updateDraggableOnMount = () => {
      const footer = document.querySelector('.page-footer');
      const header = document.querySelector('.page-header');
      const categories = document.querySelector('.categories');
      const headerBorder = header ? parseInt(this.getStyle(header, 'border-bottom-width'), 10) : 0;

      this.setState( { topBound: footer ? header.getBoundingClientRect().bottom - footer.getBoundingClientRect().top - headerBorder : 0,
		       positionY:  footer ? categories.getBoundingClientRect().top - footer.getBoundingClientRect().top - headerBorder : 0 });
   }

   // Kluge: this function violates locality/independence by needing to know absolute locations of various divs
   updateDraggableOnResize = this.updateDraggableOnResize.bind(this);
   updateDraggableOnResize() {
      const footer = document.querySelector('.page-footer');
      const header = document.querySelector('.page-header');
      const headerBorderWidth = header ? parseInt(this.getStyle(header, 'border-bottom-width'), 10) : 0;
      const windowHeightDelta = window.innerHeight - this.state.windowHeight;

      this.setState( { windowHeight: window.innerHeight,
		       topBound: footer ? header.getBoundingClientRect().bottom - footer.getBoundingClientRect().top - headerBorderWidth : 0,
		       positionY: this.state.positionY - windowHeightDelta });
   }

   onDragStop = (e, data) => {
      this.setState({ positionY: data.y });
   }

   componentDidMount() {
      this.updateDraggableOnMount();
      window.addEventListener('resize', this.updateDraggableOnResize);
   }

   componentWillUnmount() {
      window.removeEventListener('resize', this.updateDraggableOnResize);
   }

   componentDidUpdate(prevProps, prevState) {
      if (!prevProps.open && this.props.open) {
	 this.setState({ isOpen: true });
      } 
   }

   onClose = this.onClose.bind(this);
   onClose() {
      console.log('onclose');
      this.setState({ isOpen: false });
      this.props.onClose();
   }

   render() {
      return ( this.state.isOpen &&
	       <Draggable axis='y' position={{x:0, y:this.state.positionY}} bounds={{top:this.state.topBound, bottom:0}} onStop={this.onDragStop}>
	          <div className='content-panel'>
		     <div className='content-panel-left'>
			<button className='content-panel-left-button'/>
		     </div>
		     <div className='content-panel-inner'>
	                <div className='content-panel-inner-title'>
			   {this.props.contentType}
			   <button className='content-panel-inner-title-close-button' onClick={this.onClose} />
		        </div>
		        <div className='content-panel-inner-body'>
			   ...stuff...
		        </div>
		        <div className='content-panel-inner-footer'>

		        </div>
		     </div>
		     <div className='content-panel-right'>
			<button className='content-panel-right-button'/>
		     </div>
	          </div>
	       </Draggable>
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
