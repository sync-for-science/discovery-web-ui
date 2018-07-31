import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import Modal from 'react-responsive-modal';
import moment from 'moment';

import './ContentPanel.css';
import { getStyle } from '../../util.js';
import VitalSigns from '../VitalSigns';
import Conditions from '../Conditions';
import LabResults from '../LabResults';
import MedsRequested from '../MedsRequested';
import MedsDispensed from '../MedsDispensed';
import Immunizations from '../Immunizations';
import Allergies from '../Allergies';
import Procedures from '../Procedures';

//
// Render the content panel of ParticipantDetail page
//
export default class ContentPanel extends Component {

   static propTypes = {
      open: PropTypes.bool.isRequired,
      onClose: PropTypes.func.isRequired,
      contentType: PropTypes.string.isRequired,
      context: PropTypes.shape({
	 parent: PropTypes.string.isRequired,
	 rowName: PropTypes.string.isRequired,
	 dotType: PropTypes.string.isRequired,
	 date: PropTypes.string.isRequired,
	 data: PropTypes.array
      })
   }

   state = {
      isOpen: false,
      windowHeight: window.innerHeight,
      topBound: 0,
      positionY: 0,
      panelWidth: 0,
      payloadModalIsOpen: false
   }

   // Kluge: this function violates locality/independence by needing to know absolute locations of various divs
   updateDraggableOnMount = () => {
      const footer = document.querySelector('.page-footer');
      const header = document.querySelector('.page-header');
      const categories = document.querySelector('.categories');
      const headerBorder = header ? parseInt(getStyle(header, 'border-bottom-width'), 10) : 0;
      const svg = document.querySelector('.category-rollup-svg-container');

      this.setState( { topBound: footer ? header.getBoundingClientRect().bottom - footer.getBoundingClientRect().top - headerBorder : 0,
		       positionY:  footer ? categories.getBoundingClientRect().top - footer.getBoundingClientRect().top - headerBorder : 0,
		       panelWidth: getStyle(svg, 'width') });
   }

   // Kluge: this function violates locality/independence by needing to know absolute locations of various divs
   updateDraggableOnResize = this.updateDraggableOnResize.bind(this);
   updateDraggableOnResize() {
      const footer = document.querySelector('.page-footer');
      const header = document.querySelector('.page-header');
      const headerBorderWidth = header ? parseInt(getStyle(header, 'border-bottom-width'), 10) : 0;
      const windowHeightDelta = window.innerHeight - this.state.windowHeight;
      const svg = document.querySelector('.category-rollup-svg-container');

      this.setState( { windowHeight: window.innerHeight,
		       topBound: footer ? header.getBoundingClientRect().bottom - footer.getBoundingClientRect().top - headerBorderWidth : 0,
		       positionY: this.state.positionY - windowHeightDelta,
		       panelWidth: getStyle(svg, 'width') });
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
      this.setState({ isOpen: false });
      this.props.onClose(this.props.contentType);
   }

   renderDotClickContents(context) {
      return (
	 <div className='content-panel-inner'>
	    <div className='content-panel-inner-title'>
	       <button className='content-panel-inner-title-payload-button' onClick={() => this.setState({payloadModalIsOpen: true})}>
	          { `Participant Data for ${context.date.replace(/T/g, ' at ')}` }
	       </button>
	       <button className='content-panel-inner-title-close-button' onClick={this.onClose} />
	    </div>
	    <VitalSigns className='vital-signs' data={context.data}/>
	    <Conditions className='conditions' data={context.data}/>
	    <LabResults className='lab-results' data={context.data}/>
	    <MedsRequested className='meds-requested' data={context.data}/>
	    <MedsDispensed className='meds-dispensed' data={context.data}/>
	    <Immunizations className='immunizations' data={context.data}/>
	    <Allergies className='allergies' data={context.data}/>
	    <Procedures className='procedures' data={context.data}/>
	    <Modal open={this.state.payloadModalIsOpen} onClose={() => this.setState({payloadModalIsOpen: false})}>
	       <pre>
	          { JSON.stringify(context.data, null, 3) }
	       </pre>
	    </Modal>
	 </div>
      );
   }

   renderPepContents(context) {
      return (
	 <div className='content-panel-inner'>
	    <div className='content-panel-inner-title-quick-looks'>
	       <div className="content-panel-inner-title-search-text">Quick Looks <span className="content-panel-search-header-italic">– Planned Feature</span></div>
	       <button className='content-panel-inner-title-close-button' onClick={this.onClose} />
	    </div>
	    <div className='content-panel-inner-body'>
	       	<div className="content-panel-search-row">
				<div className="content-panel-quick-looks-button">Categories</div>
				<div className="content-panel-quick-looks-button">Providers</div>
				<div className="content-panel-quick-looks-button">Date Range</div>
			</div>
			<div className="content-panel-quick-looks-text-block">
				<p><span className="content-panel-quick-looks-text-bold">Quick Looks</span> present several predefined views of data accessible via Discovery.</p>
				<p>We expect to consider the following types of screens:</p>
				<ul>
					<li>Comparison of data across providers</li>
					<li>Last viewed/ Last received / Newest / Most viewed data</li>
					<li>Targeted lists of Procedures / Medications / Allergies by provider</li>
					<li>Laboratory results of in/out of range as reported by the labs</li>
					<li>Demographic data-driven presentation of national guidelines</li>
				</ul>
				<p>We will explore having options to:</p>
				<ul>
					<li>respect or ignore current category, provider, timeline filter settings</li>
					<li>print and download any Quick-Look panel</li>
				</ul>
			</div>
	    </div>
	    <div className='content-panel-inner-footer'>
	      
	    </div>
	 </div>
      );
   }

   renderSearchContents(context) {
      return (
	 <div className='content-panel-inner'>
	    <div className='content-panel-inner-title-search'>
	       <div className="content-panel-inner-title-search-text">Search <span className="content-panel-search-header-italic">– Planned Feature</span></div>
	       <button className='content-panel-inner-title-close-button' onClick={this.onClose} />
	    </div>
	    <div className='content-panel-inner-body'>
			<div className="content-panel-search-row">
				<div className="content-panel-search-button">Categories</div>
				<div className="content-panel-search-button">Providers</div>
				<div className="content-panel-search-button">Date Range</div>
			</div>
			<div className="content-panel-search-row">
				<div className="content-panel-search-field">search string, e.g., HDL 2018</div>
				<div className="content-panel-search-field-button">Search</div>
			</div>
			<div className="content-panel-search-text-block">
	       		<p><span className="content-panel-search-text-bold">Search</span> supports searching for data by criteria in Discovery.</p>
				<p>We expect to support searching for specific data</p>
				<ul>
					<li>
						accepting free text input to find data with values, e.g., “HDL” allowing sub-selecting within or across usual filters
					</li>
					<li>
						respecting or overriding current category, provider, timeline filter settings
					</li>
				</ul>
				<p>We will explore having options to:</p>
				<ul>
					<li>breadcrumbing past searches, e.g., a la browser history</li>
					<li>enabling “favoriting” of the search string</li>
					<li>selecting corresponding timeline dots</li>
					<li>downloading and printing search-specified data</li>
				</ul>
			</div>
	    </div>
	    <div className='content-panel-inner-footer'>
	      
	    </div>
	 </div>
      );
   }

   renderContents(context) {
      switch (this.props.contentType) {
	 case 'dotclick':
	    return this.renderDotClickContents(context);			   
	 case 'pep':
	    return this.renderPepContents(context);
	 case 'search':
	    return this.renderSearchContents(context);
	 default:
	    return '?????';
      }
   }

   render() {
      return ( this.state.isOpen &&
	       <Draggable axis='y' position={{x:0, y:this.state.positionY}} bounds={{top:this.state.topBound, bottom:0}} onStop={this.onDragStop}>
	          <div className='content-panel' style={{width:this.state.panelWidth}}>
		     <div className='content-panel-left'>
			<button className='content-panel-left-button'/>
		     </div>
		     { this.renderContents(this.props.context) }
		     <div className='content-panel-right'>
			<button className='content-panel-right-button'/>
		     </div>
	          </div>
	       </Draggable>
      )
   }
}
