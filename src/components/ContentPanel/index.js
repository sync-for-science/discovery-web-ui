import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import Modal from 'react-responsive-modal';

import './ContentPanel.css';
import { formatDate, formatAge, unimplemented } from '../../util.js';
import FhirTransform from '../../FhirTransform.js';

import Allergies from '../Allergies';
import Conditions from '../Conditions';
import DocumentReferences from '../DocumentReferences';
import Benefits from '../Benefits';
import Immunizations from '../Immunizations';
import LabResults from '../LabResults';
import MedsAdministration from '../MedsAdministration';
import MedsDispensed from '../MedsDispensed';
import MedsRequested from '../MedsRequested';
import MedsStatement from '../MedsStatement';
import Procedures from '../Procedures';
import SocialHistory from '../SocialHistory';
import VitalSigns from '../VitalSigns';
import Unimplemented from '../Unimplemented';


//
// Render the content panel of ParticipantDetail page
//
export default class ContentPanel extends Component {

   static propTypes = {
      open: PropTypes.bool.isRequired,
      onClose: PropTypes.func.isRequired,
      context: PropTypes.shape({
	 parent: PropTypes.string.isRequired,
	 rowName: PropTypes.string.isRequired,
	 dotType: PropTypes.string.isRequired,
	 minDate: PropTypes.string.isRequired,
	 maxDate: PropTypes.string.isRequired,
	 date: PropTypes.string.isRequired,
	 data: PropTypes.array
      }),				// required, but added dynamically by StandardFilters
      catsEnabled: PropTypes.object.isRequired,
      provsEnabled: PropTypes.object.isRequired,
      nextPrevFn: PropTypes.func,	// required, but added dynamically by StandardFilters
      resources: PropTypes.instanceOf(FhirTransform)
   }

   state = {
      isOpen: false,
      windowHeight: window.innerHeight,
      topBound: 0,
      bottomBound: 0,
      positionY: 0,
      panelHeight: 0,
      dragging: false,
      payloadModalIsOpen: false,
      prevEnabled: true,
      nextEnabled: true,
      annunciator: null
   }

   //
   // Kluge: following functions violate locality/independence by needing to know absolute locations of divs in other components
   //
   calcHeight() {
      const footer = document.querySelector('.page-footer');
      const panel = document.querySelector('.content-panel');
      const titleBarHeight = document.querySelector('.content-panel-inner-title').getBoundingClientRect().height;

      return Math.max(titleBarHeight, footer.getBoundingClientRect().top - panel.getBoundingClientRect().top - 5);
   }

   calcTopBound() {
      const headerTop = document.querySelector('.time-widget').getBoundingClientRect().top;
//      const targetTop = document.querySelector('.longitudinal-view-category-nav-spacer-top').getBoundingClientRect().top;
      const targetTop = document.querySelector('.longitudinal-view-categories-and-providers').getBoundingClientRect().top;
      return targetTop - headerTop;
   }

   calcBottomBound() {
      const footTop = document.querySelector('.page-footer').getBoundingClientRect().top;
      const headerBot = document.querySelector('.time-widget').getBoundingClientRect().bottom;
      return footTop - headerBot + 26;
   }

   updateDraggableOnMount = () => {
      const topBound = this.calcTopBound();

      this.setState( { topBound: topBound,
		       positionY: topBound,
		       bottomBound: this.calcBottomBound() });
   }

   updateDraggableOnResize = this.updateDraggableOnResize.bind(this);
   updateDraggableOnResize() {
      this.setState( { topBound: this.calcTopBound(),
		       bottomBound: this.calcBottomBound(),
		       windowHeight: window.innerHeight });

      if (this.state.isOpen) {
	 setTimeout(() => this.setState({ panelHeight: this.calcHeight() }), 250);	// Wait a bit before setting final panel height
      }
   }

   //
   // End external div location section
   //

   onDragStart = (e, data) => {
      this.setState({ dragging: true });
   }

   onDragStop = (e, data) => {
      this.setState({ positionY: data.y,
		      panelHeight: this.calcHeight() });

      setTimeout(() => this.setState({ dragging: false }), 250);	// Wait a bit before clearing drag state
   }

   onKeydown = (event) => {
      if (this.state.isOpen && event.key === 'ArrowLeft') {
	 this.onNextPrev('prev');
      } else if (this.state.isOpen && event.key === 'ArrowRight') {
	 this.onNextPrev('next');
//      } else if (this.state.isOpen && event.key === 'Escape') {
//	 this.onClose();
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
	 this.setState({ isOpen: true }, () => this.setState({ panelHeight: this.calcHeight() }) );
      } 

      if (prevProps.context !== this.props.context) {
	 this.setState({ prevEnabled: this.props.context.date !== this.props.context.minDate,
			 nextEnabled: this.props.context.date !== this.props.context.maxDate });
      }

//      if (this.props.open && this.props.catsEnabled !== prevProps.catsEnabled) {
//	 this.setState({ annunciator: 'Categories changed' });
//      }

      if (this.props.open && this.props.context !== prevProps.context) {
	 this.setState({ annunciator: null });
      }
   }

   onClose = this.onClose.bind(this);
   onClose() {
      this.setState({ isOpen:false, annunciator: null });
      this.props.onClose();
   }

   onNextPrev = this.onNextPrev.bind(this);
   onNextPrev(direction) {
      try {
	 const enabled = this.props.nextPrevFn(direction);
	 if (direction === 'prev') {
	    this.setState({prevEnabled: enabled, nextEnabled: true, annunciator: null});
	 } else {
	    this.setState({prevEnabled: true, nextEnabled: enabled, annunciator: null});
	 }
      } catch (e) {
	 console.log(`ContentPanel: ${e.message}`);
      }
   }

   catEnabled(cat) {
      return this.props.catsEnabled[cat] === undefined || this.props.catsEnabled[cat];
   }

   renderContents(context) {
      let birthDate = this.props.resources.pathItem('[category=Patient].data.birthDate');
      return (
	 <div className='content-panel-inner'>
	    <div className='content-panel-inner-title'>
	      		<div className='content-panel-view-name'>Timeline</div>
			<button className={'content-panel-left-button'+(this.state.prevEnabled ? '' : '-off')} onClick={() => this.onNextPrev('prev')} />
			<button className={'content-panel-right-button'+(this.state.nextEnabled ? '' : '-off')} onClick={() => this.onNextPrev('next')} />
	       <button className='content-panel-inner-title-payload-button' onClick={() => !this.state.dragging && this.setState({payloadModalIsOpen: true})}>
	          { formatDate(context.date, false, false) + ' / ' + formatAge(birthDate, context.date, ' at ') }
	       </button>
	       { this.state.annunciator && <div className='content-panel-annunciator'>{this.state.annunciator}</div> }
	  {/*	       <button className='content-panel-inner-title-close-button' onClick={this.onClose} /> */}
	    </div>
	    <div className='content-panel-inner-body'>
	       <Allergies           className='allergies'      data={context.data} isEnabled={this.catEnabled('Allergies')} />
	       <Benefits            className='benefits'       data={context.data} isEnabled={this.catEnabled('Benefits')} />
	       <Conditions          className='conditions'     data={context.data} isEnabled={this.catEnabled('Conditions')} />
	       <DocumentReferences  className='doc-refs'       data={context.data} isEnabled={this.catEnabled('Document References')} />
	       <Immunizations       className='immunizations'  data={context.data} isEnabled={this.catEnabled('Immunizations')} />
	       <LabResults          className='lab-results'    data={context.data} isEnabled={this.catEnabled('Lab Results')}
		    resources={this.props.resources} />
	       <MedsAdministration  className='meds-admin'     data={context.data} isEnabled={this.catEnabled('Meds Administration')} />
	       <MedsDispensed       className='meds-dispensed' data={context.data} isEnabled={this.catEnabled('Meds Dispensed')} />
	       <MedsRequested       className='meds-requested' data={context.data} isEnabled={this.catEnabled('Meds Requested')} />
	       <MedsStatement       className='meds-statement' data={context.data} isEnabled={this.catEnabled('Meds Statement')} />
	       <Procedures          className='procedures'     data={context.data} isEnabled={this.catEnabled('Procedures')} />
	       <SocialHistory       className='social-history' data={context.data} isEnabled={this.catEnabled('Social History')} />
	       <VitalSigns          className='vital-signs'    data={context.data} isEnabled={this.catEnabled('Vital Signs')}
		    resources={this.props.resources} />
	       <Unimplemented	    className='unimplemented'  data={context.data} isEnabled={this.catEnabled(unimplemented())} />

	       <Modal open={this.state.payloadModalIsOpen} onClose={() => this.setState({payloadModalIsOpen: false})}>
	          <pre className='content-panel-data'>
	             { JSON.stringify(context.data, null, 3) }
	          </pre>
	       </Modal>
	    </div>
	 </div>
      );
   }

   render() {
      // Dragging disabled by changing bounds.bottom to topBound (was bottomBound)
      return ( this.state.isOpen &&
	       <Draggable axis='y' position={{x:0, y:this.state.positionY}} handle='.content-panel-inner-title'
			  bounds={{top:this.state.topBound, bottom:this.state.topBound}} onDrag={this.onDragStart} onStop={this.onDragStop}>
	          <div className='content-panel' style={this.state.panelHeight ? {height:this.state.panelHeight}
									       : {}}>
		     { this.renderContents(this.props.context) }
	          </div>
	       </Draggable>
      )
   }
}
