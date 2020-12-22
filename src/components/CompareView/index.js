import React from 'react';
import PropTypes from 'prop-types';

import './CompareView.css';
import config from '../../config.js';
import { log } from '../../utils/logger';
import {
  Const, getStyle, stringCompare, tryWithDefault, titleCase,
  numericPart, inDateRange, uniqueBy, notEqJSON, classFromCat,
} from '../../util.js';
import FhirTransform from '../../FhirTransform.js';
import { fhirKey, primaryTextValue } from '../../fhirUtil.js';

import Unimplemented from '../Unimplemented';
import Sparkline from '../Sparkline';
import ContentPanel from '../ContentPanel/ContentRight';

import DiscoveryContext from '../DiscoveryContext';

//
// Render the "compare view" of the participant's data
//
export default class CompareView extends React.Component {
  static myName = 'CompareView';

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
    uniqueStruct: {},
    selectedUniqueItems: {},
    lastUniqueItemSelected: null,
    topBound: 0,
    onlyMultisource: false,
  }

  componentDidMount() {
    if (this.context.savedSelectedTiles) {
      this.setState({ selectedUniqueItems: this.context.savedSelectedTiles });
      this.context.updateGlobalContext({ viewAccentDates: this.viewAccentDatesFromSelected(this.context.savedSelectedTiles) });
    }

    if (this.context.lastTileSelected) {
      const last = this.context.lastTileSelected;
      this.setState({ lastUniqueItemSelected: last });

      const lastResources = this.matchingUniqueItemResources(last);
      this.context.updateGlobalContext({
        lastHighlightedResources: lastResources,
        viewLastAccentDates: this.uniqueDatesFromResources(lastResources),
      });
    }

    this.setState({ onlyMultisource: this.context.onlyMultisource },
      () => this.setState({ uniqueStruct: this.buildUniqueStruct() }));
  }

  componentWillUnmount() {
    this.context.updateGlobalContext({
      savedSelectedTiles: this.state.selectedUniqueItems,
      lastTileSelected: this.state.lastUniqueItemSelected, // Save selected, last selected unique items
      viewAccentDates: [],
      viewLastAccentDates: [],
      highlightedResources: [],
      lastHighlightedResources: [],
    }); // Clear highlights
  }

  componentDidUpdate(prevProps, prevState) {
    // TODO: only on explicit changes?
    if (notEqJSON(prevProps, this.props) || prevState.onlyMultisource !== this.state.onlyMultisource) {
      this.setState({ uniqueStruct: this.buildUniqueStruct() });
    }

    // TODO: only on explicit changes?
    if (notEqJSON(prevState, this.state)) {
      const scroller = document.querySelector('.compare-view-scroller');
      const header = document.querySelector('.compare-view-title-container'); // TODO: this might not be the best place to put the CP top bound...
      if (scroller && header) {
        this.setState({ topBound: numericPart(getStyle(scroller, 'margin-top')) + header.clientHeight });
      }
    }

    // Kluge: get saved tile state if not set in mount (and then clear)
    if (this.context.savedSelectedTiles && Object.keys(this.context.savedSelectedTiles).length > 0
      && this.state.selectedUniqueItems && Object.keys(this.state.selectedUniqueItems).length === 0) {
      this.setState({ selectedUniqueItems: this.context.savedSelectedTiles });
      this.context.updateGlobalContext({
        viewAccentDates: this.viewAccentDatesFromSelected(this.context.savedSelectedTiles),
        savedSelectedTiles: {},
      });
    }

    if (this.context.lastTileSelected && !this.state.lastUniqueItemSelected) {
      const last = this.context.lastTileSelected;
      this.setState({ lastUniqueItemSelected: last });

      const lastResources = this.matchingUniqueItemResources(last);
      this.context.updateGlobalContext({
        lastHighlightedResources: lastResources,
        viewLastAccentDates: this.uniqueDatesFromResources(lastResources),
        lastTileSelected: null,
      });
    }
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
    const scroller = document.querySelector('.compare-view-scroller');
    const compareView = document.querySelector('.compare-view');

    // Reset any prior size adjustment
    scroller.style = 'height:""';

    if (scroller.clientHeight > compareView.clientHeight / 1.6) {
      scroller.style = `height:${compareView.clientHeight / 1.6}px;`;
    }

    return scroller.clientHeight + 25; // TODO: correct margin sizes
  }

  onContentPanelResize() {
    const compareViewHeight = document.querySelector('.compare-view').clientHeight;
    const contentPanelHeight = document.querySelector('.content-panel-compare-view').clientHeight;
    const scroller = document.querySelector('.compare-view-scroller');
    //      console.log('RESIZE compare-view-scroller: ' + (compareViewHeight - contentPanelHeight - 5));
    scroller.style = `height:${compareViewHeight - contentPanelHeight - 5}px;`;
  }

  getCoding(res) {
    const codeObj = classFromCat(res.category).code(res);
    const code = tryWithDefault(codeObj, (codeObj) => codeObj.coding[0].code, tryWithDefault(codeObj, (codeObj) => codeObj.code, '????'));
    const display = primaryTextValue(codeObj);
    return { code, display: display === Const.unknownValue ? `All ${res.category}` : display };
  }

  // Categories we DON'T want to compare on
  get noCompareCategories() {
    return ['Patient'];
  }

  //
  // collectUnique()
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
      if (this.noCompareCategories.includes(res.category)
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

  hyphenate(name) {
    return name.toLowerCase().replace(/ /g, '-');
  }

  uniqueItemId(catName, display, trueCategory) {
    return `${this.hyphenate(catName)} ${this.hyphenate(display)} ${trueCategory}`;
  }

  parseUniqueItemId(id) {
    const idParts = id.split(' ');
    return { catName: idParts[0], display: idParts[1], trueCategory: idParts.slice(2).join(' ') };
  }

  isUniqueItemSelected(catName, display) {
    try {
      return this.state.selectedUniqueItems[this.hyphenate(catName)][this.hyphenate(display)];
    } catch (e) {
      return false;
    }
  }

  isLastUniqueItemSelected(catName, display) {
    return this.state.lastUniqueItemSelected
      && this.state.lastUniqueItemSelected.catName === this.hyphenate(catName)
      && this.state.lastUniqueItemSelected.display === this.hyphenate(display);
  }

  matchingUniqueItemResources(uniqueItemId) {
    let res = this.props.resources.transformed.filter((res) => this.hyphenate(res.category) === uniqueItemId.catName
      && this.hyphenate(this.getCoding(res).display) === uniqueItemId.display);
    if (res.length === 0) {
      // Kluge for 'other'
      res = this.props.resources.transformed.filter((res) => res.category === uniqueItemId.trueCategory);
    }

    return res;
  }

  // Get all resources from selectedUniqueItems
  allSelectedUniqueItemResources(selectedUniqueItems) {
    let resArray = [];
    for (const catName of Object.keys(selectedUniqueItems)) {
      for (const displayStr of Object.keys(selectedUniqueItems[catName])) {
        resArray = resArray.concat(selectedUniqueItems[catName][displayStr]);
      }
    }

    return resArray;
  }

  onUniqueItemClick = (e) => {
    const newSelectedUniqueItems = { ...this.state.selectedUniqueItems }; // copy selected unique items obj
    const uniqueItemId = this.parseUniqueItemId(e.target.id);
    let matchingUniqueItemResources = null;
    let clearedPrevSelected = false;

    if (this.isUniqueItemSelected(uniqueItemId.catName, uniqueItemId.display)) {
      if (Object.keys(newSelectedUniqueItems[uniqueItemId.catName]).length === 1) {
        // Delete category
        delete newSelectedUniqueItems[uniqueItemId.catName];
      } else {
        // Clear selection of the just-clicked unique item
        delete newSelectedUniqueItems[uniqueItemId.catName][uniqueItemId.display];
      }
      clearedPrevSelected = true;
      this.context.updateGlobalContext({
        highlightedResources: [], // Used by HighlightDiv
        lastHighlightedResources: [],
      }); //
      this.setState({ lastUniqueItemSelected: null });
    } else {
      // Select the clicked unique item
      if (!newSelectedUniqueItems[uniqueItemId.catName]) {
        newSelectedUniqueItems[uniqueItemId.catName] = {};
      }
      matchingUniqueItemResources = this.matchingUniqueItemResources(uniqueItemId);
      newSelectedUniqueItems[uniqueItemId.catName][uniqueItemId.display] = matchingUniqueItemResources;
      this.context.updateGlobalContext({
        highlightedResources: this.allSelectedUniqueItemResources(newSelectedUniqueItems), // Used by HighlightDiv
        lastHighlightedResources: matchingUniqueItemResources,
      }); //
      //   let newDate = matchingUniqueItemResources[0].itemDate;
      //   let newContext = Object.assign(this.state.context, { date: newDate,
      //                    position: normalizeDates([newDate], this.state.context.minDate, this.state.context.maxDate)[0],
      //                    dotType: 'active' });
      this.setState({
        lastUniqueItemSelected: uniqueItemId,
        //       context: newContext
      });
    }

    // If all/no unique items are now selected for this category, clear lastSavedSelectedTiles for this category
    const selectedUniqueItemsForCatCount = newSelectedUniqueItems[uniqueItemId.catName] ? Object.keys(newSelectedUniqueItems[uniqueItemId.catName]).length
      : 0;
    // TODO: following is inefficient -- consider converting uniqueStruct to use "hyphenated" category names
    const uniqueItemsForCatCount = this.state.uniqueStruct[Object.keys(this.state.uniqueStruct).find((key) => this.hyphenate(key) === uniqueItemId.catName)].length;
    if (this.context.lastSavedSelectedTiles && (selectedUniqueItemsForCatCount === 0 || selectedUniqueItemsForCatCount === uniqueItemsForCatCount)) {
      const newLastSavedSelectedUniqueItems = { ...this.context.lastSavedSelectedTiles };
      delete newLastSavedSelectedUniqueItems[uniqueItemId.catName];
      this.context.updateGlobalContext({ lastSavedSelectedTiles: newLastSavedSelectedUniqueItems });
    }

    this.setState({ selectedUniqueItems: newSelectedUniqueItems });
    this.context.updateGlobalContext({
      viewAccentDates: this.viewAccentDatesFromSelected(newSelectedUniqueItems),
      viewLastAccentDates: clearedPrevSelected ? [] : this.uniqueDatesFromResources(
        this.matchingUniqueItemResources(uniqueItemId),
      ),
    });

    // Scroll to the latest resource of the clicked tile
    if (matchingUniqueItemResources) {
      const latest = matchingUniqueItemResources.reduce((latest, elt) => (new Date(elt.itemDate) > new Date(latest.itemDate) ? elt : latest),
        matchingUniqueItemResources[0]);
      // Delay a bit to allow resources to be rendered to the DOM
      setTimeout((res) => {
        const key = fhirKey(res);
        const elt = document.querySelector(`[data-fhir="${key}"]`);
        if (elt) {
          elt.scrollIntoView();
        } else {
          log(`onUniqueItemClick(): cannot scroll to "${key}"`);
        }
      }, 200, latest);
    }
  }

  uniqueDatesFromResources(resArray) {
    const dates = resArray.reduce((acc, res) => { acc.push(res.itemDate); return acc; }, []);
    return uniqueBy(dates, (elt) => elt);
  }

  // Get unique dates from selectedUniqueItems
  // TODO: delete & replace calls with uniqueDatesFromResources(allSelectedUniqueItemResources(selectedUniqueItems))
  viewAccentDatesFromSelected(selectedUniqueItems) {
    let dateArray = [];
    if (selectedUniqueItems) {
      for (const catName of Object.keys(selectedUniqueItems)) {
        for (const displayStr of Object.keys(selectedUniqueItems[catName])) {
          dateArray = dateArray.concat(selectedUniqueItems[catName][displayStr].reduce((acc, res) => { acc.push(res.itemDate); return acc; }, []));
        }
      }
    }

    return uniqueBy(dateArray, (elt) => elt);
  }

  uniqueButtonClassName(catName, display) {
    if (this.isLastUniqueItemSelected(catName, display)) {
      return 'compare-view-record-button-selected-last';
    } if (this.isUniqueItemSelected(catName, display)) {
      return 'compare-view-record-button-selected';
    }
    return 'compare-view-record-button';
  }

  formatCount(count, onePre, onePost, multiPre, multiPost) {
    return (count === 1) ? onePre + onePost : multiPre + count + multiPost;
  }

  formatYearRange(minDate, maxDate, pre, post) {
    const minYear = `${minDate.getFullYear()}`;
    const maxYear = `${maxDate.getFullYear()}`;

    return minYear === maxYear ? pre + minYear + post : `${pre + minYear} \u2013 ${maxYear}${post}`;
  }

  handleSetClearButtonClick = (catName) => {
    const hCatName = this.hyphenate(catName);
    const selectedUniqueItemsForCat = this.state.selectedUniqueItems[hCatName];
    const selectedCount = selectedUniqueItemsForCat ? Object.keys(selectedUniqueItemsForCat).length : 0;
    const uniqueItemsForCatCount = this.state.uniqueStruct[catName].length;
    let newSelectedUniqueItems = null;

    if (selectedCount === 0) {
      // None selected
      if (this.context.lastSavedSelectedTiles && this.context.lastSavedSelectedTiles[hCatName]) {
        // --> prior saved partial
        this.setState({ selectedUniqueItems: this.context.lastSavedSelectedTiles });
        this.context.updateGlobalContext({ viewAccentDates: this.viewAccentDatesFromSelected(this.context.lastSavedSelectedTiles) });
      } else {
        // --> all selected
        newSelectedUniqueItems = { ...this.state.selectedUniqueItems }; // copy selected unique items obj
        if (!newSelectedUniqueItems[hCatName]) {
          newSelectedUniqueItems[hCatName] = {};
        }
        for (const unique1 of this.state.uniqueStruct[catName]) {
          const hDisplay1 = this.hyphenate(unique1.display);
          newSelectedUniqueItems[hCatName][hDisplay1] = this.matchingUniqueItemResources({
            catName: hCatName,
            display: hDisplay1,
            trueCategory: unique1.trueCategory,
          });
        }
        this.setState({ selectedUniqueItems: newSelectedUniqueItems });
        this.context.updateGlobalContext({ viewAccentDates: this.viewAccentDatesFromSelected(newSelectedUniqueItems) });
      }
    } else if (selectedCount < uniqueItemsForCatCount) {
      // Part selected --> all selected (and save copy of partial)
      this.context.updateGlobalContext({ lastSavedSelectedTiles: JSON.parse(JSON.stringify(this.state.selectedUniqueItems)) });
      newSelectedUniqueItems = { ...this.state.selectedUniqueItems }; // copy selected tiles obj
      if (!newSelectedUniqueItems[hCatName]) {
        newSelectedUniqueItems[hCatName] = {};
      }
      for (const unique2 of this.state.uniqueStruct[catName]) {
        const hDisplay2 = this.hyphenate(unique2.display);
        newSelectedUniqueItems[hCatName][hDisplay2] = this.matchingUniqueItemResources({
          catName: hCatName,
          display: hDisplay2,
          trueCategory: unique2.trueCategory,
        });
      }
      this.setState({ selectedUniqueItems: newSelectedUniqueItems });
      this.context.updateGlobalContext({
        viewAccentDates: this.viewAccentDatesFromSelected(newSelectedUniqueItems),
        viewLastAccentDates: [],
      });
      // Clear lastUniqueItemSelected if matches
      if (this.state.lastUniqueItemSelected && this.state.lastUniqueItemSelected.catName === hCatName) {
        this.context.updateGlobalContext({ highlightedResources: [] });
        this.setState({ lastUniqueItemSelected: null });
      }
    } else {
      // All selected --> none selected
      newSelectedUniqueItems = { ...this.state.selectedUniqueItems }; // copy selected unique items obj
      delete newSelectedUniqueItems[hCatName];
      this.setState({ selectedUniqueItems: newSelectedUniqueItems });
      this.context.updateGlobalContext({
        viewAccentDates: this.viewAccentDatesFromSelected(newSelectedUniqueItems),
        viewLastAccentDates: [],
      });
      // Clear lastUniqueItemSelected if matches
      if (this.state.lastUniqueItemSelected && this.state.lastUniqueItemSelected.catName === hCatName) {
        this.context.updateGlobalContext({ highlightedResources: [] });
        this.setState({ lastUniqueItemSelected: null });
      }
    }
  }

  buttonClass(catName) {
    const selectedUniqueItemsForCat = this.state.selectedUniqueItems[this.hyphenate(catName)];
    const selectedCount = selectedUniqueItemsForCat ? Object.keys(selectedUniqueItemsForCat).length : 0;
    const uniqueItemsForCatCount = this.state.uniqueStruct[catName].length;

    if (selectedCount === 0) return 'compare-view-category-header-button-none';
    if (selectedCount < uniqueItemsForCatCount) return 'compare-view-category-header-button-partial';
    return 'compare-view-category-header-button-all';
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

  renderProvsForUniqueItem(provs) {
    const minDate = new Date(this.props.dates.minDate);
    const maxDate = new Date(this.props.dates.maxDate);
    const divs = [];

    for (const thisProv of provs) {
      divs.push(
        <div className="compare-view-data-row" key={divs.length}>
          <Sparkline className="compare-view-sparkline" minDate={minDate} maxDate={maxDate} data={thisProv.dates} />
          {/* <div className='compare-view-date-range'>
      { this.formatYearRange(thisProv.minDate, thisProv.maxDate) }
         </div> */}
          <div className="compare-view-provider">
            {/* titleCase(thisProv.provName) + this.formatCount(thisProv.count, ' [', '', ' [', 'x, ')
           + this.formatYearRange(thisProv.minDate, thisProv.maxDate, '', ']') */}
            { titleCase(thisProv.provName) + this.formatYearRange(thisProv.minDate, thisProv.maxDate, ' [', ']') }
          </div>
        </div>,
      );
    }

    return divs;
  }

  renderUniqueItemsForCat(catName) {
    const divs = [];
    for (const thisUnique of this.state.uniqueStruct[catName].sort((a, b) => stringCompare(a.display, b.display))) {
      const count = thisUnique.provs.reduce((count, prov) => count + prov.count, 0);
      divs.push(
        <div className="compare-view-unique-item-container" key={divs.length}>
          {/* <button className={this.uniqueButtonClassName(catName, thisUnique.display)} id={this.uniqueItemId(catName, thisUnique.display)}
           onClick={this.onUniqueItemClick}>{thisUnique.display + this.formatCount(count, '', '', ' [', 'x]')}</button> */}
          <button
            className={this.uniqueButtonClassName(catName, thisUnique.display)}
            id={this.uniqueItemId(catName, thisUnique.display)}
            onClick={this.onUniqueItemClick}
          >
            {thisUnique.display + this.formatCount(count, '', '', ' [', ']')}
          </button>
          <div className="compare-view-data-column">
            { this.renderProvsForUniqueItem(thisUnique.provs) }
          </div>
        </div>,
      );
    }

    return divs;
  }

  renderUniqueItems() {
    const divs = [];

    for (const catName in this.state.uniqueStruct) {
      divs.push(
        <div className="compare-view-category-container" key={divs.length}>
          <div className="compare-view-title-container">
            <div className="compare-view-title">{catName}</div>
            <button className={this.buttonClass(catName)} onClick={() => this.handleSetClearButtonClick(catName)} />
          </div>
          { this.renderUniqueItemsForCat(catName) }
        </div>,
      );
    }

    if (divs.length === 0) {
      divs.push(
        <div className="compare-view-all-unique-items-empty" key="0">
          { this.noResultDisplay }
        </div>,
      );
    }

    return divs;
  }

  // Collect resources matching all selected unique items (plus Patient)
  selectedUniqueItemResources() {
    let resArray = this.props.resources.transformed.filter((elt) => elt.category === 'Patient');
    for (const catName of Object.keys(this.state.selectedUniqueItems)) {
      for (const displayStr of Object.keys(this.state.selectedUniqueItems[catName])) {
        if (!this.state.onlyMultisource
          || (this.state.onlyMultisource // more than one provider?
            && this.state.selectedUniqueItems[catName][displayStr].reduce((provs, res) => provs.add(res.provider), new Set()).size > 1)) {
          resArray = resArray.concat(this.state.selectedUniqueItems[catName][displayStr]);
        }
      }
    }

    return new FhirTransform(resArray, (data) => data);
  }

  onlyMultisourceChange = (event) => {
    //      console.log('multisource change: ' + event.target.checked);
    this.setState({ onlyMultisource: event.target.checked });
    this.context.updateGlobalContext({ onlyMultisource: event.target.checked });
  }

  onClearClick = () => {
    this.setState({
      selectedUniqueItems: {},
      lastUniqueItemSelected: null,
    });
    this.context.updateGlobalContext({
      viewAccentDates: [],
      viewLastAccentDates: [],
      highlightedResources: [],
    });
  }

  render() {
    const uniqueSelected = Object.keys(this.state.selectedUniqueItems).length > 0;
    return (
      <div className="compare-view">
        <div className="compare-view-header">
          <div
            className={uniqueSelected ? 'compare-view-header-button-clear-selected' : 'compare-view-header-button-clear'}
            onClick={this.onClearClick}
          >
            Clear
          </div>
          { config.enableReportedMultProvs && (
          <label className="compare-view-multisource-label">
            <input
              className="compare-view-multisource-check"
              type="checkbox"
              checked={this.state.onlyMultisource}
              onChange={this.onlyMultisourceChange}
            />
            Reported by multiple providers
          </label>
          ) }
        </div>
        <div className="compare-view-scroller">
          <div className="compare-view-all-unique-items">
            { this.renderUniqueItems() }
          </div>
        </div>
        <ContentPanel
          open
          catsEnabled={this.props.catsEnabled}
          provsEnabled={this.props.provsEnabled}
          containerClassName="content-panel-compare-view"
          topBoundFn={() => this.state.topBound}
          bottomBoundFn={this.contentPanelBottomBound}
          initialPositionYFn={this.initialPositionY.bind(this)}
          onResizeFn={this.onContentPanelResize.bind(this)}
          context={this.state.context}
          nextPrevFn={this.props.nextPrevFn}
          thumbLeftDate={this.props.thumbLeftDate}
          thumbRightDate={this.props.thumbRightDate}
          resources={this.selectedUniqueItemResources()}
          totalResCount={this.props.totalResCount}
          viewName="Compare"
          viewIconClass="compare-view-icon"
          tileSort
          noResultDisplay={Object.keys(this.state.uniqueStruct).length > 0 ? 'No Card is selected' : 'No data to display'}
        />
      </div>
    );
  }
}
