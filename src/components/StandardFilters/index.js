import React from 'react';
import {
  atom,
  useRecoilState,
} from 'recoil';
import PropTypes from 'prop-types';

import './StandardFilters.css';
import FhirTransform from '../../FhirTransform.js';
import {
  getStyle, numericPart, combine, cleanDates, normalizeDates, checkQuerySelector, notEqJSON, dateOnly,
} from '../../util.js';
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
class StandardFilters extends React.Component {
  static contextType = DiscoveryContext; // Allow the shared context to be accessed via 'this.context'

  static propTypes = {
    resources: PropTypes.instanceOf(FhirTransform),
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
    catsEnabled: PropTypes.object.isRequired, // Initial state
    providers: PropTypes.arrayOf(PropTypes.string).isRequired,
    provsEnabled: PropTypes.object.isRequired,
    enabledFn: PropTypes.func.isRequired, // Callback to report changed category & provider enable/disable
    dateRangeFn: PropTypes.func, // Optional callback to report changed thumb positions
    lastEvent: PropTypes.instanceOf(Event),
    allowDotClick: PropTypes.bool,
    dotClickDate: PropTypes.string,
  }

  state = {
    minActivePos: 0.0, // Location [0..1] of TimeWidget left thumb
    maxActivePos: 1.0, // Location [0..1] of TimeWidget right thumb
    timelineIsExpanded: false, // Is expanded timeline displayed (restricted dot range in effect)
    catsExpanded: true,
    catsEnabled: {}, // Enabled status of categories
    provsExpanded: true,
    provsEnabled: {}, // Enabled status of providers
    svgWidth: '0px',
    // dotClickContext: null, // The current dot (if one is highlighted)
    activeDates: {}, // Dates that are within the TimeWidget's active range and have one or more resources with enabled Categories/Providers
  }

  componentDidMount() {
    this.updateSvgWidth();
    if (this.props.dates && this.props.allowDotClick) {
      this.props.setDotClickContext({
        parent: 'TimeWidget',
        rowName: 'Full',
        dotType: 'active',
        minDate: this.props.dates.minDate,
        maxDate: this.props.dates.maxDate,
        startDate: this.props.dates.startDate,
        endDate: this.props.dates.endDate,
        allDates: this.props.dates.allDates,
        date: this.props.dates.maxDate,
        data: this.fetchDataForDot('TimeWidget', 'Full', this.props.dates.maxDate),
        position: this.props.dates.allDates[this.props.dates.allDates.length - 1].position,
      });
    }

    this.setState({ catsEnabled: this.props.catsEnabled, provsEnabled: this.props.provsEnabled });
    this.props.enabledFn(this.props.catsEnabled, this.props.provsEnabled);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.minActivePos !== this.state.minActivePos
      || prevState.maxActivePos !== this.state.maxActivePos
      || notEqJSON(prevState.catsEnabled, this.state.catsEnabled)
      || notEqJSON(prevState.provsEnabled, this.state.provsEnabled)) {
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
      //   if (recentRef.position !== this.props.dotClickContext.position) {
      //      let newContext = Object.assign({}, this.props.dotClickContext);
      //      newContext.date = recentRef.date;
      //      newContext.position = recentRef.position;
      //      this.setState({ dotClickContext: newContext });
      //   }
    } else if (this.props.allowDotClick && prevProps.dotClickDate !== this.props.dotClickDate) {
      // Set dotClickContext from dot clicked in ContentPanel (via this.props.dotClickDate)
      const theDate = this.props.dates.allDates.find((elt) => new Date(elt.date).getTime() === new Date(this.props.dotClickDate).getTime());
      this.props.setDotClickContext({
        parent: 'TimeWidget',
        rowName: 'Full',
        dotType: 'active',
        minDate: this.props.dates.minDate,
        maxDate: this.props.dates.maxDate,
        allDates: this.props.dates.allDates,
        date: theDate.date,
        data: this.fetchDataForDot('TimeWidget', 'Full', theDate.date),
        position: theDate.position,
      });
    }
  }

  calcActiveDates() {
    const activeDates = {};
    for (const res of this.props.resources.transformed) {
      const trueCategory = Unimplemented.unimplementedCats.includes(res.category) ? Unimplemented.catName : res.category;
      if (this.isActiveTimeWidget({ position: this.dateToPos(res.itemDate) })
        && this.state.catsEnabled[trueCategory]
        && this.state.provsEnabled[res.provider]) {
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
      const svgWidth = `${category.getBoundingClientRect().width - categoryNav.getBoundingClientRect().width - 13 // TODO: fix (far-right margin)
        - numericPart(getStyle(categoryNav, 'margin-left')) - numericPart(getStyle(categoryNav, 'margin-right'))}px`;
      this.setState({ svgWidth });
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
        const catsEnabled = { ...this.state.catsEnabled, [rowName]: isEnabled };
        this.props.enabledFn(catsEnabled, this.state.provsEnabled);
        this.setState({ catsEnabled }, () => {
          const enabled = Object.keys(this.state.catsEnabled).reduce((count, key) => count + (this.state.catsEnabled[key]
          && this.props.categories.includes(key) ? 1 : 0), 0);
          if (enabled === 0 || enabled === this.props.categories.length) {
            // Clear saved categories enabled
            this.context.updateGlobalContext({ savedCatsEnabled: null });
          }
        });
      }
    } else {
      // Provider
      if (this.state.provsEnabled[rowName] !== isEnabled) {
        const provsEnabled = { ...this.state.provsEnabled, [rowName]: isEnabled };
        this.props.enabledFn(this.state.catsEnabled, provsEnabled);
        this.setState({ provsEnabled }, () => {
          const enabled = Object.keys(this.state.provsEnabled).reduce((count, key) => count + (this.state.provsEnabled[key]
          && this.props.providers.includes(key) ? 1 : 0), 0);
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
  isActiveTimeWidget = (dot) => dot.position >= this.state.minActivePos && dot.position <= this.state.maxActivePos

  //
  // Is 'dot':  (1) in the TimeWidget's active range
  //    (2) associated with an active Category
  //    (3) associated with an active Provider
  isActive = (dot) => this.state.activeDates[dateOnly(dot.date)]

  //
  // Mark a position-scaled copy of this dot with 'dotType' and include in result array
  //
  includeDot(result, dot, dotType, noExpand) {
    const min = this.state.minActivePos;
    const max = this.state.maxActivePos;
    if (noExpand || max - min > 0) {
      result.push({ dotType, ...dot, ...(noExpand ? {} : { position: (dot.position - min) / (max - min) }) });
    }
    return result;
  }

  // TODO: Move to util.js?
  posToDate(pos) {
    if (this.props.dates) {
      const min = new Date(this.props.dates.startDate ? this.props.dates.startDate : 0).getTime();
      const max = new Date(this.props.dates.endDate ? this.props.dates.endDate : 0).getTime();
      const target = min + (max - min) * pos;
      return new Date(target).toISOString();
    }
    return new Date().toISOString();
  }

  // TODO: Move to util.js?
  dateToPos(dateStr) {
    const min = new Date(this.props.dates.startDate ? this.props.dates.startDate : 0).getTime();
    const max = new Date(this.props.dates.endDate ? this.props.dates.endDate : 0).getTime();
    const target = new Date(dateStr).getTime();
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
    if (this.props.dateRangeFn) {
      const minDate = this.posToDate(minActivePos);
      const maxDate = this.posToDate(maxActivePos);
      this.props.dateRangeFn(minDate, maxDate);
    }
    this.setState({
      minActivePos,
      maxActivePos,
      timelineIsExpanded: isExpanded,
    });
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
    const thumbDistance = this.state.maxActivePos - this.state.minActivePos;
    const oldPosition = this.props.dotClickContext.position;
    const newContext = { ...this.props.dotClickContext };
    const dates = this.fetchDotPositions(newContext.parent, newContext.rowName, true, true);
    const currDateIndex = dates.findIndex((elt) => elt.date === newContext.date);

    let ret = false;

    if (currDateIndex === -1) {
      // TODO: an error!
      return false;
    }

    // Determine next/prev date
    if (direction === 'next') {
      if (currDateIndex === dates.length - 1) {
        // No 'next' -- do nothing
        return false;
      }
      newContext.date = dates[currDateIndex + 1].date;
      newContext.position = dates[currDateIndex + 1].position;
      ret = currDateIndex + 1 < dates.length - 1;
      // Adjust thumb positions if current dot is in active range
      if (this.isActiveTimeWidget(this.props.dotClickContext)) {
        const newMax = Math.min(1.0, this.state.maxActivePos + newContext.position - oldPosition);
        this.setState({ minActivePos: newMax - thumbDistance, maxActivePos: newMax });
      }
    } else {
      // 'prev'
      if (currDateIndex === 0) {
        // No 'prev' -- do nothing
        return false;
      }
      newContext.date = dates[currDateIndex - 1].date;
      newContext.position = dates[currDateIndex - 1].position;
      ret = currDateIndex - 1 > 0;
      // Adjust thumb positions if current dot is in active range
      if (this.isActiveTimeWidget(this.props.dotClickContext)) {
        const newMin = Math.max(0.0, this.state.minActivePos + newContext.position - oldPosition);
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
      const { position } = rowDates.find((elt) => elt.date === date);

      context.dotType = this.updateDotType(dotType, position, false);
      context.minDate = rowDates[0].date;
      context.maxDate = rowDates[rowDates.length - 1].date;
      context.allDates = this.props.dates.allDates;
      context.date = date;
      context.position = position;
      context.data = this.fetchDataForDot(context.parent, context.rowName, context.date);

      this.setState({ dotClickContext: context });
    }
  }

  updateDotType(dotType, position, forceSearch) {
    const isActivePos = position >= this.state.minActivePos && position <= this.state.maxActivePos;
    const isSearch = dotType.includes('search') || forceSearch;
    const parts = [];
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
    }
    const { startDate, endDate, allDates } = this.props.dates;
    const { searchRefs } = this.context;
    const viewAccentRefs = this.context.viewAccentDates.reduce((result, date) => {
      result.push({
        dotType: 'view-accent',
        date,
        position: normalizeDates([date], startDate, endDate)[0],
      });
      return result;
    }, []);
    const viewLastAccentRefs = this.context.viewLastAccentDates.reduce((result, date) => {
      result.push({
        dotType: 'view-last-accent',
        date,
        position: normalizeDates([date], startDate, endDate)[0],
      });
      return result;
    }, []);
    //  // TODO: to use, need to build highlightedResources on Tiles/Compare load
    //   let viewAccentRefs = this.context.highlightedResources ? this.context.highlightedResources.reduce((result, res) => {
    //            let date = res.itemDate;
    //            result.push({ dotType: 'view-accent', date: date, position: normalizeDates([date], startDate, endDate)[0] });
    //            return result;
    //               }, []) : [];

    const { dotClickContext } = this.props;
    const matchContext = dotClickContext && (parent === 'CategoryRollup' || parent === 'ProviderRollup' || parent === 'TimeWidget'
        || (dotClickContext.parent === parent && dotClickContext.rowName === rowName));
    const inactiveHighlightDots = this.props.allowDotClick && matchContext && allDates.reduce((res, elt) =>
    //               ((!isEnabled || !this.isActiveTimeWidget(elt)) && elt.position === dotClickContext.position)
      (((!isEnabled || !this.isActive(elt)) && elt.position === dotClickContext.position)
        ? this.includeDot(res, elt, 'inactive-highlight', parent === 'TimeWidget') : res), []);

    const activeHighlightDots = this.props.allowDotClick && matchContext && allDates.reduce((res, elt) =>
    //               (isEnabled && this.isActiveTimeWidget(elt) && elt.position === dotClickContext.position)
      ((isEnabled && this.isActive(elt) && elt.position === dotClickContext.position)
        ? this.includeDot(res, elt, 'active-highlight', parent === 'TimeWidget') : res), []);

    // TODO: is this correct (viewAccentRefs vs viewLastAccentRefs)?
    const viewAccentHighlightDots = matchContext && viewAccentRefs.reduce((res, elt) =>
    //               (isEnabled && this.isActiveTimeWidget(elt) && elt.position === dotClickContext.position)
      ((isEnabled && this.isActive(elt) && elt.position === dotClickContext.position)
        ? this.includeDot(res, elt, 'view-accent-highlight', parent === 'TimeWidget') : res), []);

    const inactiveHighlightSearchDots = matchContext && searchRefs.reduce((res, elt) =>
    //               ((!isEnabled || !this.isActiveTimeWidget(elt)) && elt.position === dotClickContext.position)
      (((!isEnabled || !this.isActive(elt)) && elt.position === dotClickContext.position)
        ? this.includeDot(res, elt, 'inactive-highlight-search', parent === 'TimeWidget') : res), []);

    const activeHighlightSearchDots = matchContext && searchRefs.reduce((res, elt) =>
    //               (isEnabled && this.isActiveTimeWidget(elt) && elt.position === dotClickContext.position)
      ((isEnabled && this.isActive(elt) && elt.position === dotClickContext.position)
        ? this.includeDot(res, elt, 'active-highlight-search', parent === 'TimeWidget') : res), []);

    const highlightDots = combine(inactiveHighlightDots, activeHighlightDots, viewAccentHighlightDots,
      inactiveHighlightSearchDots, activeHighlightSearchDots);

    switch (parent) {
      case 'ProviderRollup':
      case 'CategoryRollup':
        if (fetchAll) {
          return allDates;
        }
        //      return combine(allDates.reduce((res, elt) => this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'active') : res, []),
        //         searchRefs.reduce((res, elt) => this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'active-search') : res, []),
        //         viewAccentRefs.reduce((res, elt) => this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'view-accent') : res, []),
        //         viewLastAccentRefs.reduce((res, elt) => this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'view-last-accent')
        return combine(allDates.reduce((res, elt) => (this.isActive(elt) ? this.includeDot(res, elt, 'active') : res), []),
          searchRefs.reduce((res, elt) => (this.isActive(elt) ? this.includeDot(res, elt, 'active-search') : res), []),
          viewAccentRefs.reduce((res, elt) => (this.isActive(elt) ? this.includeDot(res, elt, 'view-accent') : res), []),
          viewLastAccentRefs.reduce((res, elt) => (this.isActive(elt) ? this.includeDot(res, elt, 'view-last-accent')
            : res), []),
          highlightDots);

      case 'Provider':
        const provDates = cleanDates(this.props.resources.pathItem(`[*provider=${rowName}].itemDate`, this.queryOptions));
        const normProvDates = normalizeDates(provDates, startDate, endDate);
        const provDateObjs = provDates.map((date, index) => ({ position: normProvDates[index], date }));
        const provSearchRefs = searchRefs.filter((elt) => elt.provider === rowName);
        if (fetchAll) {
          return provDateObjs;
        }
        //      return combine(provDateObjs.reduce((res, elt) => !isEnabled && this.isActiveTimeWidget(elt)
        //                  ? this.includeDot(res, elt, 'inactive') : res, []),
        //         provDateObjs.reduce((res, elt) => isEnabled && this.isActiveTimeWidget(elt)
        //                  ? this.includeDot(res, elt, 'active') : res, []),
        //         provSearchRefs.reduce((res, elt) => !isEnabled && this.isActiveTimeWidget(elt)
        //                  ? this.includeDot(res, elt, 'inactive-search') : res, []),
        //         provSearchRefs.reduce((res, elt) => isEnabled && this.isActiveTimeWidget(elt)
        //                  ? this.includeDot(res, elt, 'active-search') : res, []),
        //         highlightDots);
        return combine(provDateObjs.reduce((res, elt) => (!isEnabled || !this.isActive(elt)
          ? this.includeDot(res, elt, 'inactive') : res), []),
        provDateObjs.reduce((res, elt) => (isEnabled && this.isActive(elt)
          ? this.includeDot(res, elt, 'active') : res), []),
        provSearchRefs.reduce((res, elt) => (!isEnabled || !this.isActive(elt)
          ? this.includeDot(res, elt, 'inactive-search') : res), []),
        provSearchRefs.reduce((res, elt) => (isEnabled && this.isActive(elt)
          ? this.includeDot(res, elt, 'active-search') : res), []),
        highlightDots);

      case 'Category':
        const catDates = cleanDates(this.props.resources.pathItem(`[*category=${rowName}].itemDate`, this.queryOptions));
        const normCatDates = normalizeDates(catDates, startDate, endDate);
        const catDateObjs = catDates.map((date, index) => ({ position: normCatDates[index], date }));
        const catSearchRefs = searchRefs.filter((elt) => elt.category === rowName);
        if (fetchAll) {
          return catDateObjs;
        }
        //      return combine(catDateObjs.reduce((res, elt) => !isEnabled && this.isActiveTimeWidget(elt)
        //                  ? this.includeDot(res, elt, 'inactive') : res, []),
        //         catDateObjs.reduce((res, elt) => isEnabled && this.isActiveTimeWidget(elt)
        //                  ? this.includeDot(res, elt, 'active') : res, []),
        //         catSearchRefs.reduce((res, elt) => !isEnabled && this.isActiveTimeWidget(elt)
        //                  ? this.includeDot(res, elt, 'inactive-search') : res, []),
        //         catSearchRefs.reduce((res, elt) => isEnabled && this.isActiveTimeWidget(elt)
        //                  ? this.includeDot(res, elt, 'active-search') : res, []),
        //         highlightDots);
        return combine(catDateObjs.reduce((res, elt) => (!isEnabled || !this.isActive(elt)
          ? this.includeDot(res, elt, 'inactive') : res), []),
        catDateObjs.reduce((res, elt) => (isEnabled && this.isActive(elt)
          ? this.includeDot(res, elt, 'active') : res), []),
        catSearchRefs.reduce((res, elt) => (!isEnabled || !this.isActive(elt)
          ? this.includeDot(res, elt, 'inactive-search') : res), []),
        catSearchRefs.reduce((res, elt) => (isEnabled && this.isActive(elt)
          ? this.includeDot(res, elt, 'active-search') : res), []),
        highlightDots);

      default: // TimeWidget
        if (fetchAll) {
          return allDates;
        } if (rowName === 'Full') {
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
          return combine(allDates.reduce((res, elt) => (!this.isActive(elt)
            ? this.includeDot(res, elt, 'inactive', true) : res), []),
          allDates.reduce((res, elt) => (this.isActive(elt)
            ? this.includeDot(res, elt, 'active', true) : res), []),
          searchRefs.reduce((res, elt) => (!this.isActive(elt)
            ? this.includeDot(res, elt, 'inactive-search', true) : res), []),
          searchRefs.reduce((res, elt) => (this.isActive(elt)
            ? this.includeDot(res, elt, 'active-search', true) : res), []),
          viewAccentRefs.reduce((res, elt) => (this.isActive(elt)
            ? this.includeDot(res, elt, 'view-accent', true) : res), []),
          viewLastAccentRefs.reduce((res, elt) => (this.isActive(elt)
            ? this.includeDot(res, elt, 'view-last-accent', true) : res), []),
          highlightDots);
        } // TODO: currently not using this case
        alert(`SF fetchDotPositions(): ${parent} ${rowName} (huh???)`);
        //             return combine(allDates.reduce((res, elt) => this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'active') : res, []),
        //                searchRefs.reduce((res, elt) => this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'active-search') : res, []));
        return combine(allDates.reduce((res, elt) => (this.isActive(elt) ? this.includeDot(res, elt, 'active') : res), []),
          searchRefs.reduce((res, elt) => (this.isActive(elt) ? this.includeDot(res, elt, 'active-search') : res), []));
    }
  }

  setAllCatsEnabled = (catsEnabled) => {
    this.props.enabledFn(catsEnabled, this.state.provsEnabled);
    this.setState({ catsEnabled });
  }

  setAllProvsEnabled = (provsEnabled) => {
    this.props.enabledFn(this.state.catsEnabled, provsEnabled);
    this.setState({ provsEnabled });
  }

  // TODO: handle noDots for LongitudinalView???
  render() {
    //      console.log('SF render: ' + (this.props.dotClickContext ? this.props.dotClickContext.date : this.props.dotClickContext));

    const { dates } = this.props;

    const dotClickFn = this.props.allowDotClick ? this.onDotClick : null;

    return (
      <>
        <TimeWidget
          minDate={dates ? dates.minDate : ''}
          maxDate={dates ? dates.maxDate : ''}
          startDate={dates ? dates.startDate : ''}
          endDate={dates ? dates.endDate : ''}
          dotContext={this.props.dotClickContext}
          thumbLeft={this.state.minActivePos}
          thumbRight={this.state.maxActivePos}
          timelineWidth={this.state.svgWidth}
          setLeftRightFn={this.setLeftRight}
          dotPositionsFn={this.fetchDotPositions}
          dotClickFn={dotClickFn}
        />
        <div className="standard-filters-categories-and-providers">
          <Categories>
            <CategoryRollup
              key="rollup"
              svgWidth={this.state.svgWidth}
              noDots={!this.state.timelineIsExpanded}
              isExpanded={this.state.catsExpanded}
              dotPositionsFn={this.fetchDotPositions}
              dotClickFn={dotClickFn}
              expansionFn={this.onExpandContract}
              catsEnabledFn={this.setAllCatsEnabled}
              categories={this.props.categories}
            />
            { this.state.catsExpanded ? [
              this.props.categories && this.props.categories.map(
                (cat) => (
                  <Category
                    key={cat}
                    svgWidth={this.state.svgWidth}
                    categoryName={cat}
                    isEnabled={this.state.catsEnabled[cat]}
                    dotPositionsFn={this.fetchDotPositions}
                    dotClickFn={dotClickFn}
                    enabledFn={this.setEnabled}
                  />
                ),
              ),
              <div className="standard-filters-category-nav-spacer-bottom" key="1" />,
            ] : null }
          </Categories>
          <Providers>
            <ProviderRollup
              key="rollup"
              svgWidth={this.state.svgWidth}
              isExpanded={this.state.provsExpanded}
              dotPositionsFn={this.fetchDotPositions}
              dotClickFn={dotClickFn}
              expansionFn={this.onExpandContract}
              provsEnabledFn={this.setAllProvsEnabled}
              providers={this.props.providers}
            />
            { this.state.provsExpanded ? [
              this.props.providers.map(
                (prov) => (
                  <Provider
                    key={prov}
                    svgWidth={this.state.svgWidth}
                    providerName={prov}
                    isEnabled={this.state.provsEnabled[prov]}
                    dotPositionsFn={this.fetchDotPositions}
                    dotClickFn={dotClickFn}
                    enabledFn={this.setEnabled}
                  />
                ),
              ),
              <div className="standard-filters-provider-nav-spacer-bottom" key="1" />,
            ] : null }
          </Providers>
        </div>
      </>
    );
  }
}

export const dotClickContextState = atom({
  key: 'dotClickContextState', // unique ID (with respect to other atoms/selectors)
  default: null, // default value (aka initial value)
});

const StandardFiltersHOC = React.memo((props) => {
  const [dotClickContext, setDotClickContext] = useRecoilState(dotClickContextState);

  return (
    <StandardFilters
      {...props} // eslint-disable-line react/jsx-props-no-spreading
      dotClickContext={dotClickContext}
      setDotClickContext={setDotClickContext}
    />
  );
});

StandardFiltersHOC.propTypes = StandardFilters.propTypes;

export default StandardFiltersHOC;
