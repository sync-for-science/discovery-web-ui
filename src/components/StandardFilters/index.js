import React from 'react';
import {
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';
import PropTypes from 'prop-types';

import './StandardFilters.css';
import { checkQuerySelector } from '../../util.js';
import TimeWidget from '../TimeWidget';

import { SUBROUTES } from '../../constants';
import {
  timelineRangeParamsState, timeFiltersState, activeDatesState,
} from '../../recoil';

class StandardFilters extends React.PureComponent {
  static propTypes = {
    activeView: PropTypes.oneOf(SUBROUTES),
    timelineRangeParams: PropTypes.shape({
      allDates: PropTypes.arrayOf(PropTypes.shape({
        position: PropTypes.number.isRequired,
        date: PropTypes.string.isRequired,
      })).isRequired,
      activeDates: PropTypes.shape({}).isRequired,
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
  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize);
    // window.addEventListener('keydown', this.onEvent);
    this.updateSvgWidth();
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

  // TODO: handle noDots for LongitudinalView???
  render() {
    const { timelineRangeParams, activeDates } = this.props;

    return (
      <TimeWidget
        timelineRangeParams={timelineRangeParams}
        activeDates={activeDates}
        thumbLeft={this.state.minActivePos}
        thumbRight={this.state.maxActivePos}
        timelineWidth={this.state.svgWidth}
        setLeftRightFn={this.setLeftRight}
      />
    );
  }
}

const StandardFiltersHOC = React.memo((props) => {
  const timelineRangeParams = useRecoilValue(timelineRangeParamsState);
  const updateTimeFilters = useSetRecoilState(timeFiltersState);

  const activeDates = useRecoilValue(activeDatesState);

  if (!timelineRangeParams.allDates) {
    return null;
  }

  return (
    <StandardFilters
      {...props} // eslint-disable-line react/jsx-props-no-spreading
      updateTimeFilters={updateTimeFilters}
      activeDates={activeDates}
      timelineRangeParams={timelineRangeParams}
    />
  );
});

// StandardFiltersHOC.propTypes = StandardFilters.propTypes;

export default StandardFiltersHOC;
