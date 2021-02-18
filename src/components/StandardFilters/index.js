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
import { normalizeDates, checkQuerySelector } from '../../util.js';
import TimeWidget from '../TimeWidget';

import { SUBROUTES } from '../../constants';
import {
  resourcesState, timelineRangeParamsState, timeFiltersState, activeDatesState,
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
    // enabledFn: PropTypes.func.isRequired, // Callback to report changed category & provider enable/disable
    // dateRangeFn: PropTypes.func, // Optional callback to report changed thumb positions
  }

  state = {
    minActivePos: 0.0, // Location [0..1] of TimeWidget left thumb
    maxActivePos: 1.0, // Location [0..1] of TimeWidget right thumb
    timelineIsExpanded: false, // Is expanded timeline displayed (restricted dot range in effect)
    svgWidth: '0px',
    // dotClickContext: null, // The current dot (if one is highlighted)
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
  }

  onResize = (_event) => {
    this.updateSvgWidth();
  }

  componentDidUpdate(prevProps, _prevState) {
    if (prevProps.activeView !== this.props.activeView) {
      this.updateSvgWidth();
    }
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
  // TODO: migrate this method into TimeWidget?
  fetchDotPositions = (parent, rowName) => {
    const { timelineRangeParams } = this.props;
    if (!this.props.resources || !timelineRangeParams || timelineRangeParams.allDates.length === 0) {
      return [];
    }

    const { activeDates } = this.props;
    const { startDate, endDate } = timelineRangeParams;

    if (rowName === 'Full') {
      return activeDates;
    }

    const { minActivePos, maxActivePos } = this.state;

    return activeDates.filter(({ inRange }) => inRange)
      .map((el) => {
        const { date } = el;
        const position = normalizeDates([date], startDate, endDate)[0];
        return ({
          ...el,
          position: (position - minActivePos) / (maxActivePos - minActivePos),
        });
      });
  }

  // TODO: handle noDots for LongitudinalView???
  render() {
    //      console.log('SF render: ' + (this.props.dotClickContext ? this.props.dotClickContext.date : this.props.dotClickContext));
    const { timelineRangeParams } = this.props;

    return (
      <TimeWidget
        minDate={timelineRangeParams.minDate ?? ''}
        maxDate={timelineRangeParams.maxDate ?? ''}
        startDate={timelineRangeParams.startDate ?? ''}
        endDate={timelineRangeParams.endDate ?? ''}
        // dotContext={this.props.dotClickContext}
        thumbLeft={this.state.minActivePos}
        thumbRight={this.state.maxActivePos}
        timelineWidth={this.state.svgWidth}
        setLeftRightFn={this.setLeftRight}
        dotPositionsFn={this.fetchDotPositions}
        lastDot={timelineRangeParams?.allDates.slice(-1)[0]}
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

  const activeDates = useRecoilValue(activeDatesState);

  if (!timelineRangeParams.allDates) {
    return null;
  }

  return (
    <StandardFilters
      {...props} // eslint-disable-line react/jsx-props-no-spreading
      updateTimeFilters={updateTimeFilters}
      activeDates={activeDates}
      dotClickContext={dotClickContext}
      setDotClickContext={setDotClickContext}
      resources={legacy}
      timelineRangeParams={timelineRangeParams}
    />
  );
});

// StandardFiltersHOC.propTypes = StandardFilters.propTypes;

export default StandardFiltersHOC;
