import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './StandardFilters.css';
import FhirTransform from '../../FhirTransform.js';
import { getStyle, combine, cleanDates, normalizeDates } from '../../util.js';
import TimeWidget from '../TimeWidget';
import CategoryRollup from '../CategoryRollup';
import Categories from '../Categories';
import Category from '../Category';
import ProviderRollup from '../ProviderRollup';
import Providers from '../Providers';
import Provider from '../Provider';

//
// Render the "container" for views of the participant's data
//
export default class StandardFilters extends Component {

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
      enabledFn: PropTypes.func.isRequired,
      dateRangeFn: PropTypes.func.isRequired,
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
      svgWidth: '0px'
   }

   componentDidMount() {
      this.updateSvgWidth();
   }

   componentDidUpdate(prevProps, prevState) {
      if (prevProps.lastEvent !== this.props.lastEvent) {
	 switch (this.props.lastEvent.type) {
// TODO: handle LongitudinalView
//	    case 'keydown':
//	       this.onKeydown(this.props.lastEvent);
//	       break;
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
	    this.props.enabledFn(catsEnabled, this.state.provsEnabled);
	    this.setState({catsEnabled: catsEnabled});
	 }
      } else {
	 // Provider
	 if (this.state.provsEnabled[rowName] !== isEnabled) {
	    let provsEnabled = Object.assign({}, this.state.provsEnabled, {[rowName]: isEnabled})
	    this.props.enabledFn(this.state.catsEnabled, provsEnabled);
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

   locToDate(pos) {
      let min = new Date(this.props.dates.startDate ? this.props.dates.startDate : 0).getTime();
      let max = new Date(this.props.dates.endDate ? this.props.dates.endDate : 0).getTime();
      let target = min + (max - min) * pos;
      return new Date(target).toISOString();
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
      this.props.dateRangeFn(this.locToDate(minActivePos), this.locToDate(maxActivePos));
      this.setState({ minActivePos: minActivePos,
		      maxActivePos: maxActivePos,
		      timelineIsExpanded: isExpanded });
      // Return equivalent min/max dates
//      return {minDate: this.props.dates.allDates.find(elt => elt.position >= minActivePos).date,
//	      maxDate: this.props.dates.allDates.slice().reverse().find(elt => elt.position <= maxActivePos).date};
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

//   fetchDotPositions = this.fetchDotPositions.bind(this);
//   fetchDotPositions(parent, rowName, isEnabled, fetchAll) {
//      // TODO: handle LongitudinalView
//      return [];
//   }
    
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

   onDotClick = (context, date, dotType) => {
      // TODO: handle LongitudinalView
   }

   // TODO: handle noDots for LongitudinalView
   render() {
      let dates = this.props.dates;
      return (
         <div className='standard-filters'>
	    <TimeWidget startDate={dates ? dates.startDate : ''} endDate={dates ? dates.endDate : ''} thumbLeft={this.state.minActivePos}
			thumbRight={this.state.maxActivePos} timelineWidth={this.state.svgWidth} setLeftRightFn={this.setLeftRight}
			dotPositionsFn={this.fetchDotPositions} dotClickFn={this.onDotClick} />
	    <div className='longitudinal-view-categories-and-providers'>
	       <Categories>
		  <CategoryRollup key='rollup' svgWidth={this.state.svgWidth} noDots={!this.state.timelineIsExpanded}
			          dotPositionsFn={this.fetchDotPositions} dotClickFn={this.onDotClick} expansionFn={this.onExpandContract} />
	          { this.state.catsExpanded ? [
		       <div className='longitudinal-view-category-nav-spacer-top' key='0' />,
	               this.props.categories && this.props.categories.map(
			  cat => <Category key={cat} svgWidth={this.state.svgWidth} categoryName={cat}
					   dotPositionsFn={this.fetchDotPositions} dotClickFn={this.onDotClick} enabledFn={this.setEnabled} /> ),
		       <div className='longitudinal-view-category-nav-spacer-bottom' key='1' />
		  ] : null }
	       </Categories>
	       { this.props.providers.length === 0 ? null :
		    this.props.providers.length > 1 ?
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
	    { this.props.children }
	 </div>
      );
   }
}
