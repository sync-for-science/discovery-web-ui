import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './LongitudinalView.css';
import FhirTransform from '../../FhirTransform.js';
import { getStyle, combine, cleanDates, normalizeDates } from '../../util.js';
import TimeWidget from '../TimeWidget';
import CategoryRollup from '../CategoryRollup';
import Categories from '../Categories';
import Category from '../Category';
import ProviderRollup from '../ProviderRollup';
import Providers from '../Providers';
import Provider from '../Provider';
import ContentPanel from '../ContentPanel';


//
// Render the "longitudinal view" of the participant's data
//
export default class LongitudinalView extends Component {

   static propTypes = {
      resources: PropTypes.instanceOf(FhirTransform),
      dates: PropTypes.shape({
	 allDates: PropTypes.arrayOf(PropTypes.shape({
	    position: PropTypes.number.isRequired,
	    date: PropTypes.string.isRequired
	 })).isRequired,
	 minDate: PropTypes.string.isRequired,		// Earliest date we have data for this participant
	 startDate: PropTypes.string.isRequired,	// Jan 1 of minDate's year
	 maxDate: PropTypes.string.isRequired,		// Latest date we have data for this participant
	 endDate: PropTypes.string.isRequired		// Dec 31 of last year of timeline tick periods
      }),
      categories: PropTypes.arrayOf(PropTypes.string),
      providers: PropTypes.arrayOf(PropTypes.string),
      searchRefs: PropTypes.arrayOf(PropTypes.shape({	// Search results to highlight
	 provider: PropTypes.string.isRequired,
	 category: PropTypes.string.isRequired,
	 date: PropTypes.string.isRequired,
	 veryInteresting: PropTypes.bool.isRequired,
	 position: PropTypes.number.isRequired
      })),
      lastEvent: PropTypes.instanceOf(Event)
   }

   state = {
      minActivePos: 0.0,	    // Location [0..1] of TimeWidget left thumb
      maxActivePos: 1.0,	    // Location [0..1] of TimeWidget right thumb
      timelineIsExpanded: false,    // Is expanded timeline displayed (restricted dot range in effect)
      catsExpanded: true,
      catsEnabled: {},		    // Enabled status of categories
      provsExpanded: true,
      provsEnabled: {},		    // Enabled status of providers
      contentPanelIsOpen: false,
      dotClickContext: null,	    // The current dot
      svgWidth: '0px'
   }

   componentDidMount() {
      this.updateSvgWidth();
   }

   componentDidUpdate(prevProps, prevState) {
      if (prevProps.lastEvent !== this.props.lastEvent) {
	 switch (this.props.lastEvent.type) {
	    case 'keydown':
	       this.onKeydown(this.props.lastEvent);
	       break;
	    case 'resize':
	    default:
	       this.updateSvgWidth();
	       break;
	 }
      }
   }

   // Kluge: following needs to know about lower-level SVG-related class
   updateSvgWidth = (event) => {
      const elt = document.querySelector('.category-rollup-svg-container');
      this.setState({ svgWidth: getStyle(elt, 'width') });
   }

   onKeydown = (event) => {
      if (event.key === 'ArrowLeft' && !this.state.contentPanelIsOpen) {
//      if (event.key === 'ArrowLeft') {
	 this.state.dotClickContext ? this.onNextPrevClick('prev') : this.onNextPrev('prev');
      } else if (event.key === 'ArrowRight' && !this.state.contentPanelIsOpen) {
//      } else if (event.key === 'ArrowRight') {
	 this.state.dotClickContext ? this.onNextPrevClick('next') : this.onNextPrev('next');
      } else if (this.state.dotClickContext && event.key === 'Enter') {
	 // Open content panel with (copy of) prior dot click context
	 this.setState({ dotClickContext: Object.assign({}, this.state.dotClickContext) });
      }
   }

   //
   // Callback function to record category/provider enable/disable
   //   parent:		'Category', 'Provider'
   //   rowName:	<category-name>/<provider-name>
   //   isEnabled:	the current state to record
   //
   setEnabled = this.setEnabled.bind(this);
   setEnabled(parent, rowName, isEnabled) {
      if (parent === 'Category') {
	 if (this.state.catsEnabled[rowName] !== isEnabled) {
	    let catsEnabled = Object.assign({}, this.state.catsEnabled, {[rowName]: isEnabled})
	    this.setState({catsEnabled: catsEnabled});
	 }
      } else {
	 // Provider
	 if (this.state.provsEnabled[rowName] !== isEnabled) {
	    let provsEnabled = Object.assign({}, this.state.provsEnabled, {[rowName]: isEnabled})
	    this.setState({provsEnabled: provsEnabled});
	 }
      }
   }

   //
   // Is 'dot' in the TimeWidget's active range?
   //
   isActiveTimeWidget = this.isActiveTimeWidget.bind(this);
   isActiveTimeWidget(dot) {
      return dot.position >= this.state.minActivePos && dot.position <= this.state.maxActivePos;
   }

   //
   // Mark a position-scaled copy of this dot with 'dotType' and include in result array
   //
   includeDot(result, dot, dotType, noExpand) {
      let min = this.state.minActivePos,
	  max = this.state.maxActivePos;
      if (noExpand || max - min > 0) {
	 result.push(Object.assign({dotType: dotType}, dot, noExpand ? {} : {position: (dot.position - min) / (max - min)}));
      }
      return result;
   }

   //
   // Callback function for this component's state, returning the requested array of position+date+dotType objects
   //	parent:		'CategoryRollup', 'Category', 'ProviderRollup', 'Provider', 'TimeWidget'
   //	rowName:	<category-name>/<provider-name>/'Full' or 'Active' (for TimeWidget)
   //   isEnabled:	'true' = render normally, 'false' = active dots become inactive
   //   fetchAll:	'true' = don't label dots with dotType, 'false' = label each dot with dotType
   //
   fetchDotPositions = this.fetchDotPositions.bind(this);
   fetchDotPositions(parent, rowName, isEnabled, fetchAll) {
      if (!this.props.resources || !this.props.dates || this.props.dates.allDates.length === 0) {
	 return [];
      } else {
	 let { startDate, endDate, allDates } = this.props.dates;
         let searchRefs = this.props.searchRefs;
	 let dotClickContext = this.state.dotClickContext;
	 let matchContext = dotClickContext && dotClickContext.parent === parent && dotClickContext.rowName === rowName;
	 let inactiveHighlightDots = matchContext && allDates.reduce((res, elt) =>
							 ((!isEnabled || !this.isActiveTimeWidget(elt)) && elt.position === dotClickContext.position)
								     ? this.includeDot(res, elt, 'inactive-highlight', parent === 'TimeWidget') : res, []);
	
	 let activeHighlightDots = matchContext && allDates.reduce((res, elt) =>
							 (isEnabled && this.isActiveTimeWidget(elt) && elt.position === dotClickContext.position)
								? this.includeDot(res, elt, 'active-highlight', parent === 'TimeWidget') : res, []);

	 let inactiveHighlightSearchDots = matchContext && searchRefs.reduce((res, elt) =>
							 ((!isEnabled || !this.isActiveTimeWidget(elt)) && elt.position === dotClickContext.position)
								? this.includeDot(res, elt, 'inactive-highlight-search', parent === 'TimeWidget') : res, []);

	 let activeHighlightSearchDots = matchContext && searchRefs.reduce((res, elt) =>
							 (isEnabled && this.isActiveTimeWidget(elt) && elt.position === dotClickContext.position)
								? this.includeDot(res, elt, 'active-highlight-search', parent === 'TimeWidget') : res, []);

	 let highlightDots = combine(inactiveHighlightDots, activeHighlightDots, inactiveHighlightSearchDots, activeHighlightSearchDots);

	 switch (parent) {
	    case 'ProviderRollup':
            case 'CategoryRollup':
	       if (fetchAll) {
		  return allDates;
	       } else {
		  return combine(//allDates.reduce((res, elt) => !this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'inactive') : res, []),
				 allDates.reduce((res, elt) => this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'active') : res, []),
//				 searchRefs.reduce((res, elt) => !this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'inactive-search') : res, []),
				 searchRefs.reduce((res, elt) => this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'active-search') : res, []),
				 highlightDots);
	       }

	    case 'Provider':
	       let provDates = cleanDates(this.props.resources.pathItem(`[*provider=${rowName}].itemDate`, this.queryOptions));
	       let normProvDates = normalizeDates(provDates, startDate, endDate);
	       let provDateObjs = provDates.map((date, index) => ({position: normProvDates[index], date: date}));
	       let provSearchRefs = searchRefs.filter( elt => elt.provider === rowName);
	       if (fetchAll) {
		  return provDateObjs;
	       } else {
		  return combine(//provDateObjs.reduce((res, elt) => !isEnabled || !this.isActiveTimeWidget(elt)
//									? this.includeDot(res, elt, 'inactive') : res, []),
				 provDateObjs.reduce((res, elt) => !isEnabled && this.isActiveTimeWidget(elt)
									? this.includeDot(res, elt, 'inactive') : res, []),
				 provDateObjs.reduce((res, elt) => isEnabled && this.isActiveTimeWidget(elt)
									? this.includeDot(res, elt, 'active') : res, []),
//				 provSearchRefs.reduce((res, elt) => !isEnabled || !this.isActiveTimeWidget(elt)
//									? this.includeDot(res, elt, 'inactive-search') : res, []),
				 provSearchRefs.reduce((res, elt) => !isEnabled && this.isActiveTimeWidget(elt)
									? this.includeDot(res, elt, 'inactive-search') : res, []),
				 provSearchRefs.reduce((res, elt) => isEnabled && this.isActiveTimeWidget(elt)
									? this.includeDot(res, elt, 'active-search') : res, []),
				 highlightDots);
	       }

            case 'Category':
	       let catDates = cleanDates(this.props.resources.pathItem(`[*category=${rowName}].itemDate`, this.queryOptions));
	       let normCatDates = normalizeDates(catDates, startDate, endDate);
	       let catDateObjs = catDates.map((date, index) => ({position: normCatDates[index], date: date}));
	       let catSearchRefs = searchRefs.filter( elt => elt.category === rowName);
	       if (fetchAll) {
		  return catDateObjs;
	       } else {
		  return combine(//catDateObjs.reduce((res, elt) => !isEnabled || !this.isActiveTimeWidget(elt)
//									? this.includeDot(res, elt, 'inactive') : res, []),
				 catDateObjs.reduce((res, elt) => !isEnabled && this.isActiveTimeWidget(elt)
									? this.includeDot(res, elt, 'inactive') : res, []),
				 catDateObjs.reduce((res, elt) => isEnabled && this.isActiveTimeWidget(elt)
									? this.includeDot(res, elt, 'active') : res, []),
//				 catSearchRefs.reduce((res, elt) => !isEnabled || !this.isActiveTimeWidget(elt)
//									? this.includeDot(res, elt, 'inactive-search') : res, []),
				 catSearchRefs.reduce((res, elt) => !isEnabled && this.isActiveTimeWidget(elt)
									? this.includeDot(res, elt, 'inactive-search') : res, []),
				 catSearchRefs.reduce((res, elt) => isEnabled && this.isActiveTimeWidget(elt)
									? this.includeDot(res, elt, 'active-search') : res, []),
				 highlightDots);
	       }

	    default:   // TimeWidget
	       if (fetchAll) {
		  return allDates;
	       } else if (rowName === 'Full') {
	          return combine(allDates.reduce((res, elt) => !this.isActiveTimeWidget(elt)
	       								? this.includeDot(res, elt, 'inactive', true) : res, []),
	       			 allDates.reduce((res, elt) => this.isActiveTimeWidget(elt)
	       								? this.includeDot(res, elt, 'active', true) : res, []),
	       			 searchRefs.reduce((res, elt) => !this.isActiveTimeWidget(elt)
	       								? this.includeDot(res, elt, 'inactive-search', true) : res, []),
	       			 searchRefs.reduce((res, elt) => this.isActiveTimeWidget(elt)
	       								? this.includeDot(res, elt, 'active-search', true) : res, []),
	       			 highlightDots);

	       } else {	// TODO: currently not using this case
		  alert('huh???');
	       	  return combine(allDates.reduce((res, elt) => this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'active') : res, []),
	       			 searchRefs.reduce((res, elt) => this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'active-search') : res, []));
	       }
	 }
      }
   }

   //
   // Return data for the clicked dot
   //    parent:	'CategoryRollup', 'Category', 'ProviderRollup', 'Provider'
   //    rowName:	<category-name>/<provider-name>
   //    date:		date of the clicked dot
   //
   fetchDataForDot = (parent, rowName, date) => {
       switch (parent) {
       case 'ProviderRollup':
	   // Return all resources for enabled providers matching the clicked date
	   return this.props.resources.pathItem(`[*itemDate=${date}]`);
	   
       case 'Provider':
	   // Return all resources matching the clicked provider and date
	   return this.props.resources.pathItem(`[*itemDate=${date}][*provider=${rowName}]`);

       case 'Category':
	   // Return all resources matching the clicked category and date
	   return this.props.resources.pathItem(`[*itemDate=${date}][*category=${rowName}]`);

       case 'CategoryRollup':
       default:
	   // Return all resources for enabled categories matching the clicked date
	   return this.props.resources.pathItem(`[*itemDate=${date}]`);
       }
   }

   //
   // Handle TimeWidget left/right thumb movement
   //   minActivePos:	location [0..1] of left thumb
   //   maxActivePos:	location [0..1] of right thumb
   //   isExpanded:	true if secondary (expanded) timeline visible
   //
   setLeftRight = this.setLeftRight.bind(this);
   setLeftRight(minActivePos, maxActivePos, isExpanded) {
//      console.log('minPos: ' + minActivePos + '  maxPos: ' + maxActivePos);
      this.setState({ minActivePos: minActivePos,
		      maxActivePos: maxActivePos,
		      timelineIsExpanded: isExpanded });
      // Return equivalent min/max dates
//      return {minDate: this.props.dates.allDates.find(elt => elt.position >= minActivePos).date,
//	      maxDate: this.props.dates.allDates.slice().reverse().find(elt => elt.position <= maxActivePos).date};
   }

   //
   // Handle next/prev arrow movements (no dotClickContext)
   //   direction:	'next' or 'prev'
   //
   onNextPrev = this.onNextPrev.bind(this);
   onNextPrev (direction) {
      let thumbDistance = this.state.maxActivePos - this.state.minActivePos;
      let oldPosition = direction === 'next' ? this.state.minActivePos : this.state.maxActivePos;
      let newPosition = 0;
      let dates = this.fetchDotPositions('CategoryRollup', 'Categories', true, true);
      let currDateIndex =  direction === 'next' ? dates.findIndex( elt => elt.position >= this.state.minActivePos )
						: dates.length - 1 - dates.slice().reverse().findIndex( elt => elt.position <= this.state.maxActivePos );

      if (currDateIndex === -1) {
	 // TODO: an error!
	 return;
      }

      // Determine next/prev date
      if (direction === 'next') {
	 if (currDateIndex === dates.length-1) {
	    // No 'next' -- do nothing
	    return;
	 } else {
	    newPosition = dates[currDateIndex+1].position;
	    // Adjust thumb positions
	    let newMax = Math.min(1.0, this.state.maxActivePos + newPosition - oldPosition);
	    this.setState({ minActivePos: newMax - thumbDistance, maxActivePos: newMax });
	 }
      } else {
	 // 'prev'
	 if (currDateIndex === 0) {
	    // No 'prev' -- do nothing
	    return false;
	 } else {
	    newPosition = dates[currDateIndex-1].position;
	    // Adjust thumb positions
	    let newMin = Math.max(0.0, this.state.minActivePos + newPosition - oldPosition);
	    this.setState({ minActivePos: newMin, maxActivePos: newMin + thumbDistance });
	 }
      }
   }

   //
   // Handle ContentPanel next/prev button clicks
   //   direction:	'next' or 'prev'
   // Returns true if the button should be enabled, else false
   //
   onNextPrevClick = this.onNextPrevClick.bind(this);
   onNextPrevClick (direction) {
      let thumbDistance = this.state.maxActivePos - this.state.minActivePos;
      let oldPosition = this.state.dotClickContext.position;
      let newContext = this.state.dotClickContext;
      let dates = this.fetchDotPositions(newContext.parent, newContext.rowName, true, true);
      let currDateIndex = dates.findIndex( elt => elt.date === newContext.date);

      let ret = false;

      if (currDateIndex === -1) {
	 // TODO: an error!
	 return false;
      }

      // Determine next/prev date
      if (direction === 'next') {
	 if (currDateIndex === dates.length-1) {
	    // No 'next' -- do nothing
	    return false;
	 } else {
	    newContext.date = dates[currDateIndex+1].date;
	    newContext.position = dates[currDateIndex+1].position;
	    ret = currDateIndex+1 < dates.length-1;
	    // Adjust thumb positions
	    let newMax = Math.min(1.0, this.state.maxActivePos + newContext.position - oldPosition);
	    this.setState({ minActivePos: newMax - thumbDistance, maxActivePos: newMax });
	 }
      } else {
	 // 'prev'
	 if (currDateIndex === 0) {
	    // No 'prev' -- do nothing
	    return false;
	 } else {
	    newContext.date = dates[currDateIndex-1].date;
	    newContext.position = dates[currDateIndex-1].position;
	    ret = currDateIndex-1 > 0;
	    // Adjust thumb positions
	    let newMin = Math.max(0.0, this.state.minActivePos + newContext.position - oldPosition);
	    this.setState({ minActivePos: newMin, maxActivePos: newMin + thumbDistance });
	 }
      }

      // Fetch new/appropriate data
      newContext.data = this.fetchDataForDot(newContext.parent, newContext.rowName, newContext.date);

      // Set state accordingly
      this.setState({ dotClickContext: newContext });

      return ret;
   }

   //
   // Handle dot clicks
   //   context = {
   //      parent:	   'CategoryRollup', 'Category', 'ProviderRollup', 'Provider', 'TimeWidget'
   //      rowName:	   <category-name>/<provider-name>
   //      dotType:	   type of the clicked dot (added below)
   //      minDate:	   date of the first dot for this row
   //      maxDate:	   date of the last dot for this row
   //      date:	   date of the clicked dot (added below)
   //      position:	   position of the clicked dot (added below)
   //	   data:	   data associated with the clicked dot (added below)
   //   } 
   //   date:		   date of the clicked dot
   //   dotType:	   'active', 'inactive', 'active-highlight', 'inactive-highlight', 'active-highlight-search', 'inactive-highlight-search'
   //
   onDotClick = (context, date, dotType) => {
      const rowDates = this.fetchDotPositions(context.parent, context.rowName, true, true);
      const position = rowDates.find(elt => elt.date === date).position;

      context.dotType = this.updateDotType(dotType, position, false);
      context.minDate = rowDates[0].date;
      context.maxDate = rowDates[rowDates.length-1].date;
      context.date = date;
      context.position = position;
      context.data = this.fetchDataForDot(context.parent, context.rowName, context.date);

      this.setState({ dotClickContext: context, contentPanelIsOpen: true });
   }

   updateDotType(dotType, position, forceSearch) {
      let isActivePos = position >= this.state.minActivePos && position <= this.state.maxActivePos;
      let isSearch = dotType.includes('search') || forceSearch;
      let parts = [];
      parts.push(isActivePos ? 'active' : 'inactive');
      parts.push('highlight');
      if (isSearch) {
	 parts.push('search');
      }
      return parts.join('-');
   }

   //
   // Handle Category/Provider expand/contract
   //    section:	'Categories', 'Providers'
   //	 expand:	true/false
   //
   onExpandContract = (section, expand) => {
      if (section === 'Categories') {
	 this.setState({ catsExpanded: expand });
      } else {
	 this.setState({ provsExpanded: expand });
      }
   }

   onCloseContentPanel = () => {
      this.setState({ contentPanelIsOpen: false });
      this.props.contentPanelIsOpenFn(false);
   }

   render() {
      let dates = this.props.dates;
      return (
         <div className='longitudinal-view'>
	    <TimeWidget startDate={dates ? dates.startDate : ''} endDate={dates ? dates.endDate : ''} thumbLeft={this.state.minActivePos}
			thumbRight={this.state.maxActivePos} timelineWidth={this.state.svgWidth} setLeftRightFn={this.setLeftRight}
			dotPositionsFn={this.fetchDotPositions} dotClickFn={this.onDotClick} />
	    <div className='longitudinal-view-categories-and-providers'>
	       <Categories>
	          <CategoryRollup key='rollup' svgWidth={this.state.svgWidth}
			          dotPositionsFn={this.fetchDotPositions} dotClickFn={this.onDotClick} expansionFn={this.onExpandContract} />
	          { this.state.catsExpanded ? [
		       <div className='longitudinal-view-category-nav-spacer-top' key='0' />,
	               this.props.categories && this.props.categories.map(
			  cat => <Category key={cat} svgWidth={this.state.svgWidth} categoryName={cat}
					   dotPositionsFn={this.fetchDotPositions} dotClickFn={this.onDotClick} enabledFn={this.setEnabled} /> ),
		       <div className='longitudinal-view-category-nav-spacer-bottom' key='1' />
		  ] : null }
	       </Categories>
	       { this.props.providers && this.props.providers.length > 1 ?
		  <Providers>
	             <ProviderRollup key='rollup' svgWidth={this.state.svgWidth}
				     dotPositionsFn={this.fetchDotPositions} dotClickFn={this.onDotClick} expansionFn={this.onExpandContract} />
		     { this.state.provsExpanded ? [
		        <div className='longitudinal-view-provider-nav-spacer-top' key='0' />,
		        this.props.providers.map(
			   prov => <Provider key={prov} svgWidth={this.state.svgWidth} providerName={prov}
					     dotPositionsFn={this.fetchDotPositions} dotClickFn={this.onDotClick} enabledFn={this.setEnabled} /> ),
		        <div className='longitudinal-view-provider-nav-spacer-bottom' key='1' />
		     ] : null }
	          </Providers> :
		  <div className='single-provider'>
		     <div className='single-provider-label'>Provider</div>
		     <div className='single-provider-name'>{this.props.providers && this.props.providers[0]}</div>
		  </div>
	       }
	    </div>
	    <ContentPanel open={this.state.contentPanelIsOpen} onClose={() => this.setState({contentPanelIsOpen: false})} context={this.state.dotClickContext}
			  catsEnabled={this.state.catsEnabled} provsEnabled={this.state.provsEnabled} nextPrevFn={this.onNextPrevClick}
			  resources={this.props.resources} />
	 </div>
      );
   }
}

//		  {/* TODO: change single-provider class names to have 'longitudinal-view-' prefix */}
