import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';

import './ContentPanel.css';
import config from '../../config.js';
import {
  Const, stringCompare, formatKey, formatDPs, inDateRange, notEqJSON, logDiffs, classFromCat, groupBy, dateOnly,
} from '../../util.js';
import FhirTransform from '../../FhirTransform.js';
import { resKey } from '../../fhirUtil.js';

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
import ProcedureRequests from '../ProcedureRequests';
import SocialHistory from '../SocialHistory';
import VitalSigns from '../VitalSigns';
import Unimplemented from '../Unimplemented';

// import ListView from './ListView';

import DiscoveryContext from '../DiscoveryContext';

const SET_PANEL_HEIGHT_DELAY = 250; // msec
const SCROLL_TO_RES_DELAY = 25; // msec

//
// Render the content panel for ReportView, FinancialView, TilesView
//
// NOTE: This would be much simplified by use of a functioning virtual list that
//       supports variable height elements, e.g. (when finished):
//       https://github.com/bvaughn/react-window/issues/6
//

export default class ContentPanel extends React.Component {
   static myName = 'ContentPanel';

   static contextType = DiscoveryContext; // Allow the shared context to be accessed via 'this.context'

   static propTypes = {
     open: PropTypes.bool.isRequired,
     onClose: PropTypes.func,
     context: PropTypes.shape({
       parent: PropTypes.string,
       rowName: PropTypes.string,
       dotType: PropTypes.string,
       allDates: PropTypes.arrayOf(PropTypes.shape({
         position: PropTypes.number,
         date: PropTypes.string,
       })),
       minDate: PropTypes.string,
       maxDate: PropTypes.string,
       startDate: PropTypes.string,
       endDate: PropTypes.string,
       date: PropTypes.string,
       data: PropTypes.array,
     }), // added dynamically by StandardFilters
     catsEnabled: PropTypes.object.isRequired,
     provsEnabled: PropTypes.object.isRequired,
     nextPrevFn: PropTypes.func, // added dynamically by StandardFilters
     thumbLeftDate: PropTypes.string.isRequired,
     thumbRightDate: PropTypes.string.isRequired,
     viewName: PropTypes.string.isRequired,
     viewIconClass: PropTypes.string.isRequired,
     resources: PropTypes.instanceOf(FhirTransform),
     totalResCount: PropTypes.number,
     catsToDisplay: PropTypes.arrayOf(PropTypes.string),
     showAllData: PropTypes.bool,
     dotClickFn: PropTypes.func,
     initialTrimLevel: PropTypes.string,
     containerClassName: PropTypes.string.isRequired,
     topBoundFn: PropTypes.func.isRequired,
     bottomBoundFn: PropTypes.func.isRequired,
     initialPositionYFn: PropTypes.func,
     onResizeFn: PropTypes.func,
     tileSort: PropTypes.bool, // true --> "tile order sort", else default "report order sort"
     noResultDisplay: PropTypes.string,
   }

   state = {
     openPhase: null,
     isOpen: false,

     panelHeight: 0, // Height of top-level container
     contentHeight: 0, // Height of content-panel-inner-body(-alt) div
     positionY: 0,
     dragging: false,
     lastDragUpdateTimestamp: 0,
     prevEnabled: true,
     nextEnabled: true,
     //      showAllData: false,
     showAllData: true,
     showDotLines: true,
     trimLevel: this.props.initialTrimLevel ? this.props.initialTrimLevel : Const.trimNone,
     showJSON: false,
     //      showAnnotation: false,

     currResources: null,
     updateResourcesPhase: null,

     //      pageResource: null,   // Center/midpoint resource index for the currently active "page"
     pageResource: 0, // Center/midpoint resource index for the currently active "page"
     pageResourceY: 0, // The matching scroll offset in .content-panel-inner-body-scroller for 'pageResource'
     scrollToContextPhase: null,
     scrollToResPhase: null,
     doScrollToRes: null,
     dotClickPhase: null,

     //      initialPositionYFn: null,
     datesAscending: false, // Display dates in ascending order?
     onlyAnnotated: false,
   }

   // Refs
   resContainer = React.createRef(); // .content-panel-inner-body-alt-container

   scrollDiv = React.createRef(); // .content-panel-inner-body-scroll

   scrollerDiv = React.createRef(); // .content-panel-inner-body-scroller

   // Non-(React)tracked state vars
   debounceTimer = null;

   lastScrollDivScrollTop = null;

   //
   // Kluge: following functions violate locality/independence by needing to know absolute locations of divs in other components
   //
   calcPanelHeight() {
     const footer = document.querySelector('.page-footer');
     const panel = document.querySelector(`.${this.props.containerClassName}`);
     const titleBar = document.querySelector('.content-panel-inner-title');
     const titleBarHeight = titleBar ? titleBar.clientHeight : 0;

     return Math.max(titleBarHeight, footer && panel ? footer.getBoundingClientRect().top - panel.getBoundingClientRect().top - 5 : 0);
   }

   calcContentHeight() {
     const innerContent = document.querySelector('.content-panel-inner-body') || document.querySelector('.content-panel-inner-body-alt');
     const innerContentHeight = innerContent ? innerContent.clientHeight : 0;

     console.log(`contentHeight: ${innerContentHeight}`);

     return innerContentHeight;
   }

   setPanelHeights() {
     // Wait a bit before setting final panel heights
     setTimeout(() => this.setState({
       panelHeight: this.calcPanelHeight(),
       contentHeight: this.calcContentHeight(),
     }), SET_PANEL_HEIGHT_DELAY);
   }

   //
   // End of external div location section
   //

   updateDraggableOnMount = () => {
     this.setState({ positionY: this.props.initialPositionYFn ? this.props.initialPositionYFn() : this.props.topBoundFn() });
   }

   updateDraggableOnResize = () => {
     if (this.state.isOpen) {
       this.setPanelHeights();
     }
   }

   onDrag = (e, data) => {
     if (e.timeStamp - this.state.lastDragUpdateTimestamp > config.contentPanelDragUpdateInterval) {
       console.log(`ON DRAG: ${data.y} --> ${this.calcPanelHeight()}px`);
       this.setState({
         dragging: true,
         lastDragUpdateTimestamp: e.timeStamp,
         positionY: data.y,
         panelHeight: this.calcPanelHeight(),
       });

       this.props.onResizeFn && this.props.onResizeFn();
     }
   }

   onDragStop = (e, data) => {
     console.log('DRAG STOP');
     this.setState({
       dragging: false,
       lastDragUpdateTimestamp: e.timeStamp,
       positionY: data.y,
       panelHeight: this.calcPanelHeight(),
     });

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
           if (this.scrollDiv.current) {
             const scrollBump = 150; // TODO: get from config
             const newScrollYVal = Math.max(0, this.scrollDiv.current.scrollTop + (event.key === 'ArrowDown' ? scrollBump : -scrollBump));
             console.log(`${event.key} --> scrollTo: ${newScrollYVal}`);
             this.scrollDiv.current.scrollTo(0, newScrollYVal);
           }
           break;

           //     case 'Escape':
           //        this.onClose();
           //        break;

         default:
           break;
       }
     }
   }

   manageOpenSeq() {
     switch (this.state.openPhase) {
       case null: // Initial state
         if (this.props.open) {
           this.setState({
             isOpen: true,
             openPhase: 'setPanels',
           });
         }
         break;

       case 'setPanels':
         this.setPanelHeights();
         this.setState({ openPhase: 'open' });
         break;

       case 'open': // Terminal state
       default:
         break;
     }
   }

   manageUpdateResourcesSeq(update) {
     switch (this.state.updateResourcesPhase) {
       case null: // Initial/terminal state
       default:
         if (update) {
           this.setState({
             currResources: this.calcCurrResources(),
             updateResourcesPhase: 'p2',
           });
         }
         break;

       case 'p2':
         this.highlightResourcesFromClickedDot();
         //     let resIndex = this.targetResIndex(this.props.context);
         this.setState({ // pageResource: resIndex,
           updateResourcesPhase: null,
         });
         break;
     }
   }

   // ####
   manageScrollToContextSeq(doScroll) {
     switch (this.state.scrollToContextPhase) {
       case null: // Initial/terminal state
       default:
         if (doScroll) {
           this.scrollToContext(this.props.context);
           this.setState({ scrollToContextPhase: this.isVirtualDisplay() ? 'didScrollToContext' : null });
         }
         break;

       case 'didScrollToContext':
         this.setState({
           doScrollToRes: this.targetResIndex(this.props.context),
           scrollToContextPhase: 'wait',
         });
         break;

       case 'wait':
         // Wait for sequence to be completed by onScroll()
         break;
     }
   }

   manageScrollToResSeq() {
     let isNewPage;
     switch (this.state.scrollToResPhase) {
       case null: // Initial/terminal state
       default:
         if (this.state.doScrollToRes) {
           isNewPage = this.scrollToRes(this.state.doScrollToRes);
           this.setState({ scrollToResPhase: isNewPage ? 'didScrollToRes' : null });
         }
         break;

       case 'didScrollToRes':
         const intId = setInterval(() => {
           // TODO: not clear why check doScrollToRes is necessary (should be no scrollToRes() calls after reset doScrollToRes)
           if (this.state.doScrollToRes) {
             isNewPage = this.scrollToRes(this.state.doScrollToRes);
             console.log('scrollToRes...');
             if (!isNewPage) {
               // Resource is now visible in the DOM
               console.log('scrollToRes...visible');
               clearInterval(intId);
               this.setState({
                 doScrollToRes: null,
                 scrollToResPhase: null,
               });
             }
           }
         }, SCROLL_TO_RES_DELAY);
         break;
     }
   }

   componentDidMount() {
     this.manageOpenSeq();
     this.manageUpdateResourcesSeq(true);

     //      this.setState({ onlyAnnotated: this.context.onlyAnnotated },
     //      () => this.setState({ currResources: this.calcCurrResources() }));
     this.setState({ onlyAnnotated: this.context.onlyAnnotated });

     this.updateDraggableOnMount();
     window.addEventListener('resize', this.updateDraggableOnResize);
     window.addEventListener('keydown', this.onKeydown);
   }

   componentWillUnmount() {
     window.removeEventListener('resize', this.updateDraggableOnResize);
     window.removeEventListener('keydown', this.onKeydown);
   }

   // For views with clickable dots (and displayed resources), highlight resources matching the date of the current dot
   highlightResourcesFromClickedDot() {
     // TODO: is dotClickFn correct here?
     if (this.props.dotClickFn && this.props.context) {
       const dotResources = this.props.resources.transformed.filter((res) => res.itemDate
   && dateOnly(res.itemDate) === dateOnly(this.props.context.date));
       this.context.updateGlobalContext({ lastHighlightedResources: dotResources });
     }
   }

   shouldComponentUpdate(nextProps, nextState) {
     if (this.state.scrollToContextPhase === 'didScrollToContext' && nextState.scrollToContextPhase === null) {
       // Don't update on final scroll to context seq change
       return false;
     } if (notEqJSON(this.props, nextProps)) {
       // Prop change
       window.logDiffs && logDiffs('Props', this.props, nextProps);
       return true;
     } if (notEqJSON(this.state, nextState)) {
       // State change
       window.logDiffs && logDiffs('State', this.state, nextState);
       return true;
     }
     // No change
     return false;
   }

   static getDerivedStateFromProps(props, state) {
     return null;
   }

   getSnapshotBeforeUpdate(prevProps, prevState) {
     // Capture info from the DOM before it is updated
     // Return value is passed as 'snapshot' to componentDidUpdate()
     logDiffs('Props', prevProps, this.props);
     logDiffs('State', prevState, this.state);
     return null;
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
     console.log('componentDidUpdate() START');
     window.logDiffs && logDiffs('Props', prevProps, this.props);
     window.logDiffs && logDiffs('State', prevState, this.state);

     const doUpdateResources = notEqJSON(prevProps, this.props)
      || prevState.showAllData !== this.state.showAllData
      || prevState.trimLevel !== this.state.trimLevel
      || prevState.onlyAnnotated !== this.state.onlyAnnotated;

     this.manageOpenSeq();
     this.manageUpdateResourcesSeq(doUpdateResources);
     this.manageScrollToContextSeq(this.props.context.date !== prevProps.context.date);
     this.manageScrollToResSeq();

     if (notEqJSON(prevProps, this.props)) {
       this.setState({
         prevEnabled: this.props.context.date !== this.props.context.minDate,
         nextEnabled: this.props.context.date !== this.props.context.maxDate,
       });
     }

     console.log('componentDidUpdate() END');
   }

   // ####
   scrollToRes(targetResIndex) {
     let isNewPage = false;
     if (targetResIndex >= 0) {
       //  debugger;
       const res = this.state.currResources[targetResIndex];
       console.log(`scrollToRes: ${targetResIndex} ${res.itemDate.substring(0, 10)} ${res.category}`);
       const catKey = formatKey(res);
       const catContainer = document.getElementById(catKey);
       const body = catContainer && catContainer.getElementsByClassName('content-body')[0];
       const targetKey = resKey(res);
       const target = body && body.querySelector(`[data-res="${targetKey}"]`);
       if (this.scrollDiv.current && target) {
         console.log(`scrollToRes: resource in focus (${catContainer.offsetTop}px)`);
         this.scrollDiv.current.scrollTop = catContainer.offsetTop + this.state.pageResourceY; // + pageResourceY so thumb is at correct location

         this.setContainerTop(-catContainer.offsetTop); // Show target resource at top of container
       } else {
         console.log('scrollToRes: resource NOT in focus');
         isNewPage = true;
         // Set state.pageResource to center current page on 'targetResIndex'
         if (this.state.pageResource !== targetResIndex) {
           this.setState({ pageResource: targetResIndex }); // Only set the first time, not when wait for DOM update
         }
       }
     } else {
       console.log('scrollToRes: resource NOT FOUND');
     }

     return isNewPage;
   }

   //
   //  Determine the index of the target resource in currResources from 'context'
   //
   targetResIndex(context) {
     const targetDate = dateOnly(context.date);
     switch (context.parent) {
       case 'TimeWidget':
         return this.state.currResources.findIndex((elt) => dateOnly(elt.itemDate) === targetDate); // find date in currResources

       case 'Category':
         return this.state.currResources.findIndex((elt) => dateOnly(elt.itemDate) === targetDate // find date+category in currResources
     && elt.category === context.rowName);

       case 'Provider':
         return this.state.currResources.findIndex((elt) => dateOnly(elt.itemDate) === targetDate // find date+provider in currResources
     && elt.provider === context.rowName);

       default:
         return -1;
     }
   }

   // ####
   //
   // Find the first element matching 'context' in currResources and scroll to it
   //
   scrollToContext(context) {
     console.log(`scrollToContext: ${context.parent}:${context.rowName}  ${context.date}`);

     const targetResIndex = this.targetResIndex(context);
     if (this.scrollDiv.current && this.scrollerDiv.current && this.state.currResources && targetResIndex >= 0) {
       const newScrollFraction = this.state.currResources && this.state.currResources.length === 0 ? 0 : targetResIndex / this.state.currResources.length;
       const newScrollYVal = newScrollFraction * (this.scrollerDiv.current.clientHeight - this.scrollDiv.current.clientHeight);
       if (newScrollYVal !== this.scrollDiv.current.scrollTop) {
         this.setState({ pageResourceY: newScrollYVal });
       }
     } else if (this.state.currResources && targetResIndex >= 0) {
       const targetRes = this.state.currResources[targetResIndex];
       const key = formatKey(targetRes);
       const elt = document.getElementById(key);
       if (elt) {
         elt.parentNode.scrollTop = elt.offsetTop - 30; // content-header height
       } else {
         console.log('scrollToContext ???');
       }
     } else {
       console.log('scrollToContext: no matching resources');
     }
   }

   sortResources(resArray) {
     return resArray.sort((a, b) => {
       if (this.props.tileSort) {
         if (a.category !== b.category) {
           // Primary sort: ascending category order
           return stringCompare(a.category, b.category);
         }
         // Secondary sort: ascending primary display item order
         const aPrimary = this.primaryText(a);
         const bPrimary = this.primaryText(b);
         if (aPrimary !== bPrimary) {
           return stringCompare(aPrimary, bPrimary);
         }
         // Tertiary sort: ascending/descending date order
         return this.state.datesAscending ? new Date(a.itemDate).getTime() - new Date(b.itemDate).getTime()
           : new Date(b.itemDate).getTime() - new Date(a.itemDate).getTime();
       }
       const aMillis = new Date(a.itemDate).getTime();
       const bMillis = new Date(b.itemDate).getTime();
       if (aMillis !== bMillis) {
       // Primary sort: ascending/descending date order
         return this.state.datesAscending ? aMillis - bMillis
           : bMillis - aMillis;
       }
       // Secondary sort: ascending category order
       if (a.category !== b.category) {
         return stringCompare(a.category, b.category);
       }
       // Tertiary sort: category-specific order
       return this.compareFn(a.category)(a, b);
     });
   }

   //
   //  Collect an array of resources matching catsToDisplay, search state, thumb positions, showAllDate, and onlyAnnotated.
   //
   //  props.tileSort === false:
   //    Sorted by date descending (if state.datesAscending === false), then category ascending, then category-specific order
   //
   //  props.tileSort === true:
   //    Sorted by category ascending, then primary display item ascending, then date descending (if state.datesAscending === false)
   //
   //  @@@Sets state.currResources
   //
   calcCurrResources() {
     let arr = [];
     console.log(`calcCurrResources() - start: ${new Date().getTime()}`);
     const limitedResources = this.props.catsToDisplay ? this.props.resources.transformed.filter((res) => this.props.catsToDisplay.includes(res.category)
       && res.category !== 'Patient'
       && this.catEnabled(res.category)
       && this.provEnabled(res.provider)
       && inDateRange(res.itemDate, this.props.thumbLeftDate,
         this.props.thumbRightDate)
       && (!this.state.onlyAnnotated || (res.data.discoveryAnnotation
&& res.data.discoveryAnnotation.annotationHistory)))
       : this.props.resources.transformed.filter((res) => res.category !== 'Patient'
       && this.catEnabled(res.category)
       && this.provEnabled(res.provider)
       && inDateRange(res.itemDate, this.props.thumbLeftDate,
         this.props.thumbRightDate)
       && (!this.state.onlyAnnotated || (res.data.discoveryAnnotation
&& res.data.discoveryAnnotation.annotationHistory)));

     if (this.state.showAllData && this.context.searchRefs.length > 0) {
       arr = this.sortResources(this.context.searchRefs.map((ref) => ref.resource));
     } else if (this.state.showAllData) {
       arr = this.sortResources(limitedResources);
     } else {
       arr = this.sortResources(limitedResources.filter((res) => res.itemDate === this.props.context.date));
     }

     console.log(`Resources: ${arr.length}`);
     console.log(`calcCurrResources() - END: ${new Date().getTime()}`);

     return arr;
   }

   //   onClose = () => {
   //      this.setState({ isOpen:false });
   //      this.props.onClose();
   //   }

   onNextPrev = (direction) => {
     try {
       const enabled = this.props.nextPrevFn(direction);
       if (direction === 'prev') {
         this.setState({ prevEnabled: enabled, nextEnabled: true });
       } else {
         this.setState({ prevEnabled: true, nextEnabled: enabled });
       }
     } catch (e) {
       console.log(`ContentPanel - onNextPrev(): ${e.message}`);
     }
   }

   catEnabled(cat) {
     // Map unimplemented categories to the "Unimplemented/Not in S4S" meta-category
     const testCat = Unimplemented.unimplementedCats.includes(cat) ? Unimplemented.catName : cat;
     return this.props.catsEnabled[testCat] || this.props.catsEnabled[testCat] === undefined;
   }

   provEnabled(prov) {
     return this.props.provsEnabled[prov] || this.props.provsEnabled[prov] === undefined;
   }

   onShowHideLines = () => {
     if (this.state.showDotLines) {
       // Hide dot lines
       this.setState({
         showDotLines: !this.state.showDotLines,
         positionY: this.props.topBoundFn(),
       });
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
     const revArr = [];
     for (let i = arr.length - 1; i >= 0; i--) {
       revArr.push(arr[i]);
     }
     return revArr;
   }

   // Count resources in 'resArray' where their category is enabled
   enabledResources(resArray) {
     let count = 0;
     for (const thisRes of resArray) {
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

   noneEnabled(obj) {
     for (const propName of Object.keys(obj)) {
       if (obj[propName]) {
         return false;
       }
     }
     return true;
   }

   get noResultDisplay() {
     if (this.noneEnabled(this.props.catsEnabled)) {
       return 'No Record type is selected';
     } if (this.noneEnabled(this.props.provsEnabled)) {
       return 'No Provider is selected';
     }
     return this.props.noResultDisplay ? this.props.noResultDisplay : 'No matching data';
   }

   //   renderItemForListView = (item) => {
   //      let goo = this.renderItems([item.item]);
   //      return goo;
   //   }
   //
   //   NEWrenderAltDisplay() {
   //      if (this.state.showJSON) {
   //  return (
   //     <div className='content-panel-inner-body'>
   //        <pre className='content-panel-data'>
   //    { JSON.stringify(this.state.currResources, null, 3) }
   //        </pre>
   //     </div>
   //  );
   //
   //      } else {
   //  return (
   //     <ListView data={this.state.currResources} renderItem={this.renderItemForListView} emptyText='[Nothing to show...]' />
   //  )
   //      }
   //   }

   get altScrollFraction() {
     return this.scrollDiv.current ? this.scrollDiv.current.scrollTop / (this.scrollDiv.current.scrollHeight - this.scrollDiv.current.clientHeight) : 0;
   }

   renderAltDisplay() {
     if (this.state.showJSON) {
       return (
         <div className="content-panel-inner-body">
           <pre className="content-panel-data">
             { JSON.stringify(this.state.currResources, null, 3) }
           </pre>
         </div>
       );
     }
     // @@@@
     const resourcesToRender = 50; // TODO: get from config
     const maxResIndex = this.state.currResources.length - 1;
     const centerResIndexToRender = this.state.pageResource;
     const minResIndexToRender = Math.max(0, centerResIndexToRender - resourcesToRender / 2);
     const minWholeResIndexToRender = Math.trunc(minResIndexToRender);
     const maxResIndexToRender = Math.min(maxResIndex, Math.max(0, Math.ceil(centerResIndexToRender + resourcesToRender / 2 - 1)));
     console.log(`renderAltDisplay(): ${formatDPs(minResIndexToRender, 5)} --> ${formatDPs(maxResIndexToRender, 5)} [${this.state.currResources.length}]`);
     //  console.log(`   this.altScrollFraction: ${this.altScrollFraction}`);

     let divs;

     if (this.state.currResources && this.state.currResources.length > 0) {
       divs = this.renderItems(this.state.currResources.slice(minWholeResIndexToRender, maxResIndexToRender));
     } else {
       divs = [<div className="content-panel-no-data" key="1">{this.noResultDisplay}</div>];
     }

     console.log(`DIVs: ${divs.length}`);

     // TODO: get from config
     const avgResHeight = 200;
     const scrollStepsPerRes = 4;

     return [
       <div className="content-panel-inner-body-alt" key="1">
         <div className="content-panel-inner-body-alt-container" ref={this.resContainer}>
           { divs }
         </div>
       </div>,
       <div className="content-panel-inner-body-scroll" ref={this.scrollDiv} key="2" onScroll={this.onScroll.bind(this)}>
         <div
           className="content-panel-inner-body-scroller"
           ref={this.scrollerDiv}
           style={{ minHeight: Math.max(this.state.panelHeight, this.state.currResources.length * avgResHeight * scrollStepsPerRes) }}
         />
       </div>,
     ];
   }

   renderItems = (arr) => {
     console.log('renderItems');
     const showDate = this.state.showAllData;
     const resultDivs = [];
     let groups = {};

     if (this.props.tileSort) {
       groups = groupBy(arr, (elt) => `${elt.category}-${this.primaryText(elt)}-${elt.itemDate}`);
     } else {
       groups = groupBy(arr, (elt) => `${elt.category}-${elt.itemDate}`);
     }

     // Render each group
     for (const groupKey in groups) {
       const group = groups[groupKey];
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
         case 'Document References':
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
           resultDivs.push(<LabResults
             key={groupKey}
             data={group}
             showDate={showDate}
             isEnabled={this.catEnabled(LabResults.catName)}
             resources={this.props.resources}
             dotClickFn={this.props.dotClickFn}
           />);
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
         case 'Procedure Requests':
           resultDivs.push(<ProcedureRequests key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(ProcedureRequests.catName)} />);
           break;
         case 'Social History':
           resultDivs.push(<SocialHistory key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(SocialHistory.catName)} />);
           break;
         case 'Vital Signs':
           resultDivs.push(<VitalSigns
             key={groupKey}
             data={group}
             showDate={showDate}
             isEnabled={this.catEnabled(VitalSigns.catName)}
             resources={this.props.resources}
             dotClickFn={this.props.dotClickFn}
           />);
           break;
         case 'Unimplemented':
         default:
           resultDivs.push(<Unimplemented key={groupKey} data={group} showDate={showDate} isEnabled={this.catEnabled(Unimplemented.catName)} />);
           break;
       }
     }

     return resultDivs.length > 0 ? resultDivs : <div className="content-panel-no-data" key="1">{this.noResultDisplay}</div>;
   }

   // ####
   setContainerTop(offset) {
     //      let viewDelta = -100;
     //      let viewDelta = 0;
     const viewDelta = 150;
     if (this.resContainer.current) {
       const firstDOMElt = this.resContainer.current.children[0];
       const lastDOMElt = this.resContainer.current.children[this.resContainer.current.children.length - 1];

       const topTrigger = offset > firstDOMElt.offsetTop + viewDelta;
       const botTrigger = -offset + this.resContainer.current.parentElement.offsetHeight > lastDOMElt.offsetTop + lastDOMElt.offsetHeight + viewDelta;

       const newContainerTop = `${offset}px`;
       const resDelta = 25; // TODO: get from config

       console.log(`setContainerTop: ${newContainerTop}`);
       console.log(`    container height: ${this.resContainer.current.parentElement.offsetHeight}`);
       const firstIndex = Math.max(0, this.state.pageResource - resDelta);
       const firstDate = this.state.currResources[firstIndex].itemDate.substring(0, 10);
       console.log(`    first resource: ${firstDate} ${this.state.currResources[firstIndex].category} [${firstIndex}]`);
       const lastIndex = Math.min(this.state.currResources.length - 1, this.state.pageResource + resDelta);
       const lastDate = this.state.currResources[lastIndex].itemDate.substring(0, 10);
       console.log(`    last resource: ${lastDate} ${this.state.currResources[lastIndex].category} [${lastIndex}]`);
       console.log(`    first offsetTop: ${firstDOMElt.offsetTop} last offsetTop: ${lastDOMElt.offsetTop}`);
       console.log(`    last height: ${lastDOMElt.offsetHeight}`);

       if (topTrigger) {
         //     debugger;
         if (this.state.pageResource - resDelta >= 0) {
           const newResIndex = this.state.pageResource - resDelta - 1;
           const newScrollFraction = this.state.currResources && this.state.currResources.length === 0 ? 0 : newResIndex / this.state.currResources.length;
           const newScrollYVal = newScrollFraction * (this.scrollerDiv.current.clientHeight - this.scrollDiv.current.clientHeight);
           const oldPageRes = this.state.currResources[this.state.pageResource];
           const newPageRes = this.state.currResources[newResIndex];
           console.log(`TOP TRIG -- pageResource (old): ${this.state.pageResource} ${oldPageRes.itemDate.substring(0, 10)} ${oldPageRes.category}`);
           console.log(`                    -->  (new): ${newResIndex} ${newPageRes.itemDate.substring(0, 10)} ${newPageRes.category}`);
           console.log(`            pageResourceY: ${this.state.pageResourceY} --> ${newScrollYVal}`);

           //        this.setState({ pageResource: newResIndex,
           //          pageResourceY: newScrollYVal });

           this.setState({
             pageResource: newResIndex,
             pageResourceY: newScrollYVal,
             doScrollToRes: newResIndex,
           });

           //        this.scrollToRes(newResIndex);
         } else {
           console.log('TOP TRIG -- at begin');
           if (this.lastScrollDivScrollTop) {
             this.scrollDiv.current.scrollTop = this.lastScrollDivScrollTop; // "Undo" unnecessary scrolling
           }
         }
       } else if (botTrigger) {
         //     debugger;
         if (this.state.pageResource + resDelta < this.state.currResources.length) {
           const newResIndex = this.state.pageResource + resDelta;
           const newScrollFraction = this.state.currResources && this.state.currResources.length === 0 ? 0 : newResIndex / this.state.currResources.length;
           const newScrollYVal = newScrollFraction * (this.scrollerDiv.current.clientHeight - this.scrollDiv.current.clientHeight);
           const oldPageRes = this.state.currResources[this.state.pageResource];
           const newPageRes = this.state.currResources[newResIndex];
           console.log(`BOT TRIG -- pageResource (old): ${this.state.pageResource} ${oldPageRes.itemDate.substring(0, 10)} ${oldPageRes.category}`);
           console.log(`                    -->  (new): ${newResIndex} ${newPageRes.itemDate.substring(0, 10)} ${newPageRes.category}`);
           console.log(`            pageResourceY: ${this.state.pageResourceY} --> ${newScrollYVal}`);

           //        this.setState({ pageResource: newResIndex,
           //          pageResourceY: newScrollYVal });

           this.setState({
             pageResource: newResIndex,
             pageResourceY: newScrollYVal,
             doScrollToRes: newResIndex,
           });

           //        this.scrollToRes(newResIndex);
         } else {
           console.log('BOT TRIG -- at end');
           if (this.lastScrollDivScrollTop) {
             this.scrollDiv.current.scrollTop = this.lastScrollDivScrollTop; // "Undo" unnecessary scrolling
           }
         }
       } else {
         this.resContainer.current.style.top = newContainerTop;
       }
     }
   }

   //   debounce(func) {
   //      // If there's a timer, cancel it
   //      if (this.debounceTimer) {
   //  window.cancelAnimationFrame(this.debounceTimer);
   //      }
   //
   //      // Setup the new requestAnimationFrame()
   //      this.debounceTimer = window.requestAnimationFrame(() => func());
   //   }

   debounce2(func, wait) {
     if (!this.debounceTimer) {
       this.debounceTimer = setTimeout(() => {
         this.debounceTimer = null;
         func();
       }, wait);
     }
   }

   onScroll(e) {
     //      let debounceTime = 75;
     //      let eCopy = Object.assign({}, e);
     //      this.debounce(() => this.onScrollDebounced(eCopy));
     //      this.debounce2(() => this.onScrollDebounced(eCopy), debounceTime);
     this.onScrollDebounced(e);
     this.lastScrollDivScrollTop = e.target.scrollTop; // Save for possible "undo" in setContainerTop()
   }

   onScrollDebounced(e) {
     if (this.state.scrollToResPhase !== null) {
       // Don't process scroll events when scrolling to a resource

     } else if (this.state.scrollToContextPhase !== null) {
       // Completion of scrollToContext()
       this.setState({ scrollToContextPhase: null });
     } else {
       // scroll wheel / arrows
       console.log(`onScroll: ${this.state.pageResourceY} - ${e.target.scrollTop}`);
       this.setContainerTop(this.state.pageResourceY - e.target.scrollTop);
     }
   }

   renderDotOrAll() {
     const divs = this.state.currResources
 && this.state.currResources.length > 0 ? this.renderItems(this.state.currResources)
       : [<div className="content-panel-no-data" key="1">{this.noResultDisplay}</div>];
     return (
       <div className="content-panel-inner-body">
         { this.state.showJSON ? (
           <pre className="content-panel-data">
             { JSON.stringify(this.state.currResources, null, 3) }
           </pre>
         ) : divs }
       </div>
     );
   }

   toggleTrimLevel = () => {
     this.setState({ trimLevel: this.state.trimLevel === Const.trimNone ? Const.trimExpected : Const.trimNone });
   }

   isVirtualDisplay() {
     return this.state.currResources.length >= config.contentPanelUseWindowing;
   }

   onlyAnnotatedChange = (event) => {
     //      console.log('annotated change: ' + event.target.checked);
     this.setState({ onlyAnnotated: event.target.checked });
     this.context.updateGlobalContext({ onlyAnnotated: event.target.checked });
   }

   renderContents(context) {
     //      // Temp: don't use virtual window rendering for Tiles/Compare views
     //      let contents = !this.state.currResources || this.props.tileSort ||
     //       this.state.currResources.length < config.contentPanelUseWindowing ? this.renderDotOrAll() : this.renderAltDisplay();
     // Use virtual window rendering for all views (20191105)
     const contents = !this.state.currResources
     || this.isVirtualDisplay() ? this.renderAltDisplay() : this.renderDotOrAll();

     return (
       <div className="content-panel-inner">
         <div className="content-panel-inner-title">
           <div className="content-panel-inner-title-left">
             {/*  <div className={this.props.viewIconClass}/>
  <div className='content-panel-view-name'>{this.props.viewName}</div> */}

             <div className="content-panel-item-count">
               {/* this.state.currResources.length + ' record' + (this.state.currResources.length === 1 ? '' : 's') */}
               {/* `${this.state.currResources.length} record${this.state.currResources.length === 1 ? '' : 's'}` */}
               { `Displaying ${this.state.currResources.length} of ${this.props.totalResCount} record${this.props.totalResCount === 1 ? '' : 's'}` }
             </div>

             { config.enableContentPanelLeftRight && (
             <button
               className={`content-panel-left-button${this.state.prevEnabled ? '' : '-off'}`}
               onClick={() => this.onNextPrev('prev')}
             />
             ) }
             { config.enableContentPanelLeftRight && (
             <button
               className={`content-panel-right-button${this.state.nextEnabled ? '' : '-off'}`}
               onClick={() => this.onNextPrev('next')}
             />
             ) }
             { config.enableShowLess && (
             <button className="content-panel-show-details-button" onClick={this.toggleTrimLevel}>
               { this.state.trimLevel === Const.trimNone ? 'Show Less' : 'Show More' }
             </button>
             ) }

             {/* <button className={this.state.showAllData ? 'content-panel-all-button' : 'content-panel-dot-button'}
  onClick={() => this.setState({ showAllData: !this.state.showAllData })} /> */}
             {/* <button className={`content-panel-trim-${this.state.trimLevel}-button`} onClick={this.changeTrimLevel} /> */}
             {/* <button className={'content-panel-annotation-button' + (this.state.showAnnotation ? '' : '-off')}
     onClick={() => this.setState({ showAnnotation: !this.state.showAnnotation })} /> */}
           </div>
           <div className="content-panel-inner-title-center" onDoubleClick={this.onDoubleClick.bind(this)}>
             <button className={this.state.showDotLines ? 'content-panel-drag-button' : 'content-panel-no-drag-button'} />
           </div>
           <div className="content-panel-inner-title-right">
             {/* <button className='content-panel-inner-title-close-button' onClick={this.onClose} />
  <button className='content-panel-show-details-button' onClick={this.toggleTrimLevel}>
     {this.state.trimLevel===Const.trimNone ? 'Less' : 'More'}
  </button> */}
             { config.enableOnlyRecordsWithNotes && (
             <label className="check-only-annotated-label">
               <input className="check-only-annotated-check" type="checkbox" checked={this.state.onlyAnnotated} onChange={this.onlyAnnotatedChange} />
               Only records with my notes
             </label>
             ) }
             <button
               className={`content-panel-json-button${this.state.showJSON ? '' : '-off'}`}
               onClick={() => this.setState({ showJSON: !this.state.showJSON })}
             />
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
     // Locally extend DiscoveryContext with trimLevel & viewName (hack)
     this.context.trimLevel = this.state.trimLevel;
     this.context.viewName = this.props.viewName;
     // TODO: following needs to be moved to mount/update
     //      this.context.updateGlobalContext({ trimLevel: this.state.trimLevel, viewName: this.props.viewName });

     // Dragging enabled/disabled by changing bounds.bottom
     return (this.state.isOpen
       && (
       <Draggable
         axis="y"
         position={{ x: 0, y: this.state.positionY }}
         handle=".content-panel-inner-title-center"
         bounds={{ top: this.props.topBoundFn(), bottom: this.state.showDotLines ? this.props.bottomBoundFn() : this.props.topBoundFn() }}
         onDrag={this.onDrag}
         onStop={this.onDragStop}
       >
         <div
           className={this.props.containerClassName}
           style={this.state.panelHeight ? { height: this.state.panelHeight } : {}}
         >
           { this.state.currResources && this.props.context && this.renderContents(this.props.context) }
         </div>
       </Draggable>
       )
     );
   }
}
