import React from 'react';
import PropTypes from 'prop-types';

import './CompareView.css';
//import config from '../../config.js';
import { getStyle, stringCompare, tryWithDefault, titleCase, numericPart,
	 normalizeDates, inDateRange, uniqueBy, notEqJSON, classFromCat } from '../../util.js';
import FhirTransform from '../../FhirTransform.js';
import { fhirKey, primaryTextValue } from '../../fhirUtil.js';

import Unimplemented from '../Unimplemented';
import Sparkline from '../Sparkline';
import ContentPanel from '../ContentPanel';

import DiscoveryContext from '../DiscoveryContext';

//
// Render the "compare view" of the participant's data
//
export default class CompareView extends React.Component {

   static myName = 'CompareView';

   static contextType = DiscoveryContext;	// Allow the shared context to be accessed via 'this.context'

   static propTypes = {
      resources: PropTypes.instanceOf(FhirTransform),
      totalResCount: PropTypes.number,
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
      categories: PropTypes.arrayOf(PropTypes.string).isRequired,
      providers: PropTypes.arrayOf(PropTypes.string).isRequired,
      catsEnabled: PropTypes.object.isRequired,
      provsEnabled: PropTypes.object.isRequired,
      thumbLeftDate: PropTypes.string.isRequired,
      thumbRightDate: PropTypes.string.isRequired,
      viewAccentCallback: PropTypes.func.isRequired,
      lastEvent: PropTypes.instanceOf(Event)
      // context, nextPrevFn added in StandardFilters
   }

   state = {
      context: this.props.context,
      uniqueStruct: {},
      selectedUniqueItems: {},
      lastUniqueItemSelected: null,
      topBound: 0,
      onlyMultisource: false
   }

   componentDidMount() {
      if (this.context.savedSelectedUniqueItems) {
	 this.setState({ selectedUniqueItems: this.context.savedSelectedUniqueItems });
	 this.props.viewAccentCallback(this.viewAccentDatesFromSelected(this.context.savedSelectedUniqueItems));
      }

      if (this.context.lastUniqueItemSelected) {
	 let last = this.context.lastUniqueItemSelected;
	 this.setState({ lastUniqueItemSelected: last });
	 this.context.updateGlobalContext({ lastHighlightedResources: this.matchingUniqueItemResources(last.catName, last.display) });
      }

      this.setState({ onlyMultisource: this.context.onlyMultisource },
		    this.setState({ uniqueStruct: this.buildUniqueStruct() }));
   }

   componentWillUnmount() {
      this.props.viewAccentCallback([]);	// Clear accent dots
      this.context.updateGlobalContext({ savedSelectedUniqueItems: this.state.selectedUniqueItems,
				         lastUniqueItemSelected: this.state.lastUniqueItemSelected,	// Save selected, last selected unique items
					 highlightedResources: [],
					 lastHighlightedResources: [] });				// Clear highlights
   }

   componentDidUpdate(prevProps, prevState) {
      // TODO: only on explicit changes?
      if (notEqJSON(prevProps, this.props) || prevState.onlyMultisource !== this.state.onlyMultisource) {
	 this.setState({ uniqueStruct: this.buildUniqueStruct() });
      }

      // TODO: only on explicit changes?
      if (notEqJSON(prevState, this.state)) {
	 let scroller = document.querySelector('.compare-view-scroller');
	 let header = document.querySelector('.compare-view-title-container');		// TODO: this might not be the best place to put the CP top bound...
	 if (scroller && header) {
	    this.setState({ topBound: numericPart(getStyle(scroller, 'margin-top')) + header.clientHeight });
	 }
      }
   }

   onDotClick = (context, date, dotType) => {

   }

   contentPanelBottomBound() {
      try {
	 const footTop = document.querySelector('.page-footer').getBoundingClientRect().top;
	 const headerBot = document.querySelector('.time-widget').getBoundingClientRect().bottom;
	 const contentPanelTitleHeight = document.querySelector('.content-panel-inner-title').clientHeight;

	 return footTop - headerBot - contentPanelTitleHeight - 10;	// TODO: correct margin size

      } catch (e) {
	 return 0;
      }
   }

   initialPositionY() {
      const scroller = document.querySelector('.compare-view-scroller');
      const compareView = document.querySelector('.compare-view');

      // Reset any prior size adjustment
      scroller.style = 'height:""';

      if (scroller.clientHeight > compareView.clientHeight/2) {
	 scroller.style = `height:${compareView.clientHeight/2}px;`;
      }

      return scroller.clientHeight + 25;	// TODO: correct margin sizes
   }

   onContentPanelResize() {
      const compareViewHeight = document.querySelector('.compare-view').clientHeight;
      const contentPanelHeight = document.querySelector('.content-panel-compare-view').clientHeight;
      const scroller = document.querySelector('.compare-view-scroller');
//      console.log('RESIZE compare-view-scroller: ' + (compareViewHeight - contentPanelHeight - 5));
      scroller.style = `height:${compareViewHeight - contentPanelHeight - 5}px;`;
   }

   getCoding(res) {
      let codeObj = classFromCat(res.category).code(res);
      let code = tryWithDefault(codeObj, codeObj => codeObj.coding[0].code, tryWithDefault(codeObj, codeObj => codeObj.code, '????'));
      let display = primaryTextValue(codeObj);
      return { code, display };
   }

   // Categories we DON'T want to compare on
   get noCompareCategories() {
       return ['Patient', 'Benefits', 'Claims', Unimplemented.catName];
   }

   //
   // collectUnique()
   //
   // Resulting structure ('struct'):
   // {
   //	cat1: [
   //      {
   //         display: 'disp1',
   //         codes: ['code1', 'code2', ...],
   //         provs: [
   //            {
   //               provName: 'prov1',
   //               count: count1,
   //		    minDate: 'date1',
   //		    maxDate: 'date2',
   //		    dates: [ {x: 'date', y: 0}, ... ]
   //            },
   //            ...
   //         ]
   //      },
   //      ...
   //   ],
   //   ...
   // }    
   //
   collectUnique(struct, cat, prov) {
      let resources = this.props.resources.pathItem(`[*category=${cat}][*provider=${prov}]`);
      for (let res of resources) {
	 if (this.noCompareCategories.includes(res.category) ||
	     !inDateRange(res.itemDate, this.props.thumbLeftDate, this.props.thumbRightDate)) {
	    break;
	 }

	 if (!struct.hasOwnProperty(cat)) {
	    // Add this category
	    struct[cat] = [];
//	    console.log('1 ' + cat + ' added');
	 }

	 let thisCat = struct[cat];
	 let coding = this.getCoding(res);
	 let thisDisplay = thisCat.find(elt => elt.display === coding.display);
	 let date = res.itemDate instanceof Date ? res.itemDate : new Date(res.itemDate);

	 if (thisDisplay) {
	    // Update previously added display value
	    let provs = thisDisplay.provs;
	    let thisProv = provs.find(elt => elt.provName === prov);
	    if (!thisDisplay.codes.includes(coding.code)) {
	       // Add this code to code list for this display value
	       thisDisplay.codes.push(coding.code);
	    }
	    if (thisProv) {
	       // Update previously added prov
	       thisProv.count++;
	       thisProv.minDate = date.getTime() < thisProv.minDate.getTime() ? date : thisProv.minDate;
	       thisProv.maxDate = date.getTime() > thisProv.maxDate.getTime() ? date : thisProv.maxDate;
	       thisProv.dates.push({x:date, y:0});
//	       console.log('2 ' + cat + ' ' + JSON.stringify(thisDisplay.codes) + ' ' + thisDisplay.display + ': ' + thisProv.provName + ' ' + thisProv.count);
	    } else {
	       // Add new prov
	       provs.push({ provName: prov, count: 1, minDate: date, maxDate: date, dates: [{x:date, y:0}] });
//	       console.log('3 ' + cat + ' ' + JSON.stringify(thisDisplay.codes) + ' ' + thisDisplay.display + ': ' + prov + ' 1');
	    }
	 } else {
	    // Add new display value
	    thisCat.push({ display: coding.display, codes: [coding.code],
			   provs: [{ provName: prov, count: 1, minDate: date, maxDate: date, dates: [{x:date, y:0}] }] });
//	    console.log('4 ' + cat + ' ' + coding.code + ' ' + coding.display + ': ' + prov + ' 1');
	 }
      }
   }
    
   buildUniqueStruct() {
      let struct = {};
      for (let catName of this.props.categories) {
	 if (this.props.catsEnabled[catName] !== false) {
	    for (let provName of this.props.providers) {
	       if (this.props.provsEnabled[provName] !== false) {
		  this.collectUnique(struct, catName, provName);
	       }
	    }
	 }
      }

      // Possibly prune if onlyMultisource
      if (this.state.onlyMultisource) {
	 for (let cat in struct) {
	    let pruned = struct[cat].filter(elt => elt.provs.length > 1);
	    if (pruned.length > 0) {
	       struct[cat] = pruned;
	    } else {
	       delete struct[cat];
	    }
	 }
      }

      return struct;
   }

   hyphenate(name) {
      return name.toLowerCase().replace(/ /g, '-');
   }

   uniqueItemId(catName, display) {
      return this.hyphenate(catName) + ' ' + this.hyphenate(display);
   }

   parseUniqueItemId(id) {
      let idParts = id.split(' ');
      return { catName: idParts[0], display: idParts[1] };
   }


   isUniqueItemSelected(catName, display) {
      try {
	 return this.state.selectedUniqueItems[this.hyphenate(catName)][this.hyphenate(display)];
      } catch (e) {
	 return false;
      }
   }

   isLastUniqueItemSelected(catName, display) {
      return this.state.lastUniqueItemSelected &&
	     this.state.lastUniqueItemSelected.catName === this.hyphenate(catName) &&
	     this.state.lastUniqueItemSelected.display === this.hyphenate(display);
   }

   matchingUniqueItemResources(catName, display) {
      return this.props.resources.transformed.filter(res => this.hyphenate(res.category) === catName &&
							    this.hyphenate(this.getCoding(res).display) === display);
   }

   // Get all resources from selectedUniqueItems
   allSelectedUniqueItemResources(selectedUniqueItems) {
      let resArray = [];
      for (let catName of Object.keys(selectedUniqueItems)) {
	 for (let displayStr of Object.keys(selectedUniqueItems[catName])) {
	    resArray = resArray.concat(selectedUniqueItems[catName][displayStr])
	 }
      }

      return resArray;
   }

   onUniqueItemClick = (e) => {
      let newSelectedUniqueItems = Object.assign({}, this.state.selectedUniqueItems);	// copy selected unique items obj
      let uniqueItemId = this.parseUniqueItemId(e.target.id);
      let matchingUniqueItemResources = null

      if (this.isUniqueItemSelected(uniqueItemId.catName, uniqueItemId.display)) {
	 // Clear selection of the just-clicked unique item
	 delete newSelectedUniqueItems[uniqueItemId.catName][uniqueItemId.display];
	 // Clear lastUniqueItemSelected if matches
	 if (this.state.lastUniqueItemSelected && this.state.lastUniqueItemSelected.catName === uniqueItemId.catName &&
	     this.state.lastUniqueItemSelected.display === uniqueItemId.display) {
	    this.context.updateGlobalContext({ highlightedResources: [],
					       lastHighlightedResources: [] });
	    this.setState({ lastUniqueItemSelected: null });
	 }

      } else {
	 // Select the clicked unique item
	 if (!newSelectedUniqueItems[uniqueItemId.catName]) {
	    newSelectedUniqueItems[uniqueItemId.catName] = {};
	 }
	 matchingUniqueItemResources = this.matchingUniqueItemResources(uniqueItemId.catName, uniqueItemId.display);
	 newSelectedUniqueItems[uniqueItemId.catName][uniqueItemId.display] = matchingUniqueItemResources;
	 this.context.updateGlobalContext({ highlightedResources: this.allSelectedUniqueItemResources(newSelectedUniqueItems),
					    lastHighlightedResources: matchingUniqueItemResources });
	 let newDate = matchingUniqueItemResources[0].itemDate;
	 let newContext = Object.assign(this.state.context, { date: newDate,
							      position: normalizeDates([newDate], this.state.context.minDate, this.state.context.maxDate)[0],
							      dotType: 'active' });
	 this.setState({ lastUniqueItemSelected: uniqueItemId,
			 context: newContext
		       });
      }

      // If all/no unique items are now selected for this category, clear lastSavedSelectedUniqueItems for this category
      let selectedUniqueItemsForCatCount = Object.keys(newSelectedUniqueItems[uniqueItemId.catName]).length;
      // TODO: following is inefficient -- consider converting uniqueStruct to use "hyphenated" category names
      let uniqueItemsForCatCount = this.state.uniqueStruct[Object.keys(this.state.uniqueStruct).find(key =>
							      this.hyphenate(key) === uniqueItemId.catName)].length;
      if (this.context.lastSavedSelectedUniqueItems && (selectedUniqueItemsForCatCount === 0 || selectedUniqueItemsForCatCount === uniqueItemsForCatCount)) {
	 let newLastSavedSelectedUniqueItems = Object.assign({}, this.context.lastSavedSelectedUniqueItems);
	 delete newLastSavedSelectedUniqueItems[uniqueItemId.catName];
	 this.context.updateGlobalContext({ lastSavedSelectedUniqueItems: newLastSavedSelectedUniqueItems });
      }

      this.setState({ selectedUniqueItems: newSelectedUniqueItems });
      this.props.viewAccentCallback(this.viewAccentDatesFromSelected(newSelectedUniqueItems));
      if (matchingUniqueItemResources) {
	 let latest = matchingUniqueItemResources.reduce((latest, elt) => new Date(elt.itemDate) > new Date(latest.itemDate) ? elt : latest,
							 matchingUniqueItemResources[0]);
	 // Delay a bit to allow resources to be rendered to the DOM
	 setTimeout(res => {
	    let key = fhirKey(res);
	    let elt = document.querySelector(`[data-fhir="${key}"]`);
	    if (elt) {
	       elt.scrollIntoView();
	    } else {
	       console.log(`onUniqueItemClick(): cannot scroll to "${key}"`);
	    }
	 }, 200, latest);
      }
   }

   // Get unique dates from selectedUniqueItems
   viewAccentDatesFromSelected(selectedUniqueItems) {
      let dateArray = [];
      for (let catName of Object.keys(selectedUniqueItems)) {
	 for (let displayStr of Object.keys(selectedUniqueItems[catName])) {
	    dateArray = dateArray.concat(selectedUniqueItems[catName][displayStr].reduce((acc, res) => { acc.push(res.itemDate); return acc; }, []));
	 }
      }

      return uniqueBy(dateArray, elt => elt);
   }

   buttonClassName(catName, display) {
      if (this.isLastUniqueItemSelected(catName, display)) {
	 return 'compare-view-record-button-selected-last';
      } else if (this.isUniqueItemSelected(catName, display)) {
	 return 'compare-view-record-button-selected';
      } else {
	 return 'compare-view-record-button';
      }
   }		 

   formatCount(count, onePre, onePost, multiPre, multiPost) {
       return (count === 1) ? onePre + onePost : multiPre + count + multiPost;
   }

   formatYearRange(minDate, maxDate, pre, post) {
      let minYear = minDate.getFullYear()+'';
      let maxYear = maxDate.getFullYear()+'';

      return minYear === maxYear ? pre + minYear + post : pre + minYear + ' \u2013 ' + maxYear + post;
  }

   renderProvsForUniqueItem(provs) {
      let minDate = new Date(this.props.dates.minDate);
      let maxDate = new Date(this.props.dates.maxDate);
      let divs = [];

      for (let thisProv of provs) {
	 divs.push(
	    <div className='compare-view-data-row' key={divs.length}>
	       <Sparkline className='compare-view-sparkline' minDate={minDate} maxDate={maxDate} data={thisProv.dates} />
	       {/*<div className='compare-view-date-range'>
		  { this.formatYearRange(thisProv.minDate, thisProv.maxDate) }
	       </div>*/}
	       <div className='compare-view-provider'>
		  {/* titleCase(thisProv.provName) + this.formatCount(thisProv.count, ' [', '', ' [', 'x, ')
		       + this.formatYearRange(thisProv.minDate, thisProv.maxDate, '', ']') */}
		  { titleCase(thisProv.provName) + this.formatYearRange(thisProv.minDate, thisProv.maxDate, ' [', ']') }
	       </div>
	    </div>);
      }

      return divs;
   }

   renderUniqueItemsForCat(catName) {
      let divs = [];
      for (let thisUnique of this.state.uniqueStruct[catName].sort((a, b) => stringCompare(a.display, b.display))) {
	 let count = thisUnique.provs.reduce((count, prov) => count + prov.count, 0);
	 divs.push(
	    <div className='compare-view-unique-item-container' key={divs.length}>
	       {/* <button className={this.buttonClassName(catName, thisUnique.display)} id={this.uniqueItemId(catName, thisUnique.display)}
		       onClick={this.onUniqueItemClick}>{thisUnique.display + this.formatCount(count, '', '', ' [', 'x]')}</button> */}
	       <button className={this.buttonClassName(catName, thisUnique.display)} id={this.uniqueItemId(catName, thisUnique.display)}
		       onClick={this.onUniqueItemClick}>{thisUnique.display + this.formatCount(count, '', '', ' [', ']')}</button>
	       <div className='compare-view-data-column'>
		  { this.renderProvsForUniqueItem(thisUnique.provs) }
	       </div>
	    </div>);
      }

      return divs;
   }

   renderUniqueItems() {
      let divs = [];

      for (let catName in this.state.uniqueStruct) {
	 divs.push(
	    <div className='compare-view-category-container' key={divs.length}>
	       <div className='compare-view-title-container'>
		  <div className='compare-view-title'>{catName}</div>
	       </div>
	       { this.renderUniqueItemsForCat(catName) }
	    </div>
	 );
      }

      return divs;
   }

   // Collect resources matching all selected unique items (plus Patient)
   selectedUniqueItemResources() {
      let resArray = this.props.resources.transformed.filter(elt => elt.category === 'Patient');
      for (let catName of Object.keys(this.state.selectedUniqueItems)) {
	 for (let displayStr of Object.keys(this.state.selectedUniqueItems[catName])) {
	    resArray = resArray.concat(this.state.selectedUniqueItems[catName][displayStr]);
	 }
      }

      return new FhirTransform(resArray, (data) => data);
   }

   onlyMultisourceChange = (event) => {
//      console.log('multisource change: ' + event.target.checked);
      this.setState({ onlyMultisource: event.target.checked });
      this.context.updateGlobalContext({ onlyMultisource: event.target.checked });
   }

   render() {
      return (
	 <div className='compare-view'>  
	    <div className='compare-view-header'>
	       <label className='compare-view-multisource-label'>
		  <input className='compare-view-multisource-check' type='checkbox' checked={this.state.onlyMultisource} onChange={this.onlyMultisourceChange}/>
		  Show only multi-sourced
	       </label>
	    </div>
	    <div className='compare-view-scroller'>
	       <div className='compare-view-all-unique-items'>
		  { this.renderUniqueItems() }
	       </div>
	    </div>
	    <ContentPanel open={true} catsEnabled={this.props.catsEnabled} provsEnabled={this.props.provsEnabled} dotClickFn={this.onDotClick}
			  containerClassName='content-panel-compare-view'
			  topBoundFn={() => this.state.topBound} bottomBoundFn={this.contentPanelBottomBound}
			  initialPositionYFn={this.initialPositionY.bind(this)} onResizeFn={this.onContentPanelResize.bind(this)}
			  context={this.state.context} nextPrevFn={this.props.nextPrevFn}
			  thumbLeftDate={this.props.thumbLeftDate} thumbRightDate={this.props.thumbRightDate}
			  resources={this.selectedUniqueItemResources()} totalResCount={this.props.totalResCount}
			  viewName='Compare' viewIconClass='compare-view-icon' tileSort={true}
			  noResultDisplay={Object.keys(this.state.selectedUniqueItems).length > 0 ? 'No matching data' : 'Please select a Card above'} />
	 </div>
      );
   }
}
