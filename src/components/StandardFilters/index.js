import React from 'react';
import {
  atom,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';
import PropTypes from 'prop-types';

import './StandardFilters.css';
import FhirTransform from '../../FhirTransform.js';
import {
  combine, cleanDates, normalizeDates, checkQuerySelector, notEqJSON, dateOnly,
} from '../../util.js';
import TimeWidget from '../TimeWidget';
import Unimplemented from '../Unimplemented';

import { SUBROUTES } from '../../constants';
import {
  activeCategoriesState, activeProvidersState, resourcesState, timelineRangeParamsState, timeFiltersState,
} from '../../recoil';

const ALLOW_DOT_CLICK = true;

class StandardFilters extends React.PureComponent {
  static propTypes = {
    activeView: PropTypes.oneOf(SUBROUTES),
    resources: PropTypes.instanceOf(FhirTransform),
    timelineRangeParams: PropTypes.shape({
      allDates: PropTypes.arrayOf(PropTypes.shape({
        position: PropTypes.number.isRequired,
        date: PropTypes.string.isRequired,
      })).isRequired,
      minDate: PropTypes.string.isRequired, // Earliest date we have data for this participant
      startDate: PropTypes.string.isRequired, // Jan 1 of minDate's year
      maxDate: PropTypes.string.isRequired, // Latest date we have data for this participant
      endDate: PropTypes.string.isRequired, // Dec 31 of last year of timeline tick periods
    }),
    activeCategories: PropTypes.shape({}).isRequired,
    activeProviders: PropTypes.shape({}).isRequired,
    // enabledFn: PropTypes.func.isRequired, // Callback to report changed category & provider enable/disable
    // dateRangeFn: PropTypes.func, // Optional callback to report changed thumb positions
  }

  state = {
    minActivePos: 0.0, // Location [0..1] of TimeWidget left thumb
    maxActivePos: 1.0, // Location [0..1] of TimeWidget right thumb
    timelineIsExpanded: false, // Is expanded timeline displayed (restricted dot range in effect)
    catsExpanded: true,
    provsExpanded: true,
    svgWidth: '0px',
    // dotClickContext: null, // The current dot (if one is highlighted)
    activeDates: {}, // Dates that are within the TimeWidget's active range and have one or more resources with enabled Categories/Providers
    searchRefs: [],
    dotClickDate: null, // dot click from ContentPanel
    viewAccentDates: [], // CatalogView & CompareView
    viewLastAccentDates: [], // CatalogView & CompareView
  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize);
    // window.addEventListener('keydown', this.onEvent);
    this.updateSvgWidth();
    const { timelineRangeParams } = this.props;
    if (timelineRangeParams?.allDates && ALLOW_DOT_CLICK) {
      const data = this.fetchDataForDot('TimeWidget', 'Full', timelineRangeParams.maxDate);
      // console.info('fetchDataForDot, data: ', JSON.stringify(data, null, '  '));
      this.props.setDotClickContext({
        parent: 'TimeWidget',
        rowName: 'Full',
        dotType: 'active',
        minDate: timelineRangeParams.minDate,
        maxDate: timelineRangeParams.maxDate,
        startDate: timelineRangeParams.startDate,
        endDate: timelineRangeParams.endDate,

        allDates: timelineRangeParams.allDates,
        date: timelineRangeParams.maxDate,
        data,
        position: timelineRangeParams.allDates[timelineRangeParams.allDates.length - 1].position,
      });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
    // window.removeEventListener('keydown', this.onEvent);
  }

  onResize = (_event) => {
    this.updateSvgWidth();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.activeView !== this.props.activeView) {
      this.updateSvgWidth();
    }

    if (
      prevState.minActivePos !== this.state.minActivePos
        || prevState.maxActivePos !== this.state.maxActivePos
        || notEqJSON(prevProps.activeCategories, this.props.activeCategories)
        || notEqJSON(prevProps.activeProviders, this.props.activeProviders)
    ) {
      this.setState({ activeDates: this.calcActiveDates() }); // problem with green dots not showing up is because this.calcActiveDates() doesn't fire on initial load
    }

    if (ALLOW_DOT_CLICK && prevState.dotClickDate !== this.state.dotClickDate) {
      // Set dotClickContext from dot clicked in ContentPanel (via this.state.dotClickDate)'
      const { timelineRangeParams } = this.props;
      const theDate = timelineRangeParams.allDates.find((elt) => new Date(elt.date).getTime() === new Date(this.state.dotClickDate).getTime());
      this.props.setDotClickContext({
        parent: 'TimeWidget',
        rowName: 'Full',
        dotType: 'active',
        minDate: timelineRangeParams.minDate,
        maxDate: timelineRangeParams.maxDate,
        allDates: timelineRangeParams.allDates,
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
        && this.props.activeCategories[trueCategory]
        && this.props.activeProviders[res.provider]) {
        // This resource's date is active
        activeDates[dateOnly(res.itemDate)] = true;
      }
    }
    return activeDates;
  }

  // Kluge: following needs to know about lower-level classes
  updateSvgWidth = (_event) => {
    const availableWidthEl = checkQuerySelector('#measure-available-width');
    if (availableWidthEl) {
      const availableWidth = availableWidthEl.getBoundingClientRect().width;
      const MIN_WIDTH = 810;
      this.setState({ svgWidth: `${Math.max(MIN_WIDTH, availableWidth)}px` });
    }
  }

  //
  // Callback function to record category/provider enable/disable
  //   parent:    'Category', 'Provider'
  //   rowName:  <category-name>/<provider-name>
  //   isEnabled:  the current state to record
  //

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
    const { timelineRangeParams } = this.props;
    if (timelineRangeParams) {
      const min = new Date(timelineRangeParams.startDate ? timelineRangeParams.startDate : 0).getTime();
      const max = new Date(timelineRangeParams.endDate ? timelineRangeParams.endDate : 0).getTime();
      const target = min + (max - min) * pos;
      return new Date(target).toISOString();
    }
    return new Date().toISOString();
  }

  // TODO: Move to util.js?
  dateToPos(dateStr) {
    const { timelineRangeParams } = this.props;
    const min = new Date(timelineRangeParams.startDate ? timelineRangeParams.startDate : 0).getTime();
    const max = new Date(timelineRangeParams.endDate ? timelineRangeParams.endDate : 0).getTime();
    const target = new Date(dateStr).getTime();
    return (target - min) / (max - min);
  }

  // Record thumb positions as returned from StandardFilters
  setDateRange = (minDate, maxDate) => {
    this.props.updateTimeFilters({
      dateRangeStart: minDate.substring(0, 10),
      dateRangeEnd: maxDate.substring(0, 10),
    });
  }

  //
  // Handle TimeWidget left/right thumb movement
  //   minActivePos:  location [0..1] of left thumb
  //   maxActivePos:  location [0..1] of right thumb
  //   isExpanded:  true if secondary (expanded) timeline visible
  //
  setLeftRight = (minActivePos, maxActivePos, isExpanded) => {
    //      console.log('minPos: ' + minActivePos + '  maxPos: ' + maxActivePos);
    const minDate = this.posToDate(minActivePos);
    const maxDate = this.posToDate(maxActivePos);
    this.setDateRange(minDate, maxDate);
    this.setState({
      minActivePos,
      maxActivePos,
      timelineIsExpanded: isExpanded,
    });
  }

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
    console.info('obsolete onDotClick -- context, date, dotType: ', context, date, dotType); // eslint-disable-line no-console
    try {
      if (ALLOW_DOT_CLICK) {
        const { timelineRangeParams } = this.props;
        const rowDates = this.fetchDotPositions(context.parent, context.rowName, true, true);
        const { position } = rowDates.find((elt) => elt.date === date);

        context.dotType = this.updateDotType(dotType, position, false);
        context.minDate = rowDates[0].date;
        context.maxDate = rowDates[rowDates.length - 1].date;
        context.allDates = timelineRangeParams.allDates;
        context.date = date;
        context.position = position;
        context.data = this.fetchDataForDot(context.parent, context.rowName, context.date);

        this.setState({ dotClickContext: context });
      }
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
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

  // Callback function for this component's state, returning the requested array of position+date+dotType objects
  //      parent:  'CategoryRollup', 'Category', 'ProviderRollup', 'Provider', 'TimeWidget'
  //     rowName:  <category-name>/<provider-name>/'Full' or 'Active' (for TimeWidget)
  //   isEnabled:  'true' = render normally, 'false' = active dots become inactive
  //    fetchAll:  'true' = don't label dots with dotType, 'false' = label each dot with dotType
  fetchDotPositions = (parent, rowName, isEnabled, fetchAll) => {
    const { timelineRangeParams } = this.props;
    if (!this.props.resources || !timelineRangeParams || timelineRangeParams.allDates.length === 0) {
      return [];
    }
    const { startDate, endDate, allDates } = timelineRangeParams;
    const { searchRefs } = this.state;
    const viewAccentRefs = this.state.viewAccentDates.reduce((result, date) => {
      result.push({
        dotType: 'view-accent',
        date,
        position: normalizeDates([date], startDate, endDate)[0],
      });
      return result;
    }, []);
    const viewLastAccentRefs = this.state.viewLastAccentDates.reduce((result, date) => {
      result.push({
        dotType: 'view-last-accent',
        date,
        position: normalizeDates([date], startDate, endDate)[0],
      });
      return result;
    }, []);

    const { dotClickContext } = this.props;
    const matchContext = dotClickContext && (parent === 'CategoryRollup' || parent === 'ProviderRollup' || parent === 'TimeWidget'
        || (dotClickContext.parent === parent && dotClickContext.rowName === rowName));
    const inactiveHighlightDots = ALLOW_DOT_CLICK && matchContext && allDates.reduce((res, elt) =>
    //               ((!isEnabled || !this.isActiveTimeWidget(elt)) && elt.position === dotClickContext.position)
      (((!isEnabled || !this.isActive(elt)) && elt.position === dotClickContext.position)
        ? this.includeDot(res, elt, 'inactive-highlight', parent === 'TimeWidget') : res), []);

    const activeHighlightDots = ALLOW_DOT_CLICK && matchContext && allDates.reduce((res, elt) =>
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
      case 'CategoryRollup':
        if (fetchAll) {
          return allDates;
        }

        return combine(allDates.reduce((res, elt) => (this.isActive(elt) ? this.includeDot(res, elt, 'active') : res), []),
          searchRefs.reduce((res, elt) => (this.isActive(elt) ? this.includeDot(res, elt, 'active-search') : res), []),
          viewAccentRefs.reduce((res, elt) => (this.isActive(elt) ? this.includeDot(res, elt, 'view-accent') : res), []),
          viewLastAccentRefs.reduce((res, elt) => (this.isActive(elt) ? this.includeDot(res, elt, 'view-last-accent')
            : res), []),
          highlightDots);
      default: // TimeWidget
        if (fetchAll) {
          return allDates;
        } if (rowName === 'Full') {
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

  // TODO: handle noDots for LongitudinalView???
  render() {
    //      console.log('SF render: ' + (this.props.dotClickContext ? this.props.dotClickContext.date : this.props.dotClickContext));
    const { timelineRangeParams } = this.props;
    const dotClickFn = ALLOW_DOT_CLICK ? this.onDotClick : null;

    return (
      <TimeWidget
        minDate={timelineRangeParams.minDate ?? ''}
        maxDate={timelineRangeParams.maxDate ?? ''}
        startDate={timelineRangeParams.startDate ?? ''}
        endDate={timelineRangeParams.endDate ?? ''}
        dotContext={this.props.dotClickContext}
        thumbLeft={this.state.minActivePos}
        thumbRight={this.state.maxActivePos}
        timelineWidth={this.state.svgWidth}
        setLeftRightFn={this.setLeftRight}
        dotPositionsFn={this.fetchDotPositions}
        dotClickFn={dotClickFn}
      />
    );
  }
}

export const dotClickContextState = atom({
  key: 'dotClickContextState', // unique ID (with respect to other atoms/selectors)
  default: null, // default value (aka initial value)
});

const StandardFiltersHOC = React.memo((props) => {
  const timelineRangeParams = useRecoilValue(timelineRangeParamsState);
  const updateTimeFilters = useSetRecoilState(timeFiltersState);
  const { legacy } = useRecoilValue(resourcesState);

  const [dotClickContext, setDotClickContext] = useRecoilState(dotClickContextState);

  const activeCategories = useRecoilValue(activeCategoriesState);
  const activeProviders = useRecoilValue(activeProvidersState);

  if (!timelineRangeParams.allDates) {
    return null;
  }

  return (
    <StandardFilters
      {...props} // eslint-disable-line react/jsx-props-no-spreading
      updateTimeFilters={updateTimeFilters}
      dotClickContext={dotClickContext}
      setDotClickContext={setDotClickContext}
      activeCategories={activeCategories}
      activeProviders={activeProviders}
      resources={legacy}
      timelineRangeParams={timelineRangeParams}
    />
  );
});

// StandardFiltersHOC.propTypes = StandardFilters.propTypes;

export default StandardFiltersHOC;
