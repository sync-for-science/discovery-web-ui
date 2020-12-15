import React from 'react';
import PropTypes from 'prop-types';

import './TilesView.css';
import config from '../../config.js';
import {
  Const, getStyle, stringCompare, tryWithDefault, numericPart, inDateRange, uniqueBy, notEqJSON, classFromCat,
} from '../../util.js';
import FhirTransform from '../../FhirTransform.js';
import { fhirKey, primaryTextValue } from '../../fhirUtil.js';

import Unimplemented from '../Unimplemented';
import ContentPanel from '../ContentPanel';

import DiscoveryContext from '../DiscoveryContext';

//
// Render the "tiles view" of the participant's data
//
export default class TilesView extends React.Component {
  static myName = 'TilesView';

  static contextType = DiscoveryContext; // Allow the shared context to be accessed via 'this.context'

  static propTypes = {
    resources: PropTypes.instanceOf(FhirTransform),
    totalResCount: PropTypes.number,
    dates: PropTypes.shape({
      allDates: PropTypes.arrayOf(PropTypes.shape({
        position: PropTypes.number.isRequired,
        date: PropTypes.string.isRequired,
      })).isRequired,
      minDate: PropTypes.string.isRequired, // Earliest date we have data for this participant
      startDate: PropTypes.string.isRequired, // Jan 1 of minDate's year
      maxDate: PropTypes.string.isRequired, // Latest date we have data for this participant
      endDate: PropTypes.string.isRequired, // Dec 31 of last year of timeline tick periods
    }),
    categories: PropTypes.arrayOf(PropTypes.string).isRequired,
    providers: PropTypes.arrayOf(PropTypes.string).isRequired,
    catsEnabled: PropTypes.object.isRequired,
    provsEnabled: PropTypes.object.isRequired,
    thumbLeftDate: PropTypes.string.isRequired,
    thumbRightDate: PropTypes.string.isRequired,
    lastEvent: PropTypes.instanceOf(Event),
    // context, nextPrevFn added in StandardFilters
  }

  state = {
    context: this.props.context,
    firstTileColNum: 0,
    leftColNavEnabled: true,
    rightColNavEnabled: true,
    uniqueStruct: {},
    numVisibleCols: 0,
    selectedTiles: {},
    lastTileSelected: null,
    topBound: 0,
    onlyMultisource: false,
  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize);

    if (this.context.savedSelectedTiles) {
      this.setState({ selectedTiles: this.context.savedSelectedTiles });
      this.context.updateGlobalContext({ viewAccentDates: this.viewAccentDatesFromSelected(this.context.savedSelectedTiles) });
    }

    if (this.context.lastTileSelected) {
      const last = this.context.lastTileSelected;
      this.setState({ lastTileSelected: last });

      const lastResources = this.matchingTileResources(last);
      this.context.updateGlobalContext({
        lastHighlightedResources: lastResources,
        viewLastAccentDates: this.uniqueDatesFromResources(lastResources),
      });
    }

    this.setState({ onlyMultisource: this.context.onlyMultisource },
      () => this.setState({ uniqueStruct: this.buildUniqueStruct() },
        () => this.setState({ numVisibleCols: this.numVisibleCols() })));
  }

  componentWillUnmount() {
    this.context.updateGlobalContext({
      savedSelectedTiles: this.state.selectedTiles,
      lastTileSelected: this.state.lastTileSelected, // Save selected tiles, last tile selected
      viewAccentDates: [],
      viewLastAccentDates: [],
      highlightedResources: [],
      lastHighlightedResources: [],
    }); // Clear highlights

    window.removeEventListener('resize', this.onResize);
  }

  componentDidUpdate(prevProps, prevState) {
    debugger;
    // TODO: only on explicit changes?
    if (notEqJSON(prevProps, this.props) || prevState.onlyMultisource !== this.state.onlyMultisource) {
      this.setState({ uniqueStruct: this.buildUniqueStruct() },
        () => this.setState({ firstTileColNum: 0, numVisibleCols: this.numVisibleCols() }));
    }

    // TODO: only on explicit changes?
    if (notEqJSON(prevState, this.state)) {
      const container = document.querySelector('.tiles-view-container');
      const header = document.querySelector('.tiles-view-column-header');
      if (container && header) {
        this.setState({ topBound: numericPart(getStyle(container, 'margin-top')) + header.clientHeight });
      }
    }

    // Kluge: get saved tile state if not set in mount (and then clear)
    if (this.context.savedSelectedTiles && Object.keys(this.context.savedSelectedTiles).length > 0
      && this.state.selectedTiles && Object.keys(this.state.selectedTiles).length === 0) {
      this.setState({ selectedTiles: this.context.savedSelectedTiles });
      this.context.updateGlobalContext({
        viewAccentDates: this.viewAccentDatesFromSelected(this.context.savedSelectedTiles),
        savedSelectedTiles: {},
      });
    }

    if (this.context.lastTileSelected && !this.state.lastTileSelected) {
      const last = this.context.lastTileSelected;
      this.setState({ lastTileSelected: last });

      const lastResources = this.matchingTileResources(last);
      this.context.updateGlobalContext({
        lastHighlightedResources: lastResources,
        viewLastAccentDates: this.uniqueDatesFromResources(lastResources),
        lastTileSelected: null,
      });
    }
  }

  onResize = () => {
    this.setState({ numVisibleCols: this.numVisibleCols() });
  }

  contentPanelBottomBound() {
    try {
      const footTop = document.querySelector('.page-footer').getBoundingClientRect().top;
      const headerBot = document.querySelector('.time-widget').getBoundingClientRect().bottom;
      const contentPanelTitleHeight = document.querySelector('.content-panel-inner-title').clientHeight;

      return footTop - headerBot - contentPanelTitleHeight - 10; // TODO: correct margin size
    } catch (e) {
      return 0;
    }
  }

  initialPositionY() {
    const container = document.querySelector('.tiles-view-container');
    const tilesView = document.querySelector('.tiles-view');

    // Reset any prior size adjustment
    container.style = 'height:""';

    if (container.clientHeight > tilesView.clientHeight / 1.6) {
      container.style = `height:${tilesView.clientHeight / 1.6}px;`;
    }

    return container.clientHeight + 25; // TODO: correct margin sizes
  }

  onContentPanelResize() {
    const tilesViewHeight = document.querySelector('.tiles-view').clientHeight;
    const contentPanelHeight = document.querySelector('.content-panel-tiles-view').clientHeight;
    const container = document.querySelector('.tiles-view-container');
    //      console.log('RESIZE tiles-view-container: ' + (tilesViewHeight - contentPanelHeight - 5));
    container.style = `height:${tilesViewHeight - contentPanelHeight - 5}px;`;
  }

  getCoding(res) {
    const codeObj = classFromCat(res.category).code(res);
    const code = tryWithDefault(codeObj, (codeObj) => codeObj.coding[0].code, tryWithDefault(codeObj, (codeObj) => codeObj.code, '????'));
    const display = primaryTextValue(codeObj);
    return { code, display: display === Const.unknownValue ? `All ${res.category}` : display };
  }

  // Categories we DON'T want to collect  [FROM CompareView]
  get noCollectCategories() {
    return ['Patient'];
  }

  //
  // collectUnique()    [DERIVED FROM CompareView]
  //
  // Resulting structure ('struct'):
  // {
  //  cat1: [
  //      {
  //         display: 'disp1',
  //         trueCategory: 'category',
  //         codes: ['code1', 'code2', ...],
  //         provs: [
  //            {
  //               provName: 'prov1',
  //               count: count1,
  //        minDate: 'date1',
  //        maxDate: 'date2',
  //        dates: [ {x: 'date', y: 0}, ... ]
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
    const resources = cat === Unimplemented.catName ? this.props.resources.transformed.filter((res) => Unimplemented.unimplementedCats.includes(res.category)
      && res.provider === prov)
      : this.props.resources.pathItem(`[*category=${cat}][*provider=${prov}]`);
    for (const res of resources) {
      if (this.noCollectCategories.includes(res.category)
        || !inDateRange(res.itemDate, this.props.thumbLeftDate, this.props.thumbRightDate)) {
        continue; // Ignore this resource
      }

      if (!struct.hasOwnProperty(cat)) {
        // Add this category
        struct[cat] = [];
        //      console.log('1 ' + cat + ' added');
      }

      const thisCat = struct[cat];
      const coding = cat === Unimplemented.catName ? { code: res.category, display: `All ${res.category}` }
        : this.getCoding(res);
      const thisDisplay = thisCat.find((elt) => elt.display === coding.display);
      const date = res.itemDate instanceof Date ? res.itemDate : new Date(res.itemDate);

      if (thisDisplay) {
        // Update previously added display value
        const { provs } = thisDisplay;
        const thisProv = provs.find((elt) => elt.provName === prov);
        if (!thisDisplay.codes.includes(coding.code)) {
          // Add this code to code list for this display value
          thisDisplay.codes.push(coding.code);
        }
        if (thisProv) {
          // Update previously added prov
          thisProv.count++;
          thisProv.minDate = date.getTime() < thisProv.minDate.getTime() ? date : thisProv.minDate;
          thisProv.maxDate = date.getTime() > thisProv.maxDate.getTime() ? date : thisProv.maxDate;
          thisProv.dates.push({ x: date, y: 0 });
          //         console.log('2 ' + cat + ' ' + JSON.stringify(thisDisplay.codes) + ' ' + thisDisplay.display + ': ' + thisProv.provName + ' ' + thisProv.count);
        } else {
          // Add new prov
          provs.push({
            provName: prov, count: 1, minDate: date, maxDate: date, dates: [{ x: date, y: 0 }],
          });
          //         console.log('3 ' + cat + ' ' + JSON.stringify(thisDisplay.codes) + ' ' + thisDisplay.display + ': ' + prov + ' 1');
        }
      } else {
        // Add new display value
        thisCat.push({
          display: coding.display,
          trueCategory: res.category,
          codes: [coding.code],
          provs: [{
            provName: prov, count: 1, minDate: date, maxDate: date, dates: [{ x: date, y: 0 }],
          }],
        });
        //      console.log('4 ' + cat + ' ' + coding.code + ' ' + coding.display + ': ' + prov + ' 1');
      }
    }
  }

  buildUniqueStruct() {
    const struct = {};
    for (const catName of this.props.categories) {
      if (this.props.catsEnabled[catName] !== false) {
        for (const provName of this.props.providers) {
          if (this.props.provsEnabled[provName] !== false) {
            this.collectUnique(struct, catName, provName);
          }
        }
      }
    }

    // Possibly prune if onlyMultisource
    if (this.state.onlyMultisource) {
      for (const cat in struct) {
        const pruned = struct[cat].filter((elt) => elt.provs.length > 1);
        if (pruned.length > 0) {
          struct[cat] = pruned;
        } else {
          delete struct[cat];
        }
      }
    }

    return struct;
  }

  numVisibleCols() {
    const container = document.querySelector('.tiles-view-container-inner');
    if (!container) {
      return 0;
    }
    const minFractionalColWidth = 15;
    const numCols = Object.keys(this.state.uniqueStruct).length;
    const colWidth = 175; // Values MUST match tiles-view-column-container width and margins (px)
    const colRightMargin = 10;
    const totalColWidth = colWidth + colRightMargin; // NOTE: DOM isn't fully built when we need this
    const containerWidth = container.clientWidth + colRightMargin; // Browser doesn't "count" last margin
    const visibleCols = containerWidth / totalColWidth;
    const wholeCols = Math.trunc(visibleCols);
    const fractionalCol = visibleCols - wholeCols;
    const fractionalColWidth = fractionalCol * totalColWidth; // px
    //   console.log('#### containerWidth: ' + containerWidth);
    //   console.log('#### visibleCols:    ' + visibleCols.toFixed(3));
    //   console.log('#### fracColWidth:   ' + fractionalColWidth.toFixed(3));

    return Math.min(numCols, fractionalColWidth < minFractionalColWidth ? wholeCols : containerWidth / totalColWidth);
  }

  hyphenate(name) {
    return name.toLowerCase().replace(/ /g, '-');
  }

  tileId(catName, display, trueCategory) {
    return `${this.hyphenate(catName)} ${this.hyphenate(display)} ${trueCategory}`;
  }

  parseTileId(id) {
    const idParts = id.split(' ');
    return { catName: idParts[0], display: idParts[1], trueCategory: idParts.slice(2).join(' ') };
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

  matchingTileResources(tileId) {
    let res = this.props.resources.transformed.filter((res) => this.hyphenate(res.category) === tileId.catName
      && this.hyphenate(this.getCoding(res).display) === tileId.display);
    if (res.length === 0) {
      // Kluge for 'other'
      res = this.props.resources.transformed.filter((res) => res.category === tileId.trueCategory);
    }

    return res;
  }

  // Get all resources from selectedUniqueItems
  allSelectedTileResources(selectedTiles) {
    let resArray = [];
    for (const catName of Object.keys(selectedTiles)) {
      for (const displayStr of Object.keys(selectedTiles[catName])) {
        resArray = resArray.concat(selectedTiles[catName][displayStr]);
      }
    }

    return resArray;
  }

  onTileClick(e) {
    const newSelectedTiles = { ...this.state.selectedTiles }; // copy selected tiles obj
    const tileId = this.parseTileId(e.target.id);
    let matchingTileResources = null;
    let clearedPrevSelected = false;

    if (this.isTileSelected(tileId.catName, tileId.display)) {
      if (Object.keys(newSelectedTiles[tileId.catName]).length === 1) {
        // Delete category
        delete newSelectedTiles[tileId.catName];
      } else {
        // Clear selection of the just-clicked tile
        delete newSelectedTiles[tileId.catName][tileId.display];
      }
      clearedPrevSelected = true;
      this.context.updateGlobalContext({
        highlightedResources: [], // Used by HighlightDiv
        lastHighlightedResources: [],
      }); //
      this.setState({ lastTileSelected: null });
    } else {
      // Select the clicked tile
      if (!newSelectedTiles[tileId.catName]) {
        newSelectedTiles[tileId.catName] = {};
      }
      matchingTileResources = this.matchingTileResources(tileId);
      newSelectedTiles[tileId.catName][tileId.display] = matchingTileResources;
      this.context.updateGlobalContext({
        highlightedResources: this.allSelectedTileResources(newSelectedTiles), // Used by HighlightDiv
        lastHighlightedResources: matchingTileResources,
      }); //
      //   let newDate = matchingTileResources[0].itemDate;
      //   let newContext = Object.assign(this.state.context, { date: newDate,
      //                    position: normalizeDates([newDate], this.state.context.minDate, this.state.context.maxDate)[0],
      //                    dotType: 'active' });
      this.setState({
        lastTileSelected: tileId,
        //       context: newContext
      });
    }

    // If all/no tiles are now selected for this category, clear lastSavedSelectedTiles for this category
    const selectedTilesForCatCount = newSelectedTiles[tileId.catName] ? Object.keys(newSelectedTiles[tileId.catName]).length : 0;
    // TODO: following is inefficient -- consider converting uniqueStruct to use "hyphenated" category names
    const tilesForCatCount = this.state.uniqueStruct[Object.keys(this.state.uniqueStruct).find((key) => this.hyphenate(key) === tileId.catName)].length;
    if (this.context.lastSavedSelectedTiles && (selectedTilesForCatCount === 0 || selectedTilesForCatCount === tilesForCatCount)) {
      const newLastSavedSelectedTiles = { ...this.context.lastSavedSelectedTiles };
      delete newLastSavedSelectedTiles[tileId.catName];
      this.context.updateGlobalContext({ lastSavedSelectedTiles: newLastSavedSelectedTiles });
    }

    this.setState({ selectedTiles: newSelectedTiles });
    this.context.updateGlobalContext({
      viewAccentDates: this.viewAccentDatesFromSelected(newSelectedTiles),
      viewLastAccentDates: clearedPrevSelected ? [] : this.uniqueDatesFromResources(this.matchingTileResources(tileId)),
    });

    // Scroll to the latest resource of the clicked tile
    if (matchingTileResources) {
      const latest = matchingTileResources.reduce((latest, elt) => (new Date(elt.itemDate) > new Date(latest.itemDate) ? elt : latest),
        matchingTileResources[0]);
      // Delay a bit to allow resources to be rendered to the DOM
      setTimeout((res) => {
        const key = fhirKey(res);
        const elt = document.querySelector(`[data-fhir="${key}"]`);
        if (elt) {
          elt.scrollIntoView();
        } else {
          console.log(`onTileClick(): cannot scroll to "${key}"`);
        }
      }, 200, latest);
    }
  }

  // Get unique dates from resources
  uniqueDatesFromResources(resArray) {
    const dates = resArray.reduce((acc, res) => { acc.push(res.itemDate); return acc; }, []);
    return uniqueBy(dates, (elt) => elt);
  }

  // Get unique dates from selectedTiles
  // TODO: delete & replace calls with uniqueDatesFromResources(allSelectedTileResources(selectedTiles))
  viewAccentDatesFromSelected(selectedTiles) {
    let dateArray = [];
    if (selectedTiles) {
      for (const catName of Object.keys(selectedTiles)) {
        for (const displayStr of Object.keys(selectedTiles[catName])) {
          dateArray = dateArray.concat(selectedTiles[catName][displayStr].reduce((acc, res) => { acc.push(res.itemDate); return acc; }, []));
        }
      }
    }

    return uniqueBy(dateArray, (elt) => elt);
  }

  handleSetClearButtonClick = (catName) => {
    const hCatName = this.hyphenate(catName);
    const selectedTilesForCat = this.state.selectedTiles[hCatName];
    const selectedCount = selectedTilesForCat ? Object.keys(selectedTilesForCat).length : 0;
    const tilesForCatCount = this.state.uniqueStruct[catName].length;
    let newSelectedTiles = null;

    if (selectedCount === 0) {
      // None selected
      if (this.context.lastSavedSelectedTiles && this.context.lastSavedSelectedTiles[hCatName]) {
        // --> prior saved partial
        this.setState({ selectedTiles: this.context.lastSavedSelectedTiles });
        this.context.updateGlobalContext({ viewAccentDates: this.viewAccentDatesFromSelected(this.context.lastSavedSelectedTiles) });
      } else {
        // --> all selected
        newSelectedTiles = { ...this.state.selectedTiles }; // copy selected tiles obj
        if (!newSelectedTiles[hCatName]) {
          newSelectedTiles[hCatName] = {};
        }
        for (const tile1 of this.state.uniqueStruct[catName]) {
          const hDisplay1 = this.hyphenate(tile1.display);
          newSelectedTiles[hCatName][hDisplay1] = this.matchingTileResources({ catName: hCatName, display: hDisplay1, trueCategory: tile1.trueCategory });
        }
        this.setState({ selectedTiles: newSelectedTiles });
        this.context.updateGlobalContext({ viewAccentDates: this.viewAccentDatesFromSelected(newSelectedTiles) });
      }
    } else if (selectedCount < tilesForCatCount) {
      // Part selected --> all selected (and save copy of partial)
      this.context.updateGlobalContext({ lastSavedSelectedTiles: JSON.parse(JSON.stringify(this.state.selectedTiles)) });
      newSelectedTiles = { ...this.state.selectedTiles }; // copy selected tiles obj
      if (!newSelectedTiles[hCatName]) {
        newSelectedTiles[hCatName] = {};
      }
      for (const tile2 of this.state.uniqueStruct[catName]) {
        const hDisplay2 = this.hyphenate(tile2.display);
        newSelectedTiles[hCatName][hDisplay2] = this.matchingTileResources({ catName: hCatName, display: hDisplay2, trueCategory: tile2.trueCategory });
      }
      this.setState({ selectedTiles: newSelectedTiles });
      this.context.updateGlobalContext({
        viewAccentDates: this.viewAccentDatesFromSelected(newSelectedTiles),
        viewLastAccentDates: [],
      });
      // Clear lastTileSelected if matches
      if (this.state.lastTileSelected && this.state.lastTileSelected.catName === hCatName) {
        this.context.updateGlobalContext({ highlightedResources: [] });
        this.setState({ lastTileSelected: null });
      }
    } else {
      // All selected --> none selected
      newSelectedTiles = { ...this.state.selectedTiles }; // copy selected tiles obj
      delete newSelectedTiles[hCatName];
      this.setState({ selectedTiles: newSelectedTiles });
      this.context.updateGlobalContext({
        viewAccentDates: this.viewAccentDatesFromSelected(newSelectedTiles),
        viewLastAccentDates: [],
      });
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
    } if (this.isTileSelected(catName, display)) {
      return 'tile-standard-selected';
    }
    return 'tile-standard';
  }

  buttonClass(catName) {
    const selectedTilesForCat = this.state.selectedTiles[this.hyphenate(catName)];
    const selectedCount = selectedTilesForCat ? Object.keys(selectedTilesForCat).length : 0;
    const tilesForCatCount = this.state.uniqueStruct[catName].length;

    if (selectedCount === 0) return 'tiles-view-column-header-button-none';
    if (selectedCount < tilesForCatCount) return 'tiles-view-column-header-button-partial';
    return 'tiles-view-column-header-button-all';
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
    return this.props.noResultDisplay ? this.props.noResultDisplay : 'No data found for the selected Records, Providers, and Time period';
  }

  renderTiles(catName) {
    const tiles = [];
    for (const catInst of this.state.uniqueStruct[catName].sort((a, b) => stringCompare(a.display, b.display))) {
      const tileIdStr = this.tileId(catName, catInst.display, catInst.trueCategory);
      const tileId = this.parseTileId(tileIdStr);
      const count = catInst.provs.reduce((accum, prov) => accum + prov.count, 0);

      tiles.push(
        <button
          className={this.tileClassName(tileId.catName, tileId.display)}
          key={tileIdStr}
          id={tileIdStr}
          onClick={this.onTileClick.bind(this)}
        >
          { catInst.display + (count > 1 ? ` [${count}]` : '') }
        </button>,
      );
    }
    return tiles;
  }

  renderTileColumns() {
    const cols = [];
    for (const catName of Object.keys(this.state.uniqueStruct).slice(this.state.firstTileColNum,
      this.state.firstTileColNum + Math.ceil(this.state.numVisibleCols))) {
      cols.push(
        <div className={`${this.hyphenate(catName)} tiles-view-column-container`} key={catName}>
          <div className="tiles-view-column-header">
            {catName}
            <button className={this.buttonClass(catName)} onClick={() => this.handleSetClearButtonClick(catName)} />
          </div>
          <div className="tiles-view-column-content">
            { this.renderTiles(catName) }
          </div>
        </div>,
      );
    }

    if (cols.length === 0) {
      cols.push(
        <div className="tiles-view-container-inner-empty" key="1">
          { this.noResultDisplay }
        </div>,
      );
    }

    return cols;
  }

  // Collect resources matching all selected tiles (plus Patient)
  selectedTileResources() {
    let resArray = this.props.resources.transformed.filter((elt) => elt.category === 'Patient');
    for (const catName of Object.keys(this.state.selectedTiles)) {
      for (const displayStr of Object.keys(this.state.selectedTiles[catName])) {
        if (!this.state.onlyMultisource
          || (this.state.onlyMultisource // more than one provider?
            && this.state.selectedTiles[catName][displayStr].reduce((provs, res) => provs.add(res.provider), new Set()).size > 1)) {
          resArray = resArray.concat(this.state.selectedTiles[catName][displayStr]);
        }
      }
    }

    return new FhirTransform(resArray, (data) => data);
  }

  onNavClick = (dir) => {
    if (dir === 'left') {
      this.setState({ firstTileColNum: Math.max(0, this.state.firstTileColNum - 1) });
    } else {
      const maxFirstTileColNum = Object.keys(this.state.uniqueStruct).length - Math.trunc(this.state.numVisibleCols);
      this.setState({ firstTileColNum: Math.min(maxFirstTileColNum, this.state.firstTileColNum + 1) });
    }
  }

  onlyMultisourceChange = (event) => {
    //      console.log('multisource change: ' + event.target.checked);
    this.setState({ onlyMultisource: event.target.checked });
    this.context.updateGlobalContext({ onlyMultisource: event.target.checked });
  }

  onClearClick = () => {
    this.setState({
      selectedTiles: {},
      lastTileSelected: null,
    });
    this.context.updateGlobalContext({
      viewAccentDates: [],
      viewLastAccentDates: [],
      highlightedResources: [],
    });
  }

  render() {
    const maxFirstTileColNum = Object.keys(this.state.uniqueStruct).length - Math.trunc(this.state.numVisibleCols);
    const tileSelected = Object.keys(this.state.selectedTiles).length > 0;
    console.log(`numVis: ${this.state.numVisibleCols} maxFirst: ${maxFirstTileColNum} first: ${this.state.firstTileColNum}`);
    return (
      <div className="tiles-view">
        <div className="tiles-view-header">
          <div
            className={tileSelected ? 'tiles-view-header-button-clear-selected' : 'tiles-view-header-button-clear'}
            onClick={this.onClearClick}
          >
            Clear
          </div>
          { config.enableReportedMultProvs && (
          <label className="tiles-view-multisource-label">
            <input className="tiles-view-multisource-check" type="checkbox" checked={this.state.onlyMultisource} onChange={this.onlyMultisourceChange} />
            Reported by multiple providers
          </label>
          ) }
        </div>
        <div className="tiles-view-container">
          { Object.keys(this.state.uniqueStruct).length > 0 && (
          <div className="tiles-view-nav-left">
            <button
              className={this.state.firstTileColNum > 0 ? 'tiles-view-nav-left-button-on' : 'tiles-view-nav-left-button-off'}
              onClick={() => this.onNavClick('left')}
            />
            {/* this.state.firstTileColNum > 0 && <button className='tiles-view-nav-left-button-on' onClick={() => this.onNavClick('left')}/> */}
          </div>
          ) }
          <div className="tiles-view-container-inner">
            { this.renderTileColumns() }
          </div>
          { Object.keys(this.state.uniqueStruct).length > 0 && (
          <div className="tiles-view-nav-right">
            <button
              className={this.state.firstTileColNum < maxFirstTileColNum ? 'tiles-view-nav-right-button-on' : 'tiles-view-nav-right-button-off'}
              onClick={() => this.onNavClick('right')}
            />
            {/* this.state.firstTileColNum < maxFirstTileColNum && <button className='tiles-view-nav-right-button-on'
                     onClick={() => this.onNavClick('right')}/> */}
          </div>
          ) }
        </div>
        <ContentPanel
          open
          catsEnabled={this.props.catsEnabled}
          provsEnabled={this.props.provsEnabled}
          containerClassName="content-panel-tiles-view"
          topBoundFn={() => this.state.topBound}
          bottomBoundFn={this.contentPanelBottomBound}
          initialPositionYFn={this.initialPositionY.bind(this)}
          onResizeFn={this.onContentPanelResize.bind(this)}
          context={this.state.context}
          nextPrevFn={this.props.nextPrevFn}
          thumbLeftDate={this.props.thumbLeftDate}
          thumbRightDate={this.props.thumbRightDate}
          resources={this.selectedTileResources()}
          totalResCount={this.props.totalResCount}
          viewName="Tiles"
          viewIconClass="tiles-view-icon"
          tileSort
          noResultDisplay={Object.keys(this.state.uniqueStruct).length > 0 ? 'No Card is selected' : 'No data to display'}
        />
      </div>
    );
  }
}
