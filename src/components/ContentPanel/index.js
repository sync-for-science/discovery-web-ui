import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import Modal from 'react-responsive-modal';

import './ContentPanel.css';
import { getStyle, formatDate } from '../../util.js';

import Allergies from '../Allergies';
import Conditions from '../Conditions';
import DocumentReferences from '../DocumentReferences';
import Immunizations from '../Immunizations';
import LabResults from '../LabResults';
import MedsAdministration from '../MedsAdministration';
import MedsDispensed from '../MedsDispensed';
import MedsRequested from '../MedsRequested';
import MedsStatement from '../MedsStatement';
import Procedures from '../Procedures';
import SocialHistory from '../SocialHistory';
import VitalSigns from '../VitalSigns';


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
	 minDate: PropTypes.string.isRequired,
	 maxDate: PropTypes.string.isRequired,
	 date: PropTypes.string.isRequired,
	 data: PropTypes.array
      }),
      nextPrevFn: PropTypes.func.isRequired,
      catsEnabled: PropTypes.object.isRequired,
      provsEnabled: PropTypes.object.isRequired
   }

   state = {
      isOpen: false,
      windowHeight: window.innerHeight,
      topBound: 0,
      positionY: 0,
      panelWidth: 0,
      dragging: false,
      payloadModalIsOpen: false,
      prevEnabled: true,
      nextEnabled: true,
      annunciator: null
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

   onDragStart = (e, data) => {
      this.setState({ dragging: true });
   }

   onDragStop = (e, data) => {
      this.setState({ positionY: data.y });
      setTimeout(() => this.setState({ dragging: false }), 250);	// Wait a bit before clearing drag state
   }

   onKeydown = (event) => {
      if (this.state.isOpen && event.key === 'ArrowLeft') {
	 this.onNextPrev('prev');
      } else if (this.state.isOpen && event.key === 'ArrowRight') {
	 this.onNextPrev('next');
      } else if (this.state.isOpen && event.key === 'Escape') {
	 this.onClose();
      }
   }

   componentDidMount() {
      this.updateDraggableOnMount();
      window.addEventListener('resize', this.updateDraggableOnResize);
      window.addEventListener('keydown', this.onKeydown);
   }

   componentWillUnmount() {
      window.removeEventListener('resize', this.updateDraggableOnResize);
      window.removeEventListener('keydown', this.onKeydown);
   }

   componentDidUpdate(prevProps, prevState) {
      if (!prevProps.open && this.props.open) {
	 this.setState({ isOpen: true });
      } 
      if (prevProps.context !== this.props.context) {
	 this.setState({ prevEnabled: this.props.context.date !== this.props.context.minDate,
			 nextEnabled: this.props.context.date !== this.props.context.maxDate });
      }
      if (this.props.open && this.props.catsEnabled !== prevProps.catsEnabled) {
	 this.setState({ annunciator: 'Categories changed' });
      }

   }

   onClose = this.onClose.bind(this);
   onClose() {
      this.setState({ isOpen:false, annunciator: '' });
      this.props.onClose(this.props.contentType);
   }

   onNextPrev = this.onNextPrev.bind(this);
   onNextPrev(direction) {
      const enabled = this.props.nextPrevFn(direction);
      if (direction === 'prev') {
	 this.setState({prevEnabled: enabled, nextEnabled: true, annunciator: ''});
      } else {
	 this.setState({prevEnabled: true, nextEnabled: enabled, annunciator: ''});
      }
   }

   renderDotClickContents(context) {
      return (
	 <div className='content-panel-inner'>
	    <div className='content-panel-inner-title'>
	       <button className='content-panel-inner-title-payload-button' onClick={() => !this.state.dragging && this.setState({payloadModalIsOpen: true})}>
		  { formatDate(context.date, false, false) }
	       </button>
	       { this.state.annunciator && <div className='content-panel-annunciator'>{this.state.annunciator}</div> }
	       <button className='content-panel-inner-title-close-button' onClick={this.onClose} />
	    </div>
	    <div className='content-panel-inner-body'>
	       <Allergies          className='allergies'      data={context.data} isEnabled={this.props.catsEnabled['Allergies']} />
	       <Conditions         className='conditions'     data={context.data} isEnabled={this.props.catsEnabled['Conditions']} />
	       <DocumentReferences className='doc-refs'       data={context.data} isEnabled={this.props.catsEnabled['Document References']} />
	       <Immunizations      className='immunizations'  data={context.data} isEnabled={this.props.catsEnabled['Immunizations']} />
	       <LabResults         className='lab-results'    data={context.data} isEnabled={this.props.catsEnabled['Lab Results']} />
	       <MedsAdministration className='meds-admin'     data={context.data} isEnabled={this.props.catsEnabled['Meds Administration']} />
	       <MedsDispensed      className='meds-dispensed' data={context.data} isEnabled={this.props.catsEnabled['Meds Dispensed']} />
	       <MedsRequested      className='meds-requested' data={context.data} isEnabled={this.props.catsEnabled['Meds Requested']} />
	       <MedsStatement      className='meds-statement' data={context.data} isEnabled={this.props.catsEnabled['Meds Statement']} />
	       <Procedures         className='procedures'     data={context.data} isEnabled={this.props.catsEnabled['Procedures']} />
	       <SocialHistory      className='social-history' data={context.data} isEnabled={this.props.catsEnabled['Social History']} />
	       <VitalSigns         className='vital-signs'    data={context.data} isEnabled={this.props.catsEnabled['Vital Signs']} />

	       <Modal open={this.state.payloadModalIsOpen} onClose={() => this.setState({payloadModalIsOpen: false})}>
	          <pre className='content-panel-data'>
	             { JSON.stringify(context.data, null, 3) }
	          </pre>
	       </Modal>
	    </div>
	 </div>
      );
   }

   renderContents(context) {
      switch (this.props.contentType) {
	 case 'dotclick':
	    return this.renderDotClickContents(context);			   
	 default:
	    return '?????';
      }
   }

   render() {
      return ( this.state.isOpen &&
	       <Draggable axis='y' position={{x:0, y:this.state.positionY}} handle='.content-panel-inner-title'
			  bounds={{top:this.state.topBound, bottom:0}} onDrag={this.onDragStart} onStop={this.onDragStop}>
	          <div className='content-panel' style={{width:this.state.panelWidth}}>
		     <div className='content-panel-left'>
			<button className={'content-panel-left-button'+(this.state.prevEnabled ? '' : '-off')} onClick={() => this.onNextPrev('prev')} />
			<button className={'content-panel-right-button'+(this.state.nextEnabled ? '' : '-off')} onClick={() => this.onNextPrev('next')} />
		     </div>
		     { this.renderContents(this.props.context) }
	          </div>
	       </Draggable>
      )
   }
}
