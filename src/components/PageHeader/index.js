import React, { Component } from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';

import './PageHeader.css';
import config from '../../config.js';

//
// Render the page header of ParticipantDetail page
//    if there is a 'logos' query parameter, its comma-separated
//    elements will be used as left-to-right logo css classes.
//
export default class PageHeader extends Component {

   static propTypes = {
      rawQueryString: PropTypes.string.isRequired,
      modalIsOpen: PropTypes.bool.isRequired,
      modalFn: PropTypes.func.isRequired	// Callback to handle clicks on header icons
   }

   state = {
      modalName: '',
      logoClasses: ['logo-s4s-button']		// Parsed from query string 'logos=a,b,c'
   }

   componentDidMount() {
      const queryVals = queryString.parse(this.props.rawQueryString);
      if (queryVals.logos) {
	  this.setState({logoClasses: queryVals.logos.split(',')});
      }
   }

   componentDidUpdate(prevProps, prevState) {
      if (prevProps.modalIsOpen && !this.props.modalIsOpen) {
	 // The modal was closed -- turn "off" the associated button
	 switch (this.state.modalName) {
	    case 'logoModal':
	       for (var logoClass of this.state.logoClasses) {
		  document.querySelector('.'+logoClass+'-on').className = logoClass+'-off';
	       }
	       break;
	    case 'participantInfoModal':
	       document.querySelector('.participant-info-button-on').className = 'participant-info-button-off';
	       break;
	    case 'helpModal':
	       document.querySelector('.help-button-on').className = 'help-button-off';
	       break;
	    case 'downloadModal':
	       document.querySelector('.download-button-on').className = 'download-button-off';
	       break;
	    case 'printModal':
	       document.querySelector('.print-button-on').className = 'print-button-off';
	       break;
	    default:
	       alert('name=' + this.state.modalName);
	       break;
	 }
	 this.setState({modalName: ''})
      }
   }

   resizeText(dir) {
      if (document.body.style.fontSize === '') {
         document.body.style.fontSize = '1.0em';
      }
      let currSize = parseFloat(document.body.style.fontSize);
      document.body.style.fontSize = currSize * ((dir==='+') ? 1+config.textSizeStep : 1-config.textSizeStep) + 'em';
   }

   buttonClick(buttonName) {
      if (!this.props.modalIsOpen) {
	 this.setState({modalName: buttonName});	// Record which button was clicked for subsequent close
	 this.props.modalFn(buttonName);		// Let parent know to open the modal

	 // Turn "on" the appropriate button
	 switch (buttonName) {
	    case 'logoModal':
	       for (var logoClass of this.state.logoClasses) {
		  document.querySelector('.'+logoClass+'-off').className = logoClass+'-on';
	       }
	       break;
	    case 'participantInfoModal':
	       document.querySelector('.participant-info-button-off').className = 'participant-info-button-on';
	       break;
	    case 'helpModal':
	       document.querySelector('.help-button-off').className = 'help-button-on';
	       break;
	    case 'downloadModal':
	       document.querySelector('.download-button-off').className = 'download-button-on';
	       break;
	    case 'printModal':
	       document.querySelector('.print-button-off').className = 'print-button-on';
	       break;
	    default:
	       break;
	 }
      }
   }

   render() {
      return (
	 <div className='page-header'>
	    <div className="logo-box">
	       { this.state.logoClasses.map(
		   (logoClass,index) => <button className={logoClass+'-off'} key={logoClass+index} onClick={() => this.buttonClick('logoModal')} /> )}
	    </div>
	    <div className="header-controls-box">
	       <button className="text-size-smaller-button-off"		onClick={() => this.resizeText('-')} />
	       <button className="text-size-larger-button-off"		onClick={() => this.resizeText('+')} />
	       <button className="participant-info-button-off"	onClick={() => this.buttonClick('participantInfoModal')} />
	       <button className="help-button-off"			onClick={() => this.buttonClick('helpModal')} />
	       <button className="download-button-off"			onClick={() => this.buttonClick('downloadModal')} />
	       <button className="print-button-off"			onClick={() => this.buttonClick('printModal')} />
	    </div>
	 </div>
      )
   }
}
