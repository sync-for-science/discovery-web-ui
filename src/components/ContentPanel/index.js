import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';

import './ContentPanel.css';
import config from '../../config.js';
import { inDateRange, ignoreCategories, unimplemented } from '../../util.js';
import FhirTransform from '../../FhirTransform.js';

import Allergies from '../Allergies';
import Benefits from '../Benefits';
import Claims from '../Claims';
import Conditions from '../Conditions';
import DocumentReferences from '../DocumentReferences';
import Encounters from '../Encounters';
import Exams from '../Exams';
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

import DiscoveryContext from '../DiscoveryContext';

const SET_PANEL_HEIGHT_DELAY = 250;	// msec
const CLEAR_DRAG_STATE_DELAY = 100;	// msec

//
// Render the content panel for LongitudinalView, BenefitsView
//
export default class ContentPanel extends React.Component {

   static contextType = DiscoveryContext;	// Allow the shared context to be accessed via 'this.context'

   static propTypes = {
      open: PropTypes.bool.isRequired,
      onClose: PropTypes.func.isRequired,
      context: PropTypes.shape({
	 parent: PropTypes.string.isRequired,
	 rowName: PropTypes.string.isRequired,
	 dotType: PropTypes.string.isRequired,
	 allDates: PropTypes.arrayOf(PropTypes.shape({
	    position: PropTypes.number.isRequired,
	    date: PropTypes.string.isRequired
	 })).isRequired,
	 minDate: PropTypes.string.isRequired,
	 maxDate: PropTypes.string.isRequired,
	 date: PropTypes.string.isRequired,
	 data: PropTypes.array
      }),				// required, but added dynamically by StandardFilters
      catsEnabled: PropTypes.object.isRequired,
      provsEnabled: PropTypes.object.isRequired,
      nextPrevFn: PropTypes.func,	// required, but added dynamically by StandardFilters
      thumbLeftDate: PropTypes.string.isRequired,
      thumbRightDate: PropTypes.string.isRequired,
      viewName: PropTypes.string.isRequired,
      resources: PropTypes.instanceOf(FhirTransform),
      catsToDisplay: PropTypes.arrayOf(PropTypes.string),
      showAllData: PropTypes.bool,
      showAllFn: PropTypes.func		// added dynamically by StandardFilters
   }

   state = {
      isOpen: false,
      windowHeight: window.innerHeight,
      topBound: 0,
      bottomBound: 0,
      positionY: 0,
      panelHeight: 0,
      dragging: false,
      lastDragUpdateTimestamp: 0,
      prevEnabled: true,
      nextEnabled: true,
      annunciator: null,
      showAllData: this.props.showAllData ? true : false,
      showDotLines: true,
      trimLevel: 'none',
      trimLevelDirection: 'more',
      showJSON: false
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

   setPanelHeight() {
      setTimeout(() => this.setState({ panelHeight: this.calcHeight() }), SET_PANEL_HEIGHT_DELAY);	// Wait a bit before setting final panel height
   }

   calcTopBound() {
      const headerTop = document.querySelector('.time-widget').getBoundingClientRect().top;
//      const targetTop = document.querySelector('.standard-filters-category-nav-spacer-top').getBoundingClientRect().top;
      const targetTop = document.querySelector('.standard-filters-categories-and-providers').getBoundingClientRect().top;
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
	 this.setPanelHeight();
      }
   }

   //
   // End external div location section
   //

   onDrag = (e, data) => {
      if (e.timeStamp - this.state.lastDragUpdateTimestamp > config.contentPanelDragUpdateInterval) {
	 this.setState({ dragging: true,
			 lastDragUpdateTimestamp: e.timeStamp,
			 positionY: data.y,
			 panelHeight: this.calcHeight() });
      }
   }

   onDragStop = (e, data) => {
      setTimeout(() => this.setState({ dragging: false }), CLEAR_DRAG_STATE_DELAY);	// Wait a bit before clearing drag state
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

      if (this.props.showAllFn && prevState.showAllData !== this.state.showAllData) {
	 this.props.showAllFn(this.state.showAllData);
      }
   }

//   onClose = this.onClose.bind(this);
//   onClose() {
//      this.setState({ isOpen:false, annunciator: null });
//      this.props.onClose();
//   }

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
      let testCat = ignoreCategories().includes(cat) ? unimplemented() : cat;	// Map unimplemented categories to the "Not in S4S" meta-category
      return this.props.catsEnabled[testCat] === undefined || this.props.catsEnabled[testCat];
   }

   onShowHideLines = this.onShowHideLines.bind(this);
   onShowHideLines() {
      if (this.state.showDotLines) {
	 // Hide dot lines
	 this.setState({ showDotLines: !this.state.showDotLines,
			 positionY: this.state.topBound });
	 this.setPanelHeight();
      } else {
	 // Show dot lines
	 this.setState({ showDotLines: !this.state.showDotLines });
      }
   }

   onDoubleClick = this.onDoubleClick.bind(this);
   onDoubleClick() {
      // Reset panel position
      this.setState({ positionY: this.state.topBound });
      this.setPanelHeight();
   }

   copyReverse(arr) {
      let revArr = [];	
      for (let i = arr.length-1; i>=0; i--) {
	  revArr.push(arr[i]);
      }
      return revArr;
   }

   renderDotOrAll() {
//     let dates = this.state.showAllData ? (this.context.searchRefs.length > 0 ? this.context.searchRefs : this.props.context.allDates).filter(elt =>
      let dates = this.state.showAllData ? (this.context.searchRefs.length > 0 ? this.context.searchRefs : this.copyReverse(this.props.context.allDates)).filter(elt =>
										   inDateRange(elt.date, this.props.thumbLeftDate, this.props.thumbRightDate))
					 : this.props.context.allDates.filter(elt => elt.date === this.props.context.date);
      let showDate = this.state.showAllData;

      let limitedResources = this.props.catsToDisplay ? this.props.resources.transformed.filter(elt => this.props.catsToDisplay.includes(elt.category))
						      : this.props.resources.transformed;
      let divs = [];
      for (let thisDate of dates) {
//	 let res = this.props.resources.pathItem(`[*itemDate=${thisDate.date}]`);
	 let res = limitedResources.filter(elt => elt.itemDate === thisDate.date && (this.catEnabled(elt.category) || this.context.trimLevel === 'none'));
	 if (res.length > 0) {
	    divs = divs.concat([
	       <Allergies           className='allergies'      key={divs.length+1}  data={res} showDate={showDate} isEnabled={this.catEnabled('Allergies')} />,
	       <Benefits	    className='benefits'       key={divs.length+2}  data={res} showDate={showDate} isEnabled={this.catEnabled('Benefits')} />,
	       <Claims		    className='claims'         key={divs.length+3}  data={res} showDate={showDate} isEnabled={this.catEnabled('Claims')} />,
	       <Conditions          className='conditions'     key={divs.length+4}  data={res} showDate={showDate} isEnabled={this.catEnabled('Conditions')} />,
	       <DocumentReferences  className='doc-refs'       key={divs.length+5}  data={res} showDate={showDate} isEnabled={this.catEnabled('Document References')} />,
	       <Encounters          className='encounters'     key={divs.length+6}  data={res} showDate={showDate} isEnabled={this.catEnabled('Encounters')} />,
	       <Exams               className='exams'          key={divs.length+7}  data={res} showDate={showDate} isEnabled={this.catEnabled('Exams')} />,
	       <Immunizations       className='immunizations'  key={divs.length+8}  data={res} showDate={showDate} isEnabled={this.catEnabled('Immunizations')} />,
	       <LabResults          className='lab-results'    key={divs.length+9}  data={res} showDate={showDate} isEnabled={this.catEnabled('Lab Results')}
		    resources={this.props.resources} />,
	       <MedsAdministration  className='meds-admin'     key={divs.length+10} data={res} showDate={showDate} isEnabled={this.catEnabled('Meds Administration')} />,
	       <MedsDispensed       className='meds-dispensed' key={divs.length+11} data={res} showDate={showDate} isEnabled={this.catEnabled('Meds Dispensed')} />,
	       <MedsRequested       className='meds-requested' key={divs.length+12} data={res} showDate={showDate} isEnabled={this.catEnabled('Meds Requested')} />,
	       <MedsStatement       className='meds-statement' key={divs.length+13} data={res} showDate={showDate} isEnabled={this.catEnabled('Meds Statement')} />,
	       <Procedures          className='procedures'     key={divs.length+14} data={res} showDate={showDate} isEnabled={this.catEnabled('Procedures')} />,
	       <SocialHistory       className='social-history' key={divs.length+15} data={res} showDate={showDate} isEnabled={this.catEnabled('Social History')} />,
	       <VitalSigns          className='vital-signs'    key={divs.length+16} data={res} showDate={showDate} isEnabled={this.catEnabled('Vital Signs')}
		    resources={this.props.resources} />,
	       <Unimplemented	    className='unimplemented'  key={divs.length+17} data={res} showDate={showDate} isEnabled={this.catEnabled(unimplemented())} />
	    ]);
	 }
      }

      if (divs.length === 0) {
	 divs.push(<div className='content-panel-no-data' key='1'>[No matching data]</div>);
      }

      return (
	 <div className='content-panel-inner-body'>
	    { this.state.showJSON ? 
		<pre className='content-panel-data'>
		   { JSON.stringify(this.state.showAllData ? this.props.resources.transformed : this.props.context.data, null, 3) }
		</pre>
	      : divs }
	 </div>
      );
   }

   changeTrimLevel = this.changeTrimLevel.bind(this);
   changeTrimLevel() {
      switch(this.state.trimLevel) {
	 case 'expected':
	    this.state.trimLevelDirection === 'more' ? this.setState({ trimLevel: 'max', trimLevelDirection: 'less' })
						     : this.setState({ trimLevel: 'none', trimLevelDirection: 'more' });
	    break;

	 default:
	 case 'max':
	 case 'none':
	    this.setState({ trimLevel: 'expected' });
	    break;
      }	   
   }

   renderContents(context) {
//      let birthDate = this.props.resources.pathItem('[category=Patient].data.birthDate');
      return (
	 <div className='content-panel-inner'>
	    <div className='content-panel-inner-title'>
	       <div className='content-panel-inner-title-left'>
		  <div className='content-panel-view-name'>{this.props.viewName}</div>
		  <button className={'content-panel-left-button' + (this.state.prevEnabled ? '' : '-off')}
			  onClick={() => this.onNextPrev('prev')} />
	       	  <button className={'content-panel-right-button' + (this.state.nextEnabled ? '' : '-off')}
			  onClick={() => this.onNextPrev('next')} />
	       	  <button className={this.state.showAllData ? 'content-panel-all-button' : 'content-panel-dot-button'}
			  onClick={() => this.setState( {showAllData: !this.state.showAllData} )} />
		  <button className={`content-panel-trim-${this.state.trimLevel}-button`} onClick={this.changeTrimLevel} />
		  <button className={'content-panel-json-button' + (this.state.showJSON ? '' : '-off')}
			  onClick={() => this.setState( {showJSON: !this.state.showJSON} )} >  
		     {'{;}'}
		  </button>
	       </div>
	       <div className='content-panel-inner-title-center' onDoubleClick={this.onDoubleClick}>
		  <button className={this.state.showDotLines ? 'content-panel-drag-button' : 'content-panel-no-drag-button'} />
		  { this.state.annunciator && <div className='content-panel-annunciator'>{this.state.annunciator}</div> }
	       </div>
	       <div className='content-panel-inner-title-right'>
		  {/* <button className='content-panel-inner-title-close-button' onClick={this.onClose} /> */}
	       </div>
	    </div>
	    { this.renderDotOrAll() }
	 </div>
      );
   }

   render() {
      // Extend DiscoveryContext with trimLevel (currently works / simpler than reassigning the extended context to DiscoveryContext.Provider)
      this.context.trimLevel = this.state.trimLevel;

      // Dragging enabled/disabled by changing bounds.bottom
      return ( this.state.isOpen &&
	       <Draggable axis='y' position={{x:0, y:this.state.positionY}} handle='.content-panel-inner-title-center'
			  bounds={{top:this.state.topBound, bottom:this.state.showDotLines ? this.state.bottomBound : this.state.topBound}}
			  onDrag={this.onDrag} onStop={this.onDragStop}>
	          <div className='content-panel' style={this.state.panelHeight ? {height:this.state.panelHeight} : {}}>
	             { this.renderContents(this.props.context) }
	          </div>
	       </Draggable>
      )
   }
}
