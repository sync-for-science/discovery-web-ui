import React from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import Draggable from 'react-draggable';

import './PageHeader.css';
import config from '../../config.js';

import { formatPatientName } from '../../fhirUtil.js';
import FhirTransform from '../../FhirTransform.js';
import Search from '../Search';

//
// Render the page header of DiscoveryApp page
//    if there is a 'logos' query parameter, its comma-separated
//    elements will be used as left-to-right logo css classes.
//
export default class PageHeader extends React.Component {

   static propTypes = {
      rawQueryString: PropTypes.string.isRequired,
      modalIsOpen: PropTypes.bool.isRequired,
      modalFn: PropTypes.func.isRequired,	// Callback to handle clicks on header icons
      viewFn: PropTypes.func.isRequired,	// Callback to handle view selection
      searchData: PropTypes.array,
      searchCallback: PropTypes.func.isRequired,
      resources: PropTypes.instanceOf(FhirTransform)
   }

   state = {
      modalName: '',
      logoClasses: ['logo-s4s-button'],		// Default value. Parsed from query string 'logos=a,b,c'
      currentTextSize: 1.0,
      inactiveLight: true,
      menuIsOpen: false,
      currentViewName: null,
      viewHelpIsOpen: false,
      viewHelpRemainingTime: 0
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
      this.viewClick('longitudinalView');	// Set initial/default view
   }

   componentWillUnmount() {
      window.removeEventListener('keydown', this.onKeydown);
      this.clearViewHelpInterval();
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

      if (prevState.currentViewName !== this.state.currentViewName && prevState.currentViewName) {
	 // Turn "off" the previous button
	 switch (prevState.currentViewName) {
	    case 'longitudinalView':
	       document.querySelector('.longitudinal-view-button-on').className = 'longitudinal-view-button-off';
	       break;
	    case 'compareView':
	       document.querySelector('.compare-view-button-on').className = 'compare-view-button-off';
	       break;
//	    case 'reportView':
//	       document.querySelector('.report-view-button-on').className = 'report-view-button-off';
//	       break;
	    case 'benefitsView':
	       document.querySelector('.benefits-view-button-on').className = 'benefits-view-button-off';
	       break;
	    case 'consultView':
	       document.querySelector('.consult-view-button-on').className = 'consult-view-button-off';
	       break;
	    case 'diabetesView':
	       document.querySelector('.diabetes-view-button-on').className = 'diabetes-view-button-off';
	       break;
	    case 'summaryView':
	    default:
	       document.querySelector('.default-view-button-on').className = 'default-view-button-off';
	       break;
	 }
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
	    <div className='header-menu-help'     onClick={() => this.itemClick('helpModal')}>Help</div>
	    <div className='header-menu-download' onClick={() => this.itemClick('downloadModal')}>Download</div>
	    <div className='header-menu-print'    onClick={() => this.itemClick('printModal')}>Print</div>
	 </div>
      );
   }

   viewClick(viewName) {
      // Clear previous interval if still pending
      this.clearViewHelpInterval();

      if (viewName !== this.state.currentViewName) {
	 // Clicked different view
	 this.setState( {currentViewName: viewName} );
	 this.props.viewFn(viewName);		// Let parent know which view was selected

	 // Turn "on" the appropriate button
	 switch (viewName) {
	    case 'longitudinalView':
	       document.querySelector('.longitudinal-view-button-off').className = 'longitudinal-view-button-on';
	       break;
	    case 'compareView':
	       document.querySelector('.compare-view-button-off').className = 'compare-view-button-on';
	       break;
//	    case 'reportView':
//	       document.querySelector('.report-view-button-off').className = 'report-view-button-on';
//	       break;
	    case 'benefitsView':
	       document.querySelector('.benefits-view-button-off').className = 'benefits-view-button-on';
	       break;
	    case 'consultView':
	       document.querySelector('.consult-view-button-off').className = 'consult-view-button-on';
	       break;
	    case 'diabetesView':
	       document.querySelector('.diabetes-view-button-off').className = 'diabetes-view-button-on';
	       break;
	    case 'summaryView':
	    default:
	       document.querySelector('.default-view-button-off').className = 'default-view-button-on';
	       break;
	 }

	 // Open help if closed then reset interval
	 if (!this.state.viewHelpIsOpen) {
	    this.setState( {viewHelpIsOpen: true} );
	 }
	 this.setViewHelpInterval();

      } else {
	 // Clicked same view -- toggle help
	 if (!this.state.viewHelpIsOpen) {
	    this.setViewHelpInterval();
	 }
	 this.setState( {viewHelpIsOpen: !this.state.viewHelpIsOpen} );
      }
   }

   setViewHelpInterval() {
      if (config.viewHelpCloseTime > 0) {
	 this.viewHelpInterval = setInterval(
	    () => {
	       let remaining = this.state.viewHelpRemainingTime - 1;
	       this.setState( {viewHelpRemainingTime: remaining} );
	       if (remaining === 0) {
		  this.setState( {viewHelpIsOpen: false} );
		  this.clearViewHelpInterval();
	       }
	    }, 1000);

      	 this.setState( {viewHelpRemainingTime: config.viewHelpCloseTime} );
      }
   }

   clearViewHelpInterval() {
      if (this.viewHelpInterval) {
	 clearInterval(this.viewHelpInterval);
	 this.viewHelpInterval = null;
	 this.setState( {viewHelpRemainingTime: 0} );
      }
   }

   onCloseViewHelp = this.onCloseViewHelp.bind(this);
   onCloseViewHelp() {
      this.setState( {viewHelpIsOpen: false} );
      this.clearViewHelpInterval();
   }

   get viewHelpTitle() {
      return {
//	 longitudinalView: 'Timeline',
	 longitudinalView: 'Report',
	 compareView: 'Compare',
//	 reportView: 'Report',
	 summaryView: 'Summary',
	 benefitsView: 'Financial',
	 consultView: 'Consult',
	 diabetesView: 'Diabetes'
      }
   }

   get viewHelpText() {
      return {
//	 longitudinalView: <div>The <b>Timeline</b> view shows a clickable dot for each date you have data.</div>,
	 longitudinalView: <div>The <b>Report View</b> shows your data over time or for one point in time.</div>,
	 compareView: <div>The <b>Compare View</b> shows your unique data by provider.</div>,
//	 reportView: <div>The <b>Report</b> view lists all your data in date order.</div>,
	 summaryView: <div>The <b>Summary View</b> shows an overview of your data.</div>,
	 benefitsView: <div>The <b>Financial View</b> shows your benefits and claims data over time or for one point in time.</div>,
	 consultView: <div>The <b>Consult View</b> shows a knowledge-annotated view of your conditions over time or for one point in time.</div>,
	 diabetesView: <div>The <b>Diabetes View</b> shows data specific to this condition.</div>
      };
   }

   get viewHelpIconClass() {
      return {
	 longitudinalView: 'view-help-title-longitudinal-view',
	 compareView: 'view-help-title-compare-view',
//	 reportView: 'view-help-title-report-view',
	 summaryView: 'view-help-title-default-view',
	 benefitsView: 'view-help-title-benefits-view',
	 consultView: 'view-help-title-consult-view',
	 diabetesView: 'view-help-title-diabetes-view'
      };
   }
    
   renderViewHelp() {
      return (
	 <Draggable>
	    <div className='view-help-container'>
	       <div className='view-help-title-container'>
		  <div className='view-help-title'>
		     <div className={this.viewHelpIconClass[this.state.currentViewName]}>
			{ this.viewHelpTitle[this.state.currentViewName]
			  + (config.viewHelpCloseCountdown ? ' (' + this.state.viewHelpRemainingTime + ' sec)' : '') } 
		     </div>
		     <button className='view-help-close-button' onClick={this.onCloseViewHelp} />
	          </div>
	       </div>
	       <div className='view-help-contents'>
		  { this.viewHelpText[this.state.currentViewName] }
	       </div>
	    </div>
	 </Draggable>
      );
   }

   render() {
      return (
	 <div className='page-header'>
	    <div className='logo-box'>
	       { this.state.logoClasses.map(
		   (logoClass,index) => <button className={logoClass+'-off'} key={logoClass+index} onClick={() => this.itemClick('logoModal')} /> )}
	    </div>
	    <div className='view-controls-box'>
	      <button className='longitudinal-view-button-off' onClick={() => this.viewClick('longitudinalView')}></button>
	      {/*	      <button className='report-view-button-off' onClick={() => this.viewClick('reportView')}></button> */}
	      <button className='compare-view-button-off' onClick={() => this.viewClick('compareView')}></button>
	      <button className='default-view-button-off' onClick={() => this.viewClick('summaryView')}></button>
	      <button className='benefits-view-button-off' onClick={() => this.viewClick('benefitsView')}></button>
	      <button className='consult-view-button-off' onClick={() => this.viewClick('consultView')}></button>
	      <button className='diabetes-view-button-off' onClick={() => this.viewClick('diabetesView')}></button>
	    </div>
	    { this.state.viewHelpIsOpen && this.renderViewHelp() }
	    <div className='patient-name'>
	       { this.props.resources && formatPatientName(this.props.resources.pathItem('[category=Patient].data.name')) }
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
