import React from 'react';
import PropTypes from 'prop-types';

import './StandardFilters.css';
import FhirTransform from '../../FhirTransform.js';
import { getStyle, numericPart, combine, cleanDates, normalizeDates, checkQuerySelector, notEqJSON, dateOnly } from '../../util.js';
import TimeWidget from '../TimeWidget';
import CategoryRollup from '../CategoryRollup';
import Categories from '../Categories';
import Category from '../Category';
import ProviderRollup from '../ProviderRollup';
import Providers from '../Providers';
import Provider from '../Provider';
import Unimplemented from '../Unimplemented';

import DiscoveryContext from '../DiscoveryContext';

//
// Render the "container" (with filters) for views of the participant's data
//
export default class StandardFilters extends React.Component {

  static contextType = DiscoveryContext;    // Allow the shared context to be accessed via 'this.context'

  static propTypes = {
    resources: PropTypes.instanceOf(FhirTransform),
    dates: PropTypes.shape({
      allDates: PropTypes.arrayOf(PropTypes.shape({
        position: PropTypes.number.isRequired,
        date: PropTypes.string.isRequired
      })).isRequired,
      minDate: PropTypes.string.isRequired,    // Earliest date we have data for this participant
      startDate: PropTypes.string.isRequired,  // Jan 1 of minDate's year
      maxDate: PropTypes.string.isRequired,    // Latest date we have data for this participant
      endDate: PropTypes.string.isRequired    // Dec 31 of last year of timeline tick periods
    }),
    categories: PropTypes.arrayOf(PropTypes.string).isRequired,
    catsEnabled: PropTypes.object.isRequired,    // Initial state
    providers: PropTypes.arrayOf(PropTypes.string).isRequired,
    provsEnabled: PropTypes.object.isRequired,
    enabledFn: PropTypes.func.isRequired,    // Callback to report changed category & provider enable/disable
    dateRangeFn: PropTypes.func,      // Optional callback to report changed thumb positions
    lastEvent: PropTypes.instanceOf(Event),
    allowDotClick: PropTypes.bool,
    dotClickDate: PropTypes.string
  }

  state = {
    minActivePos: 0.0,      // Location [0..1] of TimeWidget left thumb
    maxActivePos: 1.0,      // Location [0..1] of TimeWidget right thumb
    timelineIsExpanded: false,    // Is expanded timeline displayed (restricted dot range in effect)
    catsExpanded: true,
    catsEnabled: {},        // Enabled status of categories
    provsExpanded: true,
    provsEnabled: {},        // Enabled status of providers
    svgWidth: '0px',
    dotClickContext: null,      // The current dot (if one is highlighted)
    activeDates: {}        // Dates that are within the TimeWidget's active range and have one or more resources with enabled Categories/Providers
  }

  componentDidMount() {
    this.updateSvgWidth();
    if (this.props.dates && this.props.allowDotClick) {
      this.setState({ dotClickContext: { parent: 'TimeWidget', rowName: 'Full', dotType: 'active',
          minDate: this.props.dates.minDate, maxDate: this.props.dates.maxDate,
          startDate: this.props.dates.startDate, endDate: this.props.dates.endDate,
          allDates: this.props.dates.allDates,
          date: this.props.dates.maxDate,
          data: this.fetchDataForDot('TimeWidget', 'Full', this.props.dates.maxDate),
          position: this.props.dates.allDates[this.props.dates.allDates.length-1].position }});
    }

    this.setState({ catsEnabled: this.props.catsEnabled, provsEnabled: this.props.provsEnabled });
    this.props.enabledFn(this.props.catsEnabled, this.props.provsEnabled);
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevState.minActivePos !== this.state.minActivePos ||
      prevState.maxActivePos !== this.state.maxActivePos ||
      notEqJSON(prevState.catsEnabled, this.state.catsEnabled) ||
      notEqJSON(prevState.provsEnabled, this.state.provsEnabled)) {
      this.setState({ activeDates: this.calcActiveDates() });
    }

    if (prevProps.lastEvent !== this.props.lastEvent) {
      switch (this.props.lastEvent.type) {
        case 'resize':
        default:
          this.updateSvgWidth();
          break;
      }

// TODO: not sure why this was here, but if enabled, next/prev and dot-click don't work w/ searchRefs
//      } else if (this.context.searchRefs && this.context.searchRefs.length > 0) {
//   // If most recent searchRef differs from currently highlighted dot, set dotClickContext
//   let recentRef = this.context.searchRefs[0];
//   if (recentRef.position !== this.state.dotClickContext.position) {
//      let newContext = Object.assign({}, this.state.dotClickContext);
//      newContext.date = recentRef.date;
//      newContext.position = recentRef.position;
//      this.setState({ dotClickContext: newContext });
//   }

    } else if (this.props.allowDotClick && prevProps.dotClickDate !== this.props.dotClickDate) {
      // Set dotClickContext from dot clicked in ContentPanel (via this.props.dotClickDate)
      let theDate = this.props.dates.allDates.find(elt => new Date(elt.date).getTime() === new Date(this.props.dotClickDate).getTime());
      this.setState({ dotClickContext: { parent: 'TimeWidget', rowName: 'Full', dotType: 'active',
          minDate: this.props.dates.minDate, maxDate: this.props.dates.maxDate,
          allDates: this.props.dates.allDates,
          date: theDate.date,
          data: this.fetchDataForDot('TimeWidget', 'Full', theDate.date),
          position: theDate.position }});
    }
  }

  calcActiveDates() {
    let activeDates = {};
    for (let res of this.props.resources.transformed) {
      let trueCategory = Unimplemented.unimplementedCats.includes(res.category) ? Unimplemented.catName : res.category;
      if (this.isActiveTimeWidget({ position: this.dateToPos(res.itemDate) }) &&
        this.state.catsEnabled[trueCategory] &&
        this.state.provsEnabled[res.provider]) {
        // This resource's date is active
        activeDates[dateOnly(res.itemDate)] = true;
      }
    }
    return activeDates;
  }

  // Kluge: following needs to know about lower-level classes
  updateSvgWidth = (event) => {
    const category = checkQuerySelector('.selector');
    const categoryNav = checkQuerySelector('.selector-nav');

    if (category && categoryNav) {
      let svgWidth = (category.getBoundingClientRect().width - categoryNav.getBoundingClientRect().width - 13  // TODO: fix (far-right margin)
        - numericPart(getStyle(categoryNav, 'margin-left')) - numericPart(getStyle(categoryNav, 'margin-right')))+ 'px';
      this.setState({ svgWidth: svgWidth });
//    console.log('svgWidth: ' + svgWidth);
    }

  }

  //
  // Callback function to record category/provider enable/disable
  //   parent:    'Category', 'Provider'
  //   rowName:  <category-name>/<provider-name>
  //   isEnabled:  the current state to record
  //
  setEnabled = (parent, rowName, isEnabled) => {
    if (parent === 'Category') {
      if (this.state.catsEnabled[rowName] !== isEnabled) {
        let catsEnabled = Object.assign({}, this.state.catsEnabled, {[rowName]: isEnabled})
        this.props.enabledFn(catsEnabled, this.state.provsEnabled);
        this.setState({catsEnabled: catsEnabled}, () => {
          let enabled = Object.keys(this.state.catsEnabled).reduce((count, key) => count + (this.state.catsEnabled[key] &&
          this.props.categories.includes(key) ? 1 : 0), 0);
          if (enabled === 0 || enabled === this.props.categories.length) {
            // Clear saved categories enabled
            this.context.updateGlobalContext({ savedCatsEnabled: null });
          }
        });
      }
    } else {
      // Provider
      if (this.state.provsEnabled[rowName] !== isEnabled) {
        let provsEnabled = Object.assign({}, this.state.provsEnabled, {[rowName]: isEnabled})
        this.props.enabledFn(this.state.catsEnabled, provsEnabled);
        this.setState({provsEnabled: provsEnabled}, () => {
          let enabled = Object.keys(this.state.provsEnabled).reduce((count, key) => count + (this.state.provsEnabled[key] &&
          this.props.providers.includes(key) ? 1 : 0), 0);
          if (enabled === 0 || enabled === this.props.providers.length) {
            // Clear saved providers enabled
            this.context.updateGlobalContext({ savedProvsEnabled: null });
          }
        });
      }
    }
  }

  //
  // Is 'dot' in the TimeWidget's active range?
  //
  isActiveTimeWidget = (dot) => {
    return dot.position >= this.state.minActivePos && dot.position <= this.state.maxActivePos;
  }

  //
  // Is 'dot':  (1) in the TimeWidget's active range
  //    (2) associated with an active Category
  //    (3) associated with an active Provider
  isActive = (dot) => {
    return this.state.activeDates[dateOnly(dot.date)];
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

  // TODO: Move to util.js?
  posToDate(pos) {
    if (this.props.dates) {
      let min = new Date(this.props.dates.startDate ? this.props.dates.startDate : 0).getTime();
      let max = new Date(this.props.dates.endDate ? this.props.dates.endDate : 0).getTime();
      let target = min + (max - min) * pos;
      return new Date(target).toISOString();
    } else {
      return new Date().toISOString();
    }
  }

  // TODO: Move to util.js?
  dateToPos(dateStr) {
    let min = new Date(this.props.dates.startDate ? this.props.dates.startDate : 0).getTime();
    let max = new Date(this.props.dates.endDate ? this.props.dates.endDate : 0).getTime();
    let target = new Date(dateStr).getTime();
    return (target - min) / (max - min);
  }

  //
  // Handle TimeWidget left/right thumb movement
  //   minActivePos:  location [0..1] of left thumb
  //   maxActivePos:  location [0..1] of right thumb
  //   isExpanded:  true if secondary (expanded) timeline visible
  //
  setLeftRight = (minActivePos, maxActivePos, isExpanded) => {
//      console.log('minPos: ' + minActivePos + '  maxPos: ' + maxActivePos);
    let minDate = this.posToDate(minActivePos);
    let maxDate = this.posToDate(maxActivePos);
    this.props.dateRangeFn && this.props.dateRangeFn(minDate, maxDate);
    this.setState({ minActivePos: minActivePos,
      maxActivePos: maxActivePos,
      timelineIsExpanded: isExpanded });
  }

  //
  // Handle Category/Provider expand/contract
  //    section:  'Categories', 'Providers'
  //   expand:  true/false
  //
  onExpandContract = (section, expand) => {
    if (section === 'Categories') {
      this.setState({ catsExpanded: expand });
    } else {
      this.setState({ provsExpanded: expand });
    }
  }

  //
  // Return data for the clicked dot
  //    parent:  'CategoryRollup', 'Category', 'ProviderRollup', 'Provider'
  //    rowName:  <category-name>/<provider-name>
  //    date:    date of the clicked dot
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
  // Handle ContentPanel next/prev button clicks
  //   direction:  'next' or 'prev'
  // Returns true if the button should be enabled, else false
  //
  onNextPrevClick = (direction) => {
    let thumbDistance = this.state.maxActivePos - this.state.minActivePos;
    let oldPosition = this.state.dotClickContext.position;
    let newContext = Object.assign({}, this.state.dotClickContext);
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
        // Adjust thumb positions if current dot is in active range
        if (this.isActiveTimeWidget(this.state.dotClickContext)) {
          let newMax = Math.min(1.0, this.state.maxActivePos + newContext.position - oldPosition);
          this.setState({ minActivePos: newMax - thumbDistance, maxActivePos: newMax });
        }
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
        // Adjust thumb positions if current dot is in active range
        if (this.isActiveTimeWidget(this.state.dotClickContext)) {
          let newMin = Math.max(0.0, this.state.minActivePos + newContext.position - oldPosition);
          this.setState({ minActivePos: newMin, maxActivePos: newMin + thumbDistance });
        }
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
  //      parent:     'CategoryRollup', 'Category', 'ProviderRollup', 'Provider', 'TimeWidget'
  //      rowName:     <category-name>/<provider-name>
  //      dotType:     type of the clicked dot (added below)
  //      minDate:     date of the first dot for this row
  //      maxDate:     date of the last dot for this row
  //      date:     date of the clicked dot (added below)
  //      position:     position of the clicked dot (added below)
  //     data:     data associated with the clicked dot (added below)
  //   }
  //   date:       date of the clicked dot
  //   dotType:     'active', 'inactive', 'active-highlight', 'inactive-highlight', 'active-highlight-search', 'inactive-highlight-search'
  //
  onDotClick = (context, date, dotType) => {
    if (this.props.allowDotClick) {
      const rowDates = this.fetchDotPositions(context.parent, context.rowName, true, true);
      const position = rowDates.find(elt => elt.date === date).position;

      context.dotType = this.updateDotType(dotType, position, false);
      context.minDate = rowDates[0].date;
      context.maxDate = rowDates[rowDates.length-1].date;
      context.allDates = this.props.dates.allDates;
      context.date = date;
      context.position = position;
      context.data = this.fetchDataForDot(context.parent, context.rowName, context.date);

      this.setState({ dotClickContext: context });
    }
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
  // Callback function for this component's state, returning the requested array of position+date+dotType objects
  //  parent:    'CategoryRollup', 'Category', 'ProviderRollup', 'Provider', 'TimeWidget'
  //  rowName:  <category-name>/<provider-name>/'Full' or 'Active' (for TimeWidget)
  //   isEnabled:  'true' = render normally, 'false' = active dots become inactive
  //   fetchAll:  'true' = don't label dots with dotType, 'false' = label each dot with dotType
  //
//   fetchDotPositions = (parent, rowName, isEnabled, fetchAll) => {
  fetchDotPositions = this.fetchDotPositions.bind(this);
  fetchDotPositions(parent, rowName, isEnabled, fetchAll) {
    if (!this.props.resources || !this.props.dates || this.props.dates.allDates.length === 0) {
      return [];
    } else {
      let { startDate, endDate, allDates } = this.props.dates;
      let searchRefs = this.context.searchRefs;
      let viewAccentRefs = this.context.viewAccentDates.reduce((result, date) => {
        result.push({ dotType: 'view-accent', date: date,
          position: normalizeDates([date], startDate, endDate)[0] });
        return result;
      }, []);
      let viewLastAccentRefs = this.context.viewLastAccentDates.reduce((result, date) => {
        result.push({ dotType: 'view-last-accent', date: date,
          position: normalizeDates([date], startDate, endDate)[0] });
        return result;
      }, []);
//  // TODO: to use, need to build highlightedResources on Tiles/Compare load
//   let viewAccentRefs = this.context.highlightedResources ? this.context.highlightedResources.reduce((result, res) => {
//            let date = res.itemDate;
//            result.push({ dotType: 'view-accent', date: date, position: normalizeDates([date], startDate, endDate)[0] });
//            return result;
//               }, []) : [];

      let dotClickContext = this.state.dotClickContext;
      let matchContext = dotClickContext && (parent === 'CategoryRollup' || parent === 'ProviderRollup' || parent === 'TimeWidget' ||
        (dotClickContext.parent === parent && dotClickContext.rowName === rowName));
      let inactiveHighlightDots = this.props.allowDotClick && matchContext && allDates.reduce((res, elt) =>
//               ((!isEnabled || !this.isActiveTimeWidget(elt)) && elt.position === dotClickContext.position)
        ((!isEnabled || !this.isActive(elt)) && elt.position === dotClickContext.position)
          ? this.includeDot(res, elt, 'inactive-highlight', parent === 'TimeWidget') : res, []);

      let activeHighlightDots = this.props.allowDotClick && matchContext && allDates.reduce((res, elt) =>
//               (isEnabled && this.isActiveTimeWidget(elt) && elt.position === dotClickContext.position)
        (isEnabled && this.isActive(elt) && elt.position === dotClickContext.position)
          ? this.includeDot(res, elt, 'active-highlight', parent === 'TimeWidget') : res, []);

      // TODO: is this correct (viewAccentRefs vs viewLastAccentRefs)?
      let viewAccentHighlightDots = matchContext && viewAccentRefs.reduce((res, elt) =>
//               (isEnabled && this.isActiveTimeWidget(elt) && elt.position === dotClickContext.position)
        (isEnabled && this.isActive(elt) && elt.position === dotClickContext.position)
          ? this.includeDot(res, elt, 'view-accent-highlight', parent === 'TimeWidget') : res, []);

      let inactiveHighlightSearchDots = matchContext && searchRefs.reduce((res, elt) =>
//               ((!isEnabled || !this.isActiveTimeWidget(elt)) && elt.position === dotClickContext.position)
        ((!isEnabled || !this.isActive(elt)) && elt.position === dotClickContext.position)
          ? this.includeDot(res, elt, 'inactive-highlight-search', parent === 'TimeWidget') : res, []);

      let activeHighlightSearchDots = matchContext && searchRefs.reduce((res, elt) =>
//               (isEnabled && this.isActiveTimeWidget(elt) && elt.position === dotClickContext.position)
        (isEnabled && this.isActive(elt) && elt.position === dotClickContext.position)
          ? this.includeDot(res, elt, 'active-highlight-search', parent === 'TimeWidget') : res, []);

      let highlightDots = combine(inactiveHighlightDots, activeHighlightDots, viewAccentHighlightDots,
        inactiveHighlightSearchDots, activeHighlightSearchDots);

      switch (parent) {
        case 'ProviderRollup':
        case 'CategoryRollup':
          if (fetchAll) {
            return allDates;
          } else {
//      return combine(allDates.reduce((res, elt) => this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'active') : res, []),
//         searchRefs.reduce((res, elt) => this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'active-search') : res, []),
//         viewAccentRefs.reduce((res, elt) => this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'view-accent') : res, []),
//         viewLastAccentRefs.reduce((res, elt) => this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'view-last-accent')
            return combine(allDates.reduce((res, elt) => this.isActive(elt) ? this.includeDot(res, elt, 'active') : res, []),
              searchRefs.reduce((res, elt) => this.isActive(elt) ? this.includeDot(res, elt, 'active-search') : res, []),
              viewAccentRefs.reduce((res, elt) => this.isActive(elt) ? this.includeDot(res, elt, 'view-accent') : res, []),
              viewLastAccentRefs.reduce((res, elt) => this.isActive(elt) ? this.includeDot(res, elt, 'view-last-accent')
                : res, []),
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
//      return combine(provDateObjs.reduce((res, elt) => !isEnabled && this.isActiveTimeWidget(elt)
//                  ? this.includeDot(res, elt, 'inactive') : res, []),
//         provDateObjs.reduce((res, elt) => isEnabled && this.isActiveTimeWidget(elt)
//                  ? this.includeDot(res, elt, 'active') : res, []),
//         provSearchRefs.reduce((res, elt) => !isEnabled && this.isActiveTimeWidget(elt)
//                  ? this.includeDot(res, elt, 'inactive-search') : res, []),
//         provSearchRefs.reduce((res, elt) => isEnabled && this.isActiveTimeWidget(elt)
//                  ? this.includeDot(res, elt, 'active-search') : res, []),
//         highlightDots);
            return combine(provDateObjs.reduce((res, elt) => !isEnabled || !this.isActive(elt)
              ? this.includeDot(res, elt, 'inactive') : res, []),
              provDateObjs.reduce((res, elt) => isEnabled && this.isActive(elt)
                ? this.includeDot(res, elt, 'active') : res, []),
              provSearchRefs.reduce((res, elt) => !isEnabled || !this.isActive(elt)
                ? this.includeDot(res, elt, 'inactive-search') : res, []),
              provSearchRefs.reduce((res, elt) => isEnabled && this.isActive(elt)
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
//      return combine(catDateObjs.reduce((res, elt) => !isEnabled && this.isActiveTimeWidget(elt)
//                  ? this.includeDot(res, elt, 'inactive') : res, []),
//         catDateObjs.reduce((res, elt) => isEnabled && this.isActiveTimeWidget(elt)
//                  ? this.includeDot(res, elt, 'active') : res, []),
//         catSearchRefs.reduce((res, elt) => !isEnabled && this.isActiveTimeWidget(elt)
//                  ? this.includeDot(res, elt, 'inactive-search') : res, []),
//         catSearchRefs.reduce((res, elt) => isEnabled && this.isActiveTimeWidget(elt)
//                  ? this.includeDot(res, elt, 'active-search') : res, []),
//         highlightDots);
            return combine(catDateObjs.reduce((res, elt) => !isEnabled || !this.isActive(elt)
              ? this.includeDot(res, elt, 'inactive') : res, []),
              catDateObjs.reduce((res, elt) => isEnabled && this.isActive(elt)
                ? this.includeDot(res, elt, 'active') : res, []),
              catSearchRefs.reduce((res, elt) => !isEnabled || !this.isActive(elt)
                ? this.includeDot(res, elt, 'inactive-search') : res, []),
              catSearchRefs.reduce((res, elt) => isEnabled && this.isActive(elt)
                ? this.includeDot(res, elt, 'active-search') : res, []),
              highlightDots);
          }

        default:   // TimeWidget
          if (fetchAll) {
            return allDates;
          } else if (rowName === 'Full') {
//            return combine(allDates.reduce((res, elt) => !this.isActiveTimeWidget(elt)
//                         ? this.includeDot(res, elt, 'inactive', true) : res, []),
//                allDates.reduce((res, elt) => this.isActiveTimeWidget(elt)
//                         ? this.includeDot(res, elt, 'active', true) : res, []),
//                searchRefs.reduce((res, elt) => !this.isActiveTimeWidget(elt)
//                         ? this.includeDot(res, elt, 'inactive-search', true) : res, []),
//                searchRefs.reduce((res, elt) => this.isActiveTimeWidget(elt)
//                         ? this.includeDot(res, elt, 'active-search', true) : res, []),
//                viewAccentRefs.reduce((res, elt) => this.isActiveTimeWidget(elt)
//                         ? this.includeDot(res, elt, 'view-accent', true) : res, []),
//                viewLastAccentRefs.reduce((res, elt) => this.isActiveTimeWidget(elt)
//                             ? this.includeDot(res, elt, 'view-last-accent', true) : res, []),
//                highlightDots);
            return combine(allDates.reduce((res, elt) => !this.isActive(elt)
              ? this.includeDot(res, elt, 'inactive', true) : res, []),
              allDates.reduce((res, elt) => this.isActive(elt)
                ? this.includeDot(res, elt, 'active', true) : res, []),
              searchRefs.reduce((res, elt) => !this.isActive(elt)
                ? this.includeDot(res, elt, 'inactive-search', true) : res, []),
              searchRefs.reduce((res, elt) => this.isActive(elt)
                ? this.includeDot(res, elt, 'active-search', true) : res, []),
              viewAccentRefs.reduce((res, elt) => this.isActive(elt)
                ? this.includeDot(res, elt, 'view-accent', true) : res, []),
              viewLastAccentRefs.reduce((res, elt) => this.isActive(elt)
                ? this.includeDot(res, elt, 'view-last-accent', true) : res, []),
              highlightDots);

          } else {  // TODO: currently not using this case
            alert(`SF fetchDotPositions(): ${parent} ${rowName} (huh???)`);
//             return combine(allDates.reduce((res, elt) => this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'active') : res, []),
//                searchRefs.reduce((res, elt) => this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'active-search') : res, []));
            return combine(allDates.reduce((res, elt) => this.isActive(elt) ? this.includeDot(res, elt, 'active') : res, []),
              searchRefs.reduce((res, elt) => this.isActive(elt) ? this.includeDot(res, elt, 'active-search') : res, []));
          }
      }
    }
  }

  setAllCatsEnabled = catsEnabled => {
    this.props.enabledFn(catsEnabled, this.state.provsEnabled);
    this.setState({ catsEnabled: catsEnabled });
  }

  setAllProvsEnabled = provsEnabled => {
    this.props.enabledFn(this.state.catsEnabled, provsEnabled);
    this.setState({ provsEnabled: provsEnabled });
  }

  // TODO: handle noDots for LongitudinalView???
  render() {
//      console.log('SF render: ' + (this.state.dotClickContext ? this.state.dotClickContext.date : this.state.dotClickContext));
    let dates = this.props.dates;
    const extendedChildren = React.Children.map(this.props.children, child => {
      // Add context, nextPrevFn props
      return React.cloneElement(child, {context: this.state.dotClickContext,
        nextPrevFn: this.onNextPrevClick} );
    });
    const dotClickFn = this.props.allowDotClick ? this.onDotClick : null;

    return (
      <div className='standard-filters'>
        <TimeWidget minDate={dates ? dates.minDate : ''} maxDate={dates ? dates.maxDate : ''}
                    startDate={dates ? dates.startDate : ''} endDate={dates ? dates.endDate : ''} dotContext={this.state.dotClickContext}
                    thumbLeft={this.state.minActivePos} thumbRight={this.state.maxActivePos} timelineWidth={this.state.svgWidth}
                    setLeftRightFn={this.setLeftRight} dotPositionsFn={this.fetchDotPositions} dotClickFn={dotClickFn} />
        <div className='standard-filters-categories-and-providers'>
          <Categories>
            <CategoryRollup key='rollup' svgWidth={this.state.svgWidth} noDots={!this.state.timelineIsExpanded} isExpanded={this.state.catsExpanded}
                            dotPositionsFn={this.fetchDotPositions} dotClickFn={dotClickFn} expansionFn={this.onExpandContract}
                            catsEnabledFn={this.setAllCatsEnabled} categories={this.props.categories} />
            { this.state.catsExpanded ? [
              this.props.categories && this.props.categories.map(
                cat => <Category key={cat} svgWidth={this.state.svgWidth} categoryName={cat} isEnabled={this.state.catsEnabled[cat]}
                                 dotPositionsFn={this.fetchDotPositions} dotClickFn={dotClickFn} enabledFn={this.setEnabled} /> ),
              <div className='standard-filters-category-nav-spacer-bottom' key='1' />
            ] : null }
          </Categories>
          <Providers>
            <ProviderRollup key='rollup' svgWidth={this.state.svgWidth} isExpanded={this.state.provsExpanded}
                            dotPositionsFn={this.fetchDotPositions} dotClickFn={dotClickFn} expansionFn={this.onExpandContract}
                            provsEnabledFn={this.setAllProvsEnabled} providers={this.props.providers} />
            { this.state.provsExpanded ? [
              this.props.providers.map(
                prov => <Provider key={prov} svgWidth={this.state.svgWidth} providerName={prov} isEnabled={this.state.provsEnabled[prov]}
                                  dotPositionsFn={this.fetchDotPositions} dotClickFn={dotClickFn} enabledFn={this.setEnabled} /> ),
              <div className='standard-filters-provider-nav-spacer-bottom' key='1' />
            ] : null }
          </Providers>
        </div>
        { extendedChildren }
      </div>
    );
  }
}
