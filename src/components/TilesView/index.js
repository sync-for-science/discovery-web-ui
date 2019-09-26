import React from 'react';
import PropTypes from 'prop-types';

import './TilesView.css';
import { getStyle, stringCompare, tryWithDefault, numericPart, normalizeDates, inDateRange, uniqueBy, notEqJSON, classFromCat } from '../../util.js';
import FhirTransform from '../../FhirTransform.js';
import { fhirKey, primaryTextValue } from '../../fhirUtil.js'

import Unimplemented from '../Unimplemented';
import ContentPanel from '../ContentPanel';

import DiscoveryContext from '../DiscoveryContext';

//
// Render the "tiles view" of the participant's data
//
export default class TilesView extends React.Component {

   static myName = 'TilesView';

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
      firstTileColNum: 0,
      leftColNavEnabled: true,
      rightColNavEnabled: true,
      uniqueStruct: this.buildUniqueStruct(),
      numVisibleCols: 0,
      selectedTiles: {},
      lastTileSelected: null,
      topBound: 0
   }

   componentDidMount() {
      this.setState({ numVisibleCols: this.numVisibleCols() });
      window.addEventListener('resize', this.onResize);

      if (this.context.savedSelectedTiles) {
	 this.setState({ selectedTiles: this.context.savedSelectedTiles });
	 this.props.viewAccentCallback(this.viewAccentDatesFromSelected(this.context.savedSelectedTiles));
      }

      if (this.context.lastTileSelected) {
	 this.setState({ lastTileSelected: this.context.lastTileSelected });
      }
   }

   componentWillUnmount() {
      this.props.viewAccentCallback([]);	// Clear accent dots
      this.context.updateGlobalContext({ savedSelectedTiles: this.state.selectedTiles,
				         lastTileSelected: this.state.lastTileSelected,		// Save selected tiles, last tile selected
					 highlightedResources: [],
					 lastHighlightedResources: [] });			// Clear highlights

      window.removeEventListener('resize', this.onResize);
   }

   componentDidUpdate(prevProps, prevState) {
      // TODO: only on explicit changes?
      if (notEqJSON(prevProps, this.props)) {
	 this.setState({ uniqueStruct: this.buildUniqueStruct() },
		       this.setState({ numVisibleCols: this.numVisibleCols() }));
      }
      // TODO: only on explicit changes?
      if (notEqJSON(prevState, this.state)) {
	 let container = document.querySelector('.tiles-view-container');
	 let header = document.querySelector('.tiles-view-column-header');
	 if (container && header) {
	    this.setState({ topBound: numericPart(getStyle(container, 'margin-top')) + header.clientHeight });
	 }
      }
   }

   onResize = () => {
      this.setState({ numVisibleCols: this.numVisibleCols() });
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
      const container = document.querySelector('.tiles-view-container');
      const tilesView = document.querySelector('.tiles-view');

      // Reset any prior size adjustment
      container.style = 'height:""';

      if (container.clientHeight > tilesView.clientHeight/2) {
	 container.style = `height:${tilesView.clientHeight/2}px;`;
      }

      return container.clientHeight + 25;	// TODO: correct margin sizes
   }

   onContentPanelResize() {
      const tilesViewHeight = document.querySelector('.tiles-view').clientHeight;
      const contentPanelHeight = document.querySelector('.content-panel-tiles-view').clientHeight;
      const container = document.querySelector('.tiles-view-container');
//      console.log('RESIZE tiles-view-container: ' + (tilesViewHeight - contentPanelHeight - 5));
      container.style = `height:${tilesViewHeight - contentPanelHeight - 5}px;`;
   }

   getCoding(res) {
      let codeObj = classFromCat(res.category).code(res);
      let code = tryWithDefault(codeObj, codeObj => codeObj.coding[0].code, tryWithDefault(codeObj, codeObj => codeObj.code, '????'));
//      let display = tryWithDefault(codeObj, codeObj => codeObj.coding[0].display,
//					    tryWithDefault(codeObj, codeObj => codeObj.text, tryWithDefault(codeObj, codeObj => codeObj.display, '????')));
      let display = primaryTextValue(codeObj);
      return { code, display };
   }

   // Categories we DON'T want to collect	[FROM CompareView]
   get noCollectCategories() {
       return ['Patient', 'Benefits', 'Claims', Unimplemented.catName];
   }

   //
   // collectUnique()		[DERIVED FROM CompareView]
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
	 if (this.noCollectCategories.includes(res.category) ||
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
      return struct;
   }

   numVisibleCols() {
      const numCols = Object.keys(this.state.uniqueStruct).length;
      const colWidth = 185;	// NOTE: DOM isn't fully built when we need this. Value MUST match tiles-view-column-container width (including margins)
      const container = document.querySelector('.tiles-view-container-inner');
      return container ? Math.min(numCols, Math.trunc(container.clientWidth / colWidth)) : 0;
   }

   hyphenate(name) {
      return name.toLowerCase().replace(/ /g, '-');
   }

   tileId(catName, display) {
      return this.hyphenate(catName) + ' ' + this.hyphenate(display);
   }

   parseTileId(id) {
      let idParts = id.split(' ');
      return { catName: idParts[0], display: idParts[1] };
   }

   isTileSelected(catName, display) {
      try {
	 return this.state.selectedTiles[catName][display];
      } catch (e) {
	 return false;
      }
   }

   isLastTileSelected(catName, display) {
      return this.state.lastTileSelected && (this.state.lastTileSelected.catName === catName) && (this.state.lastTileSelected.display === display);
   }

   matchingTileResources(catName, display) {
      return this.props.resources.transformed.filter(res => this.hyphenate(res.category) === catName &&
							    this.hyphenate(this.getCoding(res).display) === display);
   }

   // Get all resources from selectedUniqueItems
   allSelectedTileResources(selectedTiles) {
      let resArray = [];
      for (let catName of Object.keys(selectedTiles)) {
	 for (let displayStr of Object.keys(selectedTiles[catName])) {
	    resArray = resArray.concat(selectedTiles[catName][displayStr])
	 }
      }

      return resArray;
   }

   onTileClick(e) {
      let newSelectedTiles = Object.assign({}, this.state.selectedTiles);	// copy selected tiles obj
      let tileId = this.parseTileId(e.target.id);
      let matchingTileResources = null;

      if (this.isTileSelected(tileId.catName, tileId.display)) {
	 // Clear selection of the clicked tile
	 delete newSelectedTiles[tileId.catName][tileId.display];
	 // Clear lastTileSelected if matches
	 if (this.state.lastTileSelected && this.state.lastTileSelected.catName === tileId.catName && this.state.lastTileSelected.display === tileId.display) {
	    this.context.updateGlobalContext({ highlightedResources: [],
					       lastHighlightedResources: [] });
	    this.setState({ lastTileSelected: null });
	 }

      } else {
	 // Select the clicked tile
	 if (!newSelectedTiles[tileId.catName]) {
	    newSelectedTiles[tileId.catName] = {};
	 }
	 matchingTileResources = this.matchingTileResources(tileId.catName, tileId.display);
	 newSelectedTiles[tileId.catName][tileId.display] = matchingTileResources;
//	 this.context.updateGlobalContext({ highlightedResources: matchingTileResources });
	 this.context.updateGlobalContext({ highlightedResources: this.allSelectedTileResources(newSelectedTiles),
					    lastHighlightedResources: matchingTileResources });
	 let newDate = matchingTileResources[0].itemDate;
	 let newContext = Object.assign(this.state.context, { date: newDate,
							      position: normalizeDates([newDate], this.state.context.minDate, this.state.context.maxDate)[0],
							      dotType: 'active' });
	 this.setState({ lastTileSelected: tileId,
			 context: newContext
		       });
      }

      // If all/no tiles are now selected for this category, clear lastSavedSelectedTiles for this category
      let selectedTilesForCatCount = Object.keys(newSelectedTiles[tileId.catName]).length;
      // TODO: following is inefficient -- consider converting uniqueStruct to use "hyphenated" category names
      let tilesForCatCount = this.state.uniqueStruct[Object.keys(this.state.uniqueStruct).find(key => this.hyphenate(key) === tileId.catName)].length;
      if (this.context.lastSavedSelectedTiles && (selectedTilesForCatCount === 0 || selectedTilesForCatCount === tilesForCatCount)) {
	 let newLastSavedSelectedTiles = Object.assign({}, this.context.lastSavedSelectedTiles);
	 delete newLastSavedSelectedTiles[tileId.catName];
	 this.context.updateGlobalContext({ lastSavedSelectedTiles: newLastSavedSelectedTiles });
      }

      this.setState({ selectedTiles: newSelectedTiles });
      this.props.viewAccentCallback(this.viewAccentDatesFromSelected(newSelectedTiles));

      if (matchingTileResources) {
	 let latest = matchingTileResources.reduce((latest, elt) => new Date(elt.itemDate) > new Date(latest.itemDate) ? elt : latest,
						   matchingTileResources[0]);
	 // Delay a bit to allow resources to be rendered to the DOM
	 setTimeout(res => {
	    let key = fhirKey(res);
	    let elt = document.querySelector(`[data-fhir="${key}"]`);
	    if (elt) {
	       elt.scrollIntoView();
	    } else {
	       console.log(`onTileClick(): cannot scroll to "${key}"`);
	    }
	 }, 200, latest);
      }
   }

   // Get unique dates from selectedTiles
   viewAccentDatesFromSelected(selectedTiles) {
      let dateArray = [];
      for (let catName of Object.keys(selectedTiles)) {
	 for (let displayStr of Object.keys(selectedTiles[catName])) {
	    dateArray = dateArray.concat(selectedTiles[catName][displayStr].reduce((acc, res) => { acc.push(res.itemDate); return acc; }, []));
	 }
      }

      return uniqueBy(dateArray, elt => elt);
   }

   handleSetClearButtonClick = (catName) => {
      let hCatName = this.hyphenate(catName);
      let selectedTilesForCat = this.state.selectedTiles[hCatName];
      let selectedCount = selectedTilesForCat ? Object.keys(selectedTilesForCat).length : 0;
      let tilesForCatCount = this.state.uniqueStruct[catName].length;
      let newSelectedTiles = null;

      if (selectedCount === 0) {
	 // None selected
	 if (this.context.lastSavedSelectedTiles && this.context.lastSavedSelectedTiles[hCatName]) {
	    // --> prior saved partial
	    this.setState({ selectedTiles: this.context.lastSavedSelectedTiles });
	    this.props.viewAccentCallback(this.viewAccentDatesFromSelected(this.context.lastSavedSelectedTiles));

	 } else {
	    // --> all selected
	    newSelectedTiles = Object.assign({}, this.state.selectedTiles);	// copy selected tiles obj
	    if (!newSelectedTiles[hCatName]) {
	       newSelectedTiles[hCatName] = {};
	    }
	    for (let tile1 of this.state.uniqueStruct[catName]) {
	       let hDisplay1 = this.hyphenate(tile1.display);
	       newSelectedTiles[hCatName][hDisplay1] = this.matchingTileResources(hCatName, hDisplay1);
	    }
	    this.setState({ selectedTiles: newSelectedTiles });
	    this.props.viewAccentCallback(this.viewAccentDatesFromSelected(newSelectedTiles));
	 }

      } else if (selectedCount < tilesForCatCount) {
	 // Part selected --> all selected (and save copy of partial)
	 this.context.updateGlobalContext({ lastSavedSelectedTiles: JSON.parse(JSON.stringify(this.state.selectedTiles)) });
	 newSelectedTiles = Object.assign({}, this.state.selectedTiles);	// copy selected tiles obj
	 if (!newSelectedTiles[hCatName]) {
	    newSelectedTiles[hCatName] = {};
	 }
	 for (let tile2 of this.state.uniqueStruct[catName]) {
	    let hDisplay2 = this.hyphenate(tile2.display);
	    newSelectedTiles[hCatName][hDisplay2] = this.matchingTileResources(hCatName, hDisplay2);
	 }
	 this.setState({ selectedTiles: newSelectedTiles });
	 this.props.viewAccentCallback(this.viewAccentDatesFromSelected(newSelectedTiles));
	 // Clear lastTileSelected if matches
	 if (this.state.lastTileSelected && this.state.lastTileSelected.catName === hCatName) {
	    this.context.updateGlobalContext({ highlightedResources: [] });
	    this.setState({ lastTileSelected: null });
	 }

      } else {
	 // All selected --> none selected
	 newSelectedTiles = Object.assign({}, this.state.selectedTiles);	// copy selected tiles obj
	 delete newSelectedTiles[hCatName]
	 this.setState({ selectedTiles: newSelectedTiles });
	 this.props.viewAccentCallback(this.viewAccentDatesFromSelected(newSelectedTiles));
	 // Clear lastTileSelected if matches
	 if (this.state.lastTileSelected && this.state.lastTileSelected.catName === hCatName) {
	    this.context.updateGlobalContext({ highlightedResources: [] });
	    this.setState({ lastTileSelected: null });
	 }
      }
   }

   tileClassName(catName, display) {
      if (this.isLastTileSelected(catName, display)) {
	 return 'tile-standard-last';
      } else if (this.isTileSelected(catName, display)) {
	 return 'tile-standard-selected';
      } else {
	 return 'tile-standard';
      }
   }		 

   buttonClass(catName) {
      let selectedTilesForCat = this.state.selectedTiles[this.hyphenate(catName)];
      let selectedCount = selectedTilesForCat ? Object.keys(selectedTilesForCat).length : 0;
      let tilesForCatCount = this.state.uniqueStruct[catName].length;

      if (selectedCount === 0) return 'tiles-view-column-header-button-none';
      if (selectedCount < tilesForCatCount) return 'tiles-view-column-header-button-partial';
      return 'tiles-view-column-header-button-all';
   }

   renderTiles(catName) {
      let tiles = [];
//      for (let catInst of this.state.uniqueStruct[catName].sort((a, b) => {
//					let dispA = a.display.toUpperCase();
//					let dispB = b.display.toUpperCase();
//					return dispA < dispB ? -1 : (dispA > dispB ? 1 : 0)} )) {
      for (let catInst of this.state.uniqueStruct[catName].sort((a, b) => stringCompare(a.display, b.display))) {
	 let tileIdStr = this.tileId(catName, catInst.display);
	 let tileId = this.parseTileId(tileIdStr);
	 let count = catInst.provs.reduce((accum, prov) => accum + prov.count, 0);
			      
	 tiles.push(
	    <button className={this.tileClassName(tileId.catName, tileId.display)}
		    key={tileIdStr} id={tileIdStr} onClick={this.onTileClick.bind(this)}>
	       { catInst.display + (count > 1 ? ' [' + count + ']' : '') }
	    </button>
	 );
      }
      return tiles;
   }

   renderTileColumns() {
      let cols = [];
      // TODO: should be able to get this.state.numVisibleCols instead of calcing.... (state update issue)
      for (let catName of Object.keys(this.state.uniqueStruct).slice(this.state.firstTileColNum, this.state.firstTileColNum + this.numVisibleCols())) {
	 cols.push(
	    <div className={this.hyphenate(catName) + ' tiles-view-column-container'} key={catName}>
	       <div className='tiles-view-column-header'>
		  {catName}
		  <button className={this.buttonClass(catName)} onClick={() => this.handleSetClearButtonClick(catName)} />
	       </div> 
	       <div className='tiles-view-column-content'>
		  { this.renderTiles(catName) }
	       </div>
	    </div>
	 );
      }

      return cols;
   }

   // Collect resources matching all selected tiles (plus Patient)
   selectedTileResources() {
      let resArray = this.props.resources.transformed.filter(elt => elt.category === 'Patient');
      for (let catName of Object.keys(this.state.selectedTiles)) {
	 for (let displayStr of Object.keys(this.state.selectedTiles[catName])) {
	    resArray = resArray.concat(this.state.selectedTiles[catName][displayStr]);
	 }
      }

      return new FhirTransform(resArray, (data) => data);
   }

   onNavClick = (dir) => {
      if (dir === 'left') {
	 this.setState({ firstTileColNum: Math.max(0, this.state.firstTileColNum - 1) });
      } else {
	  let maxFirstTileColNum = Object.keys(this.state.uniqueStruct).length - this.state.numVisibleCols;
	  this.setState({ firstTileColNum: Math.min(maxFirstTileColNum, this.state.firstTileColNum + 1) });
      }
   }

   render() {
      let maxFirstTileColNum = Object.keys(this.state.uniqueStruct).length - this.state.numVisibleCols;
      return (
	 <div className='tiles-view'>  
	    <div className='tiles-view-container'>
	       <div className='tiles-view-nav-left'>
		  <button className={this.state.firstTileColNum > 0 ? 'tiles-view-nav-left-button-on' : 'tiles-view-nav-left-button-off'}
			  onClick={() => this.onNavClick('left')}/>
	       </div>
	       <div className='tiles-view-container-inner'>
		  { this.renderTileColumns() }
	       </div>
	       <div className='tiles-view-nav-right'>
		  <button className={this.state.firstTileColNum < maxFirstTileColNum ? 'tiles-view-nav-right-button-on' : 'tiles-view-nav-right-button-off'}
			  onClick={() => this.onNavClick('right')}/>
	       </div>
	    </div>
	    <ContentPanel open={true} catsEnabled={this.props.catsEnabled} provsEnabled={this.props.provsEnabled} dotClickFn={this.onDotClick}
			  containerClassName='content-panel-tiles-view'
			  topBoundFn={() => this.state.topBound} bottomBoundFn={this.contentPanelBottomBound}
			  initialPositionYFn={this.initialPositionY.bind(this)} onResizeFn={this.onContentPanelResize.bind(this)}
			  context={this.state.context} nextPrevFn={this.props.nextPrevFn}
			  thumbLeftDate={this.props.thumbLeftDate} thumbRightDate={this.props.thumbRightDate}
			  resources={this.selectedTileResources()} totalResCount={this.props.totalResCount}
			  viewName='Tiles' viewIconClass='tiles-view-icon' tileSort={true} noResultDisplay='Please select a Card above' />
	 </div>
      );
   }
}
