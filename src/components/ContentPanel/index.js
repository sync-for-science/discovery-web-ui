import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';

import './ContentPanel.css';
import config from '../../config.js';
import { Const, stringCompare, formatKeyDate, formatDPs, notEqJSON, logDiffs, classFromCat, groupBy } from '../../util.js';
//import { formatPatientName } from '../../fhirUtil.js';
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

//
// Render the content panel for ReportView, FinancialView, TilesView
//
// NOTE: This would be much simplified by use of a functioning virtual list that
//       supports variable height elements, e.g. (when finished):
//       https://github.com/bvaughn/react-window/issues/6
//
export default class ContentPanel extends React.Component {

   static myName = 'ContentPanel';

   static contextType = DiscoveryContext;	// Allow the shared context to be accessed via 'this.context'

   static propTypes = {
      open: PropTypes.bool.isRequired,
      onClose: PropTypes.func,
      context: PropTypes.shape({
	 parent: PropTypes.string,
	 rowName: PropTypes.string,
	 dotType: PropTypes.string,
	 allDates: PropTypes.arrayOf(PropTypes.shape({
	    position: PropTypes.number,
	    date: PropTypes.string
	 })),
	 minDate: PropTypes.string,
	 maxDate: PropTypes.string,
	 startDate: PropTypes.string,
	 endDate: PropTypes.string,
	 date: PropTypes.string,
	 data: PropTypes.array
      }),				// added dynamically by StandardFilters
      catsEnabled: PropTypes.object.isRequired,
      provsEnabled: PropTypes.object.isRequired,
      nextPrevFn: PropTypes.func,	// added dynamically by StandardFilters
      thumbLeftDate: PropTypes.string.isRequired,
      thumbRightDate: PropTypes.string.isRequired,
      viewName: PropTypes.string.isRequired,
      viewIconClass: PropTypes.string.isRequired,
      resources: PropTypes.instanceOf(FhirTransform),
      totalResCount: PropTypes.number,
      catsToDisplay: PropTypes.arrayOf(PropTypes.string),
      showAllData: PropTypes.bool,
//      showAllFn: PropTypes.func,	// added dynamically by StandardFilters
      dotClickFn: PropTypes.func,
      initialTrimLevel: PropTypes.string,
      containerClassName: PropTypes.string.isRequired,
      topBoundFn: PropTypes.func.isRequired,
      bottomBoundFn: PropTypes.func.isRequired,
      initialPositionYFn: PropTypes.func,
      onResizeFn: PropTypes.func,
      tileSort: PropTypes.bool,		// true --> "tile order sort", else default "report order sort"
      noResultDisplay: PropTypes.string
   }

   state = {
      isOpen: false,
      windowHeight: window.innerHeight,		// Height of rendered area of the browser window
      positionY: 0,
      panelHeight: 0,				// Height of XXX
      dragging: false,
      lastDragUpdateTimestamp: 0,
      prevEnabled: true,
      nextEnabled: true,
      annunciator: null,
//      showAllData: false,
      showAllData: true,
      showDotLines: true,
      trimLevel: this.props.initialTrimLevel ? this.props.initialTrimLevel : Const.trimNone,
//      trimLevelDirection: 'more',
      showJSON: false,
      showAnnotation: false,
      displayVer: 0,
      scrollFraction: 0,			// Scroll thumb location
      scrollHeight: 0,				// Height of content-panel-inner-body-scroller div
      currResources: null,
      contentHeight: 0,				// Height of content-panel-inner-body div
      initialPositionYFn: null,
      datesAscending: false			// display dates in ascending order?
   }

   //
   // Kluge: following functions violate locality/independence by needing to know absolute locations of divs in other components
   //
   calcHeight() {
      const footer = document.querySelector('.page-footer');
      const panel = document.querySelector('.' + this.props.containerClassName);
      const titleBar = document.querySelector('.content-panel-inner-title')
      const titleBarHeight = titleBar ? titleBar.clientHeight : 0;

      return Math.max(titleBarHeight, footer.getBoundingClientRect().top - panel.getBoundingClientRect().top - 5);
   }

   calcContentHeight() {
//      let innerContent = document.querySelector(this.state.displayVer === 1 ? '.content-panel-inner-body-alt' : '.content-panel-inner-body');
      let innerContent = document.querySelector('.content-panel-inner-body') || document.querySelector('.content-panel-inner-body-alt');
      let innerContentHeight = innerContent ? innerContent.clientHeight : 0;

      console.log('contentHeight: ' + innerContentHeight);

      return innerContentHeight;
   }

   setPanelHeights() {
      // Wait a bit before setting final panel heights
      setTimeout(() => this.setState({ panelHeight: this.calcHeight() },
				     () => this.setState({ contentHeight: this.calcContentHeight() })), SET_PANEL_HEIGHT_DELAY);
   }

   //
   // End external div location section
   //

   updateDraggableOnMount = () => {
      this.setState({ positionY: this.props.initialPositionYFn ? this.props.initialPositionYFn() : this.props.topBoundFn() });
   }

   updateDraggableOnResize = () => {
//      this.setState({ topBound: this.calcTopBound(),
//		      bottomBound: this.calcBottomBound(),
//		      windowHeight: window.innerHeight });

      this.setState({ windowHeight: window.innerHeight });

      if (this.state.isOpen) {
	 this.setPanelHeights();
      }
   }

   onDrag = (e, data) => {
      if (e.timeStamp - this.state.lastDragUpdateTimestamp > config.contentPanelDragUpdateInterval) {
	 console.log('ON DRAG: ' + data.y + ' --> ' + this.calcHeight() + 'px');
	 this.setState({ dragging: true,
			 lastDragUpdateTimestamp: e.timeStamp,
			 positionY: data.y,
			 panelHeight: this.calcHeight() });

	 this.props.onResizeFn && this.props.onResizeFn();
      }
   }

   onDragStop = (e, data) => {
      console.log('DRAG STOP');
      this.setState({ dragging: false,
		      lastDragUpdateTimestamp: e.timeStamp,
		      positionY: data.y,
		      panelHeight: this.calcHeight() });

      this.props.onResizeFn && this.props.onResizeFn();
   }

   onKeydown = this.onKeydown.bind(this); 
   onKeydown(event) {
      if (this.state.isOpen) {
	 switch (event.key) {
	    case 'ArrowLeft':
	       this.onNextPrev('prev');
	       break;
	    case 'ArrowRight':
	       this.onNextPrev('next');
	       break;

	    case 'ArrowUp':
	    case 'ArrowDown':
	       const scrollDiv = document.querySelector('.content-panel-inner-body-scroll');
	       if (scrollDiv) {
		  let scrollBump = 200;
		  let newScrollYVal = Math.max(0, scrollDiv.scrollTop + (event.key === 'ArrowDown' ? scrollBump : -scrollBump));
		  scrollDiv.scrollTo(0, newScrollYVal);
	       }
	       break;

//	    case 'Escape':
//	       this.onClose();
//	       break;

	    default:
	       break;
	 }
      }
   }

   componentDidMount() {
//      this.listRef = React.createRef();

      if (this.props.open) {
	 this.setState({ isOpen: true }, () => this.setPanelHeights() );
      }

      this.calcCurrResources();
      this.updateDraggableOnMount();
      window.addEventListener('resize', this.updateDraggableOnResize);
      window.addEventListener('keydown', this.onKeydown);
   }

   componentWillUnmount() {
      window.removeEventListener('resize', this.updateDraggableOnResize);
      window.removeEventListener('keydown', this.onKeydown);
   }

   componentDidUpdate(prevProps, prevState) {
      console.log('componentDidUpdate() START');

      // TODO: only on explicit changes?
      if (notEqJSON(prevProps, this.props)) {
	 window.logDiffs && logDiffs('Props', prevProps, this.props);
	 this.calcCurrResources();
      }

      // TODO: only on explicit changes?
      if (notEqJSON(prevState, this.state)) {
	 window.logDiffs && logDiffs('State', prevState, this.state);
	 if (prevState.isOpen !== this.state.isOpen ||
	     prevState.currResources !== this.state.currResources ||
	     prevState.showAllData !== this.state.showAllData ||
	     prevState.trimLevel !== this.state.trimLevel) {
	    this.calcCurrResources();
	 }
      }

      // Kluge to delay setting positionY
      if (this.props.initialPositionYFn && !this.state.initialPositionYFn) {
	 this.setState({ positionY: this.props.initialPositionYFn ? this.props.initialPositionYFn() : this.props.topBoundFn(),
		         initialPositionYFn: this.props.initialPositionYFn });
      }

      if (!prevProps.open && this.props.open) {
	 this.setState({ isOpen: true }, () => this.setPanelHeights() );
      } 

      if (prevProps.context !== this.props.context) {
	 this.setState({ prevEnabled: this.props.context.date !== this.props.context.minDate,
			 nextEnabled: this.props.context.date !== this.props.context.maxDate });
	 // Wait for scrolling to be setup
	 setTimeout(() => this.scrollToDate(this.props.context.date));
      }

      if (prevState.showAllData !== this.state.showAllData && this.state.showAllData) {
	 // Wait for scrolling to be setup
	  setTimeout(() => this.scrollToDate(this.props.context.date));
      }

//      if (this.props.open && this.props.catsEnabled !== prevProps.catsEnabled) {
//	 this.setState({ annunciator: 'Categories changed' });
//      }

//      if (this.props.showAllData !== prevProps.showAllData) {
//	 this.setState({ showAllData: this.props.showAllData });
//      }

      if (this.props.open && this.props.context !== prevProps.context) {
	 this.setState({ annunciator: null });
      }

//      if (this.props.showAllFn && prevState.showAllData !== this.state.showAllData) {
//	 this.props.showAllFn(this.state.showAllData);
//      }

      console.log('componentDidUpdate() END');
   }


   inScrollToDate = false;

   //
   // Find the first element matching 'date' in currResources and scroll to it
   //
   scrollToDate(date) {
      console.log('scrollToDate: ' + date);
      const scrollDiv = document.querySelector('.content-panel-inner-body-scroll');
      const scrollerDiv = document.querySelector('.content-panel-inner-body-scroller');

      if (scrollDiv && scrollerDiv && this.state.currResources) {
	 let minResIndex = this.state.currResources.findIndex(elt => elt.itemDate === date);	// find date in currResources
	 let newScrollFraction = minResIndex / (this.state.currResources.length - 1);
	 let newScrollYVal = newScrollFraction * (scrollerDiv.clientHeight - scrollDiv.clientHeight);

	 let inScrollToDateInterval = 50; // msec
	 this.inScrollToDate = true;
	 scrollDiv.scrollTo(0, newScrollYVal)
	 // Clear 'inScrollToDate' after delay for render
	 setTimeout((cpThis) => { cpThis.inScrollToDate = false; }, inScrollToDateInterval, this);
	  
      } else {
	 let elt = document.getElementById(formatKeyDate(date));
	 if (elt) {
	    elt.scrollIntoView();
	 } else {
	    console.log('scrollToDate ???');
	 }
      }
   }

   sortResources(resArray) {
      return resArray.sort((a, b) => {
	 if (this.props.tileSort) {
	    if (a.category !== b.category) {
	       // Primary sort: ascending category order
	       return stringCompare(a.category, b.category);
	    } else {
	       // Secondary sort: ascending primary display item order
	       let aPrimary = this.primaryText(a);
	       let bPrimary = this.primaryText(b);
	       if (aPrimary !== bPrimary) {
		  return stringCompare(aPrimary, bPrimary);
	       } else {
		  // Tertiary sort: ascending/descending date order
		  return this.state.datesAscending ? new Date(a.itemDate).getTime() - new Date(b.itemDate).getTime()
						   : new Date(b.itemDate).getTime() - new Date(a.itemDate).getTime(); 
	       }
	    }

	 } else {
	    let aMillis = new Date(a.itemDate).getTime();
	    let bMillis = new Date(b.itemDate).getTime();
	    if (aMillis !== bMillis) {
	       // Primary sort: ascending/descending date order
	       return this.state.datesAscending ? aMillis - bMillis
						: bMillis - aMillis;
	    } else {
	       // Secondary sort: ascending category order
	       if (a.category !== b.category) {
		  return stringCompare(a.category, b.category);
	       } else {
		  // Tertiary sort: category-specific order
		  return this.compareFn(a.category)(a, b);
	       }
	    }
	 }
      });
   }

   // 
   //  Collect an array of resources matching catsToDisplay, search state, thumb positions, and showAllDate.
   //
   //  props.tileSort === false:
   //    Sorted by date descending (if state.datesAscending === false), then category ascending, then category-specific order
   //
   //  props.tileSort === true:
   //    Sorted by category ascending, then primary display item ascending, then date descending (if state.datesAscending === false)
   //
   //  Sets state.currResources
   //
   calcCurrResources() {
      let arr = [];
      console.log('calcCurrResources() - start: ' + new Date().getTime());
      let limitedResources = this.props.catsToDisplay ? this.props.resources.transformed.filter(res => this.props.catsToDisplay.includes(res.category) &&
												       res.category !== 'Patient' &&
												       this.catEnabled(res.category) &&
												       this.provEnabled(res.provider))
						      : this.props.resources.transformed.filter(res => res.category !== 'Patient' &&
												       this.catEnabled(res.category) &&
												       this.provEnabled(res.provider));

      if (this.state.showAllData && this.context.searchRefs.length > 0) {
	 arr = this.sortResources(this.context.searchRefs.map(ref => ref.resource));

      } else if (this.state.showAllData) {
	 arr = this.sortResources(limitedResources);

      } else {
	 arr = this.sortResources(limitedResources.filter(res => res.itemDate === this.props.context.date));
      }       

      console.log('calcCurrResources() - END: ' + new Date().getTime());

      // Reset scrollbar if used
      const scrollDiv = document.querySelector('.content-panel-inner-body-scroll');
      scrollDiv && scrollDiv.scrollTo(0, 0);

      // TODO: only set currResources (clean up elsewhere)
      this.setState({ currResources: arr });
   }

//   onClose = () => {
//      this.setState({ isOpen:false, annunciator: null });
//      this.props.onClose();
//   }

   onNextPrev = (direction) => {
      try {
	 const enabled = this.props.nextPrevFn(direction);
	 if (direction === 'prev') {
	    this.setState({ prevEnabled: enabled, nextEnabled: true, annunciator: null });
	 } else {
	    this.setState({ prevEnabled: true, nextEnabled: enabled, annunciator: null });
	 }
      } catch (e) {
	 console.log(`ContentPanel - onNextPrev(): ${e.message}`);
      }
   }

   catEnabled(cat) {
      // Map unimplemented categories to the "Unimplemented/Not in S4S" meta-category
      let testCat = Unimplemented.unimplementedCats.includes(cat) ? Unimplemented.catName : cat;
      return this.props.catsEnabled[testCat] || this.props.catsEnabled[testCat] === undefined;
   }

   provEnabled(prov) {
      return this.props.provsEnabled[prov] || this.props.provsEnabled[prov] === undefined;
   }
    
   onShowHideLines = () => {
      if (this.state.showDotLines) {
	 // Hide dot lines
	 this.setState({ showDotLines: !this.state.showDotLines,
//			 positionY: this.state.topBound });
			 positionY: this.props.topBoundFn() });
	 this.setPanelHeights();
      } else {
	 // Show dot lines
	 this.setState({ showDotLines: !this.state.showDotLines });
      }
   }

   onDoubleClick() {
      // Reset panel position
      this.setState({ positionY: this.props.initialPositionYFn ? this.props.initialPositionYFn() : this.props.topBoundFn() });
      this.setPanelHeights();
   }

   copyReverse(arr) {
      let revArr = [];	
      for (let i = arr.length-1; i>=0; i--) {
	  revArr.push(arr[i]);
      }
      return revArr;
   }

   // Count resources in 'resArray' where their category is enabled
   enabledResources(resArray) {
      let count = 0;
      for (let thisRes of resArray) {
	 if (this.catEnabled(thisRes.category)) {
	    count++;
	 }
      }
      return count;
   }

   compareFn(cat) {
      return classFromCat(cat).compareFn;
   }

   primaryText(elt) {
      return classFromCat(elt.category).primaryText(elt);
   }

   get noResultDisplay() {
       return this.props.noResultDisplay ? this.props.noResultDisplay : '[No matching data]';
   }

   renderAltDisplay() {
      if (this.state.showJSON) {
	 return (
	    <div className='content-panel-inner-body'>
	       <pre className='content-panel-data'>
		  { JSON.stringify(this.state.currResources, null, 3) }
	       </pre>
	    </div>
	 );

      } else {
	 const avgResHeight = 200;
	 const scrollStepsPerRes = 4;
//	 const minResHeight = 36;	// height of .content-header-container-disabled
	 const minResHeight = 100;
	 let resourcesToDisplay = Math.ceil(this.state.contentHeight / minResHeight);
	 let minResIndexToDisplay = this.state.scrollFraction * (this.state.currResources.length-1);
	 let minWholeResIndexToDisplay = Math.trunc(minResIndexToDisplay);
	 let minFracResIndexToDisplay = minResIndexToDisplay - minWholeResIndexToDisplay;
	 let maxResIndexToDisplay = Math.max(0, Math.ceil(minResIndexToDisplay + resourcesToDisplay - 1));
	 console.log(`renderAltDisplay(): ${formatDPs(minResIndexToDisplay, 5)} --> ${formatDPs(maxResIndexToDisplay, 5)} [${this.state.currResources.length}/${this.state.currResources.length}]`);
	 console.log(`   this.state.scrollFraction: ${this.state.scrollFraction}`);

	 let divs;

	 if (this.state.currResources && this.state.currResources.length > 0) {
	    divs = this.renderItems(this.state.currResources.slice(minWholeResIndexToDisplay, maxResIndexToDisplay));

	    const container = document.querySelector('.content-panel-inner-body-alt-container');
	    if (container) {
	       if (!this.inScrollToDate && minFracResIndexToDisplay > 0) {
		  const newContainerTop = -minFracResIndexToDisplay * avgResHeight;	// TODO: base on actual size of rendered resource
		  container.style = `position: absolute; top:${newContainerTop}px;`;
	       } else {
		  container.style = `position: absolute; top:0px;`;
	       }
	    }

	 } else {
	    divs = [ <div className='content-panel-no-data' key='1'>{this.noResultDisplay}</div> ];
	 }

	 return [
	    <div className='content-panel-inner-body-alt' key='1'>
	       <div className='content-panel-inner-body-alt-container'>
	          { divs }
	       </div>
	    </div>,
	    <div className='content-panel-inner-body-scroll' key='2' onScroll={this.onScroll.bind(this)}>
	       <div className='content-panel-inner-body-scroller' style={{minHeight: Math.max(this.state.panelHeight,
											      this.state.currResources.length*avgResHeight*scrollStepsPerRes)}} />
	    </div>
	 ];
      }
   }

   renderItems = (arr) => {
      console.log('renderItems');
      let showDate = this.state.showAllData;
      let resultDivs = [];
      let groups = {};

      if (this.props.tileSort) {
	 groups = groupBy(arr, elt => `${elt.category}-${this.primaryText(elt)}-${elt.itemDate}`);
      } else {
	 groups = groupBy(arr, elt => `${elt.category}-${elt.itemDate}`);
      }

      // Render each group
      for (let groupKey in groups) {
	 let group = groups[groupKey];
	 switch (group[0].category) {
	    case 'Allergies':
	       resultDivs.push(<Allergies key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(Allergies.catName)} />);
	       break;
	    case 'Benefits':
	       resultDivs.push(<Benefits key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(Benefits.catName)} />);
	       break;
	    case 'Claims':
	       resultDivs.push(<Claims key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(Claims.catName)} />);
	       break;
	    case 'Conditions':
	       resultDivs.push(<Conditions key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(Conditions.catName)} />);
	       break;
	    case 'DocumentReferences':
	       resultDivs.push(<DocumentReferences key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(DocumentReferences.catName)} />);
	       break;
	    case 'Encounters':
	       resultDivs.push(<Encounters key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(Encounters.catName)} />);
	       break;
	    case 'Exams':
	       resultDivs.push(<Exams key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(Exams.catName)} />);
	       break;
	    case 'Immunizations':
	       resultDivs.push(<Immunizations key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(Immunizations.catName)} />);
	       break;
	    case 'Lab Results':
	       resultDivs.push(<LabResults key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(LabResults.catName)}
					   resources={this.props.resources} dotClickFn={this.props.dotClickFn} />);
	       break;
	    case 'Meds Administration':
	       resultDivs.push(<MedsAdministration key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(MedsAdministration.catName)} />);
	       break;
	    case 'Meds Dispensed':
	       resultDivs.push(<MedsDispensed key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(MedsDispensed.catName)} />);
	       break;
	    case 'Meds Requested':
	       resultDivs.push(<MedsRequested key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(MedsRequested.catName)} />);
	       break;
	    case 'Meds Statement':
	       resultDivs.push(<MedsStatement key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(MedsStatement.catName)} />);
	       break;
	    case 'Procedures':
	       resultDivs.push(<Procedures key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(Procedures.catName)} />);
	       break;
	    case 'Social History':
	       resultDivs.push(<SocialHistory key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(SocialHistory.catName)} />);
	       break;
	    case 'Vital Signs':
	       resultDivs.push(<VitalSigns key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(VitalSigns.catName)}
					   resources={this.props.resources} dotClickFn={this.props.dotClickFn} />);
	       break;
	    case 'Unimplemented':
	    default:
	       resultDivs.push(<Unimplemented key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(Unimplemented.catName)} />);
	       break;
	 };
      }

      return resultDivs.length > 0 ? resultDivs : <div className='content-panel-no-data' key='1'>{this.noResultDisplay}</div>;
   }

   debounceTimer = null;

   debounce(func) {
      // If there's a timer, cancel it
      if (this.debounceTimer) {
	 window.cancelAnimationFrame(this.debounceTimer);
      }

      // Setup the new requestAnimationFrame()
      this.debounceTimer = window.requestAnimationFrame(() => func());
   }

   debounce2(func, wait) {
      if (!this.debounceTimer) {
	 this.debounceTimer = setTimeout(() => {
	    this.debounceTimer = null;
	    func();
	 }, wait);
      }
   }

   onScroll(e) {
      let debounceTime = 75;
      let eCopy = Object.assign({}, e);
//      this.debounce(() => this.onScrollDebounced(eCopy));
      this.debounce2(() => this.onScrollDebounced(eCopy), debounceTime);
   }

   onScrollDebounced(e) {
      let scrollFraction = e.target.scrollTop / (e.target.scrollHeight - e.target.clientHeight);
      this.setState({ scrollFraction: scrollFraction });

      console.log(`onScroll() scrollTop: ${e.target.scrollTop} scrollHeight: ${e.target.scrollHeight} clientHeight: ${e.target.clientHeight}`);
      console.log(`onScroll() newScrollFraction: ${scrollFraction}`);
   }

   renderDotOrAll() {
      let divs = this.state.currResources &&
		 this.state.currResources.length > 0 ? this.renderItems(this.state.currResources)
							 : [ <div className='content-panel-no-data' key='1'>{this.noResultDisplay}</div> ];
      return (
	 <div className='content-panel-inner-body'>
	    { this.state.showJSON ? 
		<pre className='content-panel-data'>
		   { JSON.stringify(this.state.currResources, null, 3) }
		</pre>
	      : divs }
	 </div>
      );
   }

   // changeTrimLevel = () => {
   //    switch(this.state.trimLevel) {
   // 	 case Const.trimExpected:
   // 	    this.state.trimLevelDirection === 'more' ? this.setState({ trimLevel: Const.trimMax, trimLevelDirection: 'less' })
   // 						     : this.setState({ trimLevel: Const.trimNone, trimLevelDirection: 'more' });
   // 	    break;

   // 	 default:
   // 	 case Const.trimMax:
   // 	 case Const.trimNone:
   // 	    this.setState({ trimLevel: Const.trimExpected });
   // 	    break;
   //    }	   
   // }

   toggleTrimLevel = () => {
      this.setState({ trimLevel: this.state.trimLevel === Const.trimNone ? Const.trimExpected : Const.trimNone });
   }

   renderContents(context) {
      // Temp: don't use virtual window rendering for Tiles/Compare views
      let contents = !this.state.currResources || this.props.tileSort ||
		     this.state.currResources.length < config.contentPanelUseWindowing ? this.renderDotOrAll() : this.renderAltDisplay();

      return (
	 <div className='content-panel-inner'>
	    <div className='content-panel-inner-title'>
	       <div className='content-panel-inner-title-left'>
		 {/*  <div className={this.props.viewIconClass}/>
		  <div className='content-panel-view-name'>{this.props.viewName}</div>*/}
	         {/* <div className='content-panel-participant-name'>
		     { this.props.resources && formatPatientName(this.props.resources.pathItem('[category=Patient].data.name')) }
		  </div> */}
         
         <div className='content-panel-item-count'>
		     {/* this.state.currResources.length + ' record' + (this.state.currResources.length === 1 ? '' : 's') */}
		     {/* `${this.state.currResources.length} record${this.state.currResources.length === 1 ? '' : 's'}` */}
		     { `${this.state.currResources.length} of ${this.props.totalResCount} record${this.props.totalResCount === 1 ? '' : 's'}` }
		  </div>                
                         
		  <button className={'content-panel-left-button' + (this.state.prevEnabled ? '' : '-off')}
			  onClick={() => this.onNextPrev('prev')} />
	       	  <button className={'content-panel-right-button' + (this.state.nextEnabled ? '' : '-off')}
			  onClick={() => this.onNextPrev('next')} />
         <button className='content-panel-show-details-button' onClick={this.toggleTrimLevel}>
		     {this.state.trimLevel===Const.trimNone ? 'Less' : 'More'}
		  </button>               
                         
	       	  {/* <button className={this.state.showAllData ? 'content-panel-all-button' : 'content-panel-dot-button'}
			  onClick={() => this.setState({ showAllData: !this.state.showAllData })} /> */}
		  {/* <button className={`content-panel-trim-${this.state.trimLevel}-button`} onClick={this.changeTrimLevel} /> */}
		  {/* <button className={'content-panel-annotation-button' + (this.state.showAnnotation ? '' : '-off')}
			     onClick={() => this.setState({ showAnnotation: !this.state.showAnnotation })} /> */}
		  {/* <button className={'content-panel-alt-button'}
			  onClick={() => this.setState({ displayVer: (this.state.displayVer+1)%3 },
						       () => this.setState({ contentHeight: this.calcContentHeight(),
									     scrollFraction: 0 }) ) } >
		     { this.state.displayVer }
		  </button> */}
	       </div>
	       <div className='content-panel-inner-title-center' onDoubleClick={this.onDoubleClick.bind(this)}>
		  <button className={this.state.showDotLines ? 'content-panel-drag-button' : 'content-panel-no-drag-button'} />

		  { this.state.annunciator && <div className='content-panel-annunciator'>{this.state.annunciator}</div> }
	       </div>
	       <div className='content-panel-inner-title-right'>
		  {/* <button className='content-panel-inner-title-close-button' onClick={this.onClose} /> 
		  <button className='content-panel-show-details-button' onClick={this.toggleTrimLevel}>
		     {this.state.trimLevel===Const.trimNone ? 'Less' : 'More'}
		  </button> */}
		  <button className={'content-panel-json-button' + (this.state.showJSON ? '' : '-off')}
			  onClick={() => this.setState({ showJSON: !this.state.showJSON })} /> 
		    {/*
             <button className='content-panel-print-button-off' />
		       <button className='content-panel-download-button-off' />
            */}
	       </div>
	    </div>
	    { contents }
	 </div>
      );
   }

   render() {
      // Locally extend DiscoveryContext with trimLevel & viewName (simpler than reassigning the extended context to DiscoveryContext.Provider)
      this.context.trimLevel = this.state.trimLevel;
      this.context.viewName = this.props.viewName;
// TODO: following needs to be moved to mount/update
//      this.context.updateGlobalContext({ trimLevel: this.state.trimLevel, viewName: this.props.viewName });

      // Dragging enabled/disabled by changing bounds.bottom
      return ( this.state.isOpen &&
	       <Draggable axis='y' position={{x:0, y:this.state.positionY}} handle='.content-panel-inner-title-center'
//			  bounds={{top:this.state.topBound, bottom:this.state.showDotLines ? this.state.bottomBound : this.state.topBound}}
			  bounds={{top:this.props.topBoundFn(), bottom:this.state.showDotLines ? this.props.bottomBoundFn() : this.props.topBoundFn()}}
			  onDrag={this.onDrag} onStop={this.onDragStop}>
		  <div className={this.props.containerClassName}
		       style={this.state.panelHeight ? {height:this.state.panelHeight} : {}}>
		     { this.props.resources && this.props.context && this.renderContents(this.props.context) }
		  </div>
	       </Draggable>
      )
   }
}
