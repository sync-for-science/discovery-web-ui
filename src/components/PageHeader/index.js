import React, { Component } from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';

import './PageHeader.css';
import config from '../../config.js';

import Search from '../Search';

//
// Render the page header of ParticipantDetail page
//    if there is a 'logos' query parameter, its comma-separated
//    elements will be used as left-to-right logo css classes.
//
export default class PageHeader extends Component {

   static propTypes = {
      rawQueryString: PropTypes.string.isRequired,
      modalIsOpen: PropTypes.bool.isRequired,
      modalFn: PropTypes.func.isRequired,	// Callback to handle clicks on header icons
      searchData: PropTypes.array,
      searchCallback: PropTypes.func.isRequired
   }

   state = {
      modalName: '',
      logoClasses: ['logo-s4s-button'],		// Default value. Parsed from query string 'logos=a,b,c'
      currentTextSize: 1.0,
      inactiveLight: true,
      menuIsOpen: false
   }

   onKeydown = (event) => {
      if (this.state.menuIsOpen && event.key === 'Escape') {
	 this.setState({menuIsOpen: false});
      }
   }

   componentDidMount() {
      window.addEventListener('keydown', this.onKeydown);
      const queryVals = queryString.parse(this.props.rawQueryString);
      if (queryVals.logos) {
	  this.setState({logoClasses: queryVals.logos.split(',')});
      }
   }

   componentWillUnmount() {
      window.removeEventListener('keydown', this.onKeydown);
   }

   componentDidUpdate(prevProps, prevState) {
      if (prevProps.modalIsOpen && !this.props.modalIsOpen) {
	 // The modal was closed -- turn "off" the associated button
	 switch (this.state.modalName) {
	    case 'logoModal':
	       for (let logoClass of this.state.logoClasses) {
		  document.querySelector('.'+logoClass+'-on').className = logoClass+'-off';
	       }
	       break;
	    default:
	       break;
	 }
	 this.setState({modalName: ''})
      }
   }

   resizeText(dir) {
      if (document.documentElement.style.fontSize === '') {
         document.documentElement.style.fontSize = '1.0rem';
      }

      let size = parseFloat(document.documentElement.style.fontSize);

      if (dir==='+' && size < config.maxTextSize) {
	 size = size + config.textSizeStep;
	 this.setState({currentTextSize: size});
	 document.documentElement.style.fontSize = size + 'rem';

      } else if (dir==='-' && size > config.minTextSize) {
	 size = size - config.textSizeStep;
	 this.setState({currentTextSize: size});
	 document.documentElement.style.fontSize = size + 'rem';
      }
   }

   resetTextSize() {
      this.setState({currentTextSize: 1.0});
      document.documentElement.style.fontSize = '1.0rem';
   }

   itemClick(itemName) {
      if (!this.props.modalIsOpen) {
	 this.setState({modalName: itemName});	// Record which button was clicked for subsequent close
	 this.props.modalFn(itemName);		// Let parent know to open the modal

	 // Turn "on" the appropriate item
	 switch (itemName) {
	    case 'logoModal':
	       for (let logoClass of this.state.logoClasses) {
		  document.querySelector('.'+logoClass+'-off').className = logoClass+'-on';
	       }
	       break;
	    default:
	       break;
	 }
      }
   }

   renderMenu() {
      return (
	 <div className='header-menu' onMouseLeave={() => this.setState({menuIsOpen: false})}>
	    <div className='header-menu-info'     onClick={() => this.itemClick('participantInfoModal')}>Info</div>
	    <div className='header-menu-help'     onClick={() => this.itemClick('helpModal')}>Help</div>
	    <div className='header-menu-download' onClick={() => this.itemClick('downloadModal')}>Download</div>
	    <div className='header-menu-print'    onClick={() => this.itemClick('printModal')}>Print</div>
	 </div>
      );
   }

   render() {
      return (
	 <div className='page-header'>
	    <div className='logo-box'>
	       { this.state.logoClasses.map(
		   (logoClass,index) => <button className={logoClass+'-off'} key={logoClass+index} onClick={() => this.itemClick('logoModal')} /> )}
	    </div>
	    { this.props.searchData && <Search data={this.props.searchData} callback={this.props.searchCallback} />}
	    <div className='header-controls-box'>
	      {/* make highlight active/inactive first <button className={'inactive-light-'+(this.state.inactiveLight ? 'on' : 'off')}>Inactive</button> */}
	       <button className='text-size-smaller-button-off'	onClick={() => this.resizeText('-')} />
	       <button className='text-size-larger-button-off'	onClick={() => this.resizeText('+')} />
	       <div className='text-size-current'		onClick={() => this.resetTextSize()}>
	         {Math.round(this.state.currentTextSize*100)}%
	       </div>

	      <button className={this.state.menuIsOpen ? 'header-menu-button-open' : 'header-menu-button'}
		      onClick={() => this.state.modalName === '' && this.setState({menuIsOpen: !this.state.menuIsOpen})} />
	       { this.state.menuIsOpen && this.renderMenu() }
	    </div>
	 </div>
      )
   }
}
