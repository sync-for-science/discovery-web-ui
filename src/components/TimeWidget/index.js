import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import moment from 'moment';

import './TimeWidget.css';
import config from '../../config.js';
import {
  getStyle, formatDisplayDate, formatKeyDate, numericPart, timelineIncrYears,
} from '../../util.js';

import SVGContainer from '../SVGContainer';
import DotLine from '../DotLine';

//
// Render the DiscoveryApp Time Widget
//
export default class TimeWidget extends React.Component {
  static propTypes = {
    timelineRangeParams: PropTypes.shape({
      minDate: PropTypes.string.isRequired, // Earliest date we have data for this participant
      maxDate: PropTypes.string.isRequired, // Latest date we have data for this participant
      startDate: PropTypes.string.isRequired, // Left-most date of the primary timeline
      endDate: PropTypes.string.isRequired, // Right-most date of the primary timeline
    }),
    thumbLeft: PropTypes.number.isRequired, // Relative location [0..1] of the left-most thumb
    thumbRight: PropTypes.number.isRequired, // Relative location [0..1] of the right-most thumb
    timelineWidth: PropTypes.string.isRequired,
    setLeftRightFn: PropTypes.func.isRequired, // Communicate thumb movement to parent
    dotPositionsFn: PropTypes.func.isRequired, // Get dot positions from parent
  }

  constructor(props) {
    super(props);
    const {
      timelineRangeParams, thumbLeft, thumbRight, timelineWidth,
    } = props;

    this.state = {
      leftX: thumbLeft * numericPart(timelineWidth),
      rightX: thumbRight * numericPart(timelineWidth),
      thumbDates: { minDate: this.posToDate(thumbLeft), maxDate: this.posToDate(thumbRight) },
      showExpanded: false,
      rangeButton: 'ALL',
      lastDot: timelineRangeParams?.allDates.slice(-1)[0],
    };
  }

  // Define range button characteristics
  ranges = {
    ALL: {
      label: 'All',
      minPos: 0,
      maxPos: 1,
    },

    '10YRS': {
      label: '10 years',
      halfSize: 5,
      halfSizeUnit: 'years',
      fullSize: 10,
      fullSizeUnit: 'years',
    },

    '5YRS': {
      label: '5 years',
      halfSize: 30,
      halfSizeUnit: 'months',
      fullSize: 5,
      fullSizeUnit: 'years',
    },

    '1YR': {
      label: '1 year',
      halfSize: 6,
      halfSizeUnit: 'months',
      fullSize: 1,
      fullSizeUnit: 'year',
    },

    '6MOS': {
      label: '6 months',
      halfSize: 3,
      halfSizeUnit: 'months',
      fullSize: 6,
      fullSizeUnit: 'months',
    },

    '1MO': {
      label: '1 month',
      halfSize: 15,
      halfSizeUnit: 'days',
      fullSize: 1,
      fullSizeUnit: 'month',
    },
  }

  cacheSizes() {
    if (!this.centerThumbWidth) {
      const centerThumb = document.querySelector('.timeline-selector-center');
      this.centerThumbWidth = centerThumb ? centerThumb.clientWidth : 0;
    }
    if (!this.periodPadding) {
      const expanded = document.querySelector('.timeline-expanded-years');
      this.periodPadding = expanded ? numericPart(getStyle(expanded, 'padding-left')) + numericPart(getStyle(expanded, 'padding-right')) : 0;
    }
  }

  componentDidMount() {
    this.cacheSizes();
  }

  componentDidUpdate(prevProps, _prevState) {
    if (prevProps.timelineWidth !== this.props.timelineWidth || prevProps.thumbLeft !== this.props.thumbLeft) {
      this.setState({
        leftX: this.props.thumbLeft * numericPart(this.props.timelineWidth),
        thumbDates: { minDate: this.posToDate(this.props.thumbLeft), maxDate: this.posToDate(this.props.thumbRight) },
      });
      this.cacheSizes();
    }
    if (prevProps.timelineWidth !== this.props.timelineWidth || prevProps.thumbRight !== this.props.thumbRight) {
      this.setState({
        rightX: this.props.thumbRight * numericPart(this.props.timelineWidth),
        thumbDates: { minDate: this.posToDate(this.props.thumbLeft), maxDate: this.posToDate(this.props.thumbRight) },
      });
      this.cacheSizes();
    }
  }

  // TODO: Move to util.js?
  posToDate(pos) {
    const { startDate, endDate } = this.props.timelineRangeParams;

    const min = new Date(startDate || 0).getTime();
    const max = new Date(endDate || 0).getTime();
    const target = min + (max - min) * pos;
    return new Date(target).toISOString();
  }

  // TODO: Move to util.js?
  dateToPos(dateStr) {
    const { startDate, endDate } = this.props.timelineRangeParams;

    const min = new Date(startDate || 0).getTime();
    const max = new Date(endDate || 0).getTime();
    const target = new Date(dateStr).getTime();
    return (target - min) / (max - min);
  }

  onCenterDrag = (e, data) => {
    this.setState((prevState) => {
      const oldCenterX = (prevState.leftX + prevState.rightX - this.centerThumbWidth) / 2;
      const delta = data.x - oldCenterX;
      const newLeftX = prevState.leftX + delta;
      const newRightX = prevState.rightX + delta;
      const width = numericPart(this.props.timelineWidth);

      this.props.setLeftRightFn(newLeftX / width, newRightX / width, true);
      const dates = { minDate: this.posToDate(newLeftX / width), maxDate: this.posToDate(newRightX / width) };

      return ({
        leftX: newLeftX,
        rightX: newRightX,
        thumbDates: dates,
      });
    });
  }

  renderFullYears() {
    const { startDate, endDate } = this.props.timelineRangeParams;

    const firstYear = new Date(formatKeyDate(startDate)).getUTCFullYear();
    const lastYear = new Date(formatKeyDate(endDate)).getUTCFullYear();
    const thumbFirstYear = new Date(formatKeyDate(this.state.thumbDates.minDate)).getUTCFullYear();
    const thumbLastYear = new Date(formatKeyDate(this.state.thumbDates.maxDate)).getUTCFullYear();
    const incr = timelineIncrYears(startDate, endDate, config.maxSinglePeriods);
    const years = [];

    for (let year = firstYear; year <= lastYear; year += incr) {
      const className = year < thumbFirstYear || year >= thumbLastYear ? 'timeline-full-inactive-years'
        : (this.state.showExpanded ? 'timeline-full-active-double-years'
          : 'timeline-full-active-single-years');
      years.push(
        <div className={className} key={year}>
          {year}
        </div>,
      );
    }

    return (
      <div className="timeline">
        <div className="timeline-shim" key="shim-1" />
        {years}
        <div className="timeline-shim" key="shim-2" />
      </div>
    );
  }

  renderExpandedYears() {
    const fullWidth = numericPart(this.props.timelineWidth);

    const expMinDate = new Date(this.state.thumbDates.minDate);
    const expMaxDate = new Date(this.state.thumbDates.maxDate);

    const expFirstYear = parseInt(expMinDate.getFullYear()); // expMinDate's year
    const expLastYear = parseInt(expMaxDate.getFullYear()); // expMaxDate's year

    const expMonths = 1 + expMaxDate.getMonth() - expMinDate.getMonth() + 12 * (expLastYear - expFirstYear);

    const periods = [];
    let cumWidth = 0;

    if (expMonths >= config.maxSinglePeriods) {
      // Years
      const yearMillis = 31536000000;
      const MinWidthForYearLabel = 30;

      const periodIncr = timelineIncrYears(expMinDate.toISOString(), expMaxDate.toISOString(), config.maxSinglePeriods);
      const expPeriods = (expMaxDate - expMinDate) / (yearMillis * periodIncr);
      const periodWidth = (fullWidth / expPeriods) - this.periodPadding;

      const firstPeriodFrac = Math.min(1.0, (new Date(`${expFirstYear + periodIncr}-01-01`) - expMinDate) / (yearMillis * periodIncr));
      const firstPeriodWidth = Math.round(firstPeriodFrac * periodWidth);

      for (let year = expFirstYear; year <= expLastYear; year += periodIncr) {
        let thisWidth = 0;
        if (year === expFirstYear) {
          thisWidth = firstPeriodWidth;
        } else if ((periodIncr === 1 && year === expLastYear)
          || (periodIncr > 1 && year + periodIncr >= expLastYear)) {
          thisWidth = fullWidth - cumWidth - this.periodPadding; // Last period width
        } else {
          thisWidth = periodWidth;
        }

        cumWidth += thisWidth + this.periodPadding;

        if (thisWidth > 0) {
          periods.push(
            <div
              className="timeline-expanded-years"
              key={year}
              style={{
                width: thisWidth,
              }}
            >
              {thisWidth >= MinWidthForYearLabel ? year : null}
            </div>,
          );
        }
      }
    } else {
      // Months
      const dayMillis = 86400000;
      //   const MinWidthForMonthLabel = 70;    // Width for font-size:0.800rem
      const MinWidthForMonthLabel = 65; // Width for font-size:0.750rem
      const MinWidthForNarrowMonthLabel = 55;
      const avgMonthDays = 30.4;

      const daysInRange = (expMaxDate - expMinDate) / dayMillis;
      const monthsInRange = daysInRange / avgMonthDays;

      const avgMonthWidth = (fullWidth / monthsInRange) - this.periodPadding;
      const firstMonthWidth = Math.max(0, avgMonthWidth * (avgMonthDays - expMinDate.getDate()) / avgMonthDays);

      const monthDate = expMinDate;
      monthDate.setDate(1);

      for (let monthNum = 0; monthNum < expMonths; monthNum++) {
        let thisWidth = 0;
        if (monthNum === 0) {
          thisWidth = firstMonthWidth;
        } else if (monthNum === expMonths - 1) {
          thisWidth = fullWidth - cumWidth - this.periodPadding; // Last month width
        } else {
          thisWidth = avgMonthWidth;
        }

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthLabel = `${monthNames[monthDate.getMonth()]}-${monthDate.getFullYear()}`;
        const narrowMonthLabel = `${monthDate.getMonth() + 1}/${monthDate.getFullYear()}`;

        cumWidth += thisWidth + this.periodPadding;

        if (thisWidth > 0) {
          periods.push(
            <div
              className="timeline-expanded-years"
              key={monthLabel}
              style={{
                width: thisWidth,
              }}
            >
              {thisWidth >= MinWidthForMonthLabel ? monthLabel : thisWidth >= MinWidthForNarrowMonthLabel ? narrowMonthLabel : null}
            </div>,
          );
        }

        monthDate.setMonth(monthDate.getMonth() + 1);
      }
    }

    return (
      <div className="timeline-expanded">
        <div className={`timeline-shim-left${this.state.leftX === 0 ? '' : '-alt'}`} key="shim-1" />
        {periods}
        <div className={`timeline-shim-right${this.state.rightX === numericPart(this.props.timelineWidth) ? '' : '-alt'}`} key="shim-2" />
      </div>
    );
  }

  setRange(rangeTag, centerDate) {
    const { startDate, endDate } = this.props.timelineRangeParams;

    //      console.log(`Range: ${rangeTag}  CenterDate: ${centerDate}`);
    const range = this.ranges[rangeTag];
    let minPos = range.minPos !== undefined ? range.minPos
      : this.dateToPos(moment(centerDate).subtract(range.halfSize, range.halfSizeUnit).format());
    let maxPos = range.maxPos !== undefined ? range.maxPos
      : this.dateToPos(moment(centerDate).add(range.halfSize, range.halfSizeUnit).format());

    // Adjust window if extends beyond min/max dates
    if (maxPos > 1) {
      maxPos = 1;
      minPos = this.dateToPos(moment(endDate).subtract(range.fullSize, range.fullSizeUnit).format());
    } else if (minPos < 0) {
      minPos = 0;
      maxPos = this.dateToPos(moment(startDate).add(range.fullSize, range.fullSizeUnit).format());
    }

    const showExpanded = minPos !== 0 || maxPos !== 1;
    const thumbDates = { minDate: this.posToDate(minPos), maxDate: this.posToDate(maxPos) };
    const width = numericPart(this.props.timelineWidth);
    this.props.setLeftRightFn(minPos, maxPos, showExpanded);
    this.setState({
      leftX: minPos * width, rightX: maxPos * width, thumbDates, showExpanded,
    });
  }

  dotInRange(width) {
    const usePosition = this.state.lastDot.position;
    const dotX = usePosition * width;
    return this.state.leftX <= dotX && this.state.rightX >= dotX;
  }

  onRangeClick(range) {
    const width = numericPart(this.props.timelineWidth);
    const useDate = this.state.lastDot.date;
    const centerDate = this.dotInRange(width) ? useDate : this.posToDate((this.state.leftX + this.state.rightX) / (2 * width)); // center of current range

    this.setState({ rangeButton: range });
    this.setRange(range, centerDate);
  }

  onDotClick = (date) => {
    this.setRange(this.state.rangeButton, date);
  }

  renderRangeButtons() {
    const buttons = [];
    let key = 0;
    for (const range in this.ranges) {
      buttons.push(
        <button
          className={this.state.rangeButton === range ? 'date-range-button-on' : 'date-range-button-off'}
          key={key++}
          onClick={() => this.onRangeClick(range)}
        >
          {this.ranges[range].label}
        </button>,
      );
    }
    return buttons;
  }

  render() {
    const { startDate, endDate } = this.props.timelineRangeParams;
    //      const rangeMin = formatDisplayDate(this.props.thumbLeft !== 0 ? this.state.thumbDates.minDate : this.props.minDate, true, true);
    //      const rangeMax = formatDisplayDate(this.props.thumbRight !== 1 ? this.state.thumbDates.maxDate : this.props.maxDate, true, true);
    const rangeMin = formatDisplayDate(this.props.thumbLeft !== 0 ? this.state.thumbDates.minDate : startDate, true, true);
    const rangeMax = formatDisplayDate(this.props.thumbRight !== 1 ? this.state.thumbDates.maxDate : endDate, true, true);
    const rightBound = numericPart(this.props.timelineWidth);
    const rightGradientWidth = numericPart(this.props.timelineWidth) - this.state.rightX - 2; // minus 2px because of border width of 1px for left and right gradient

    return (
      <div className="time-widget" style={{ width: this.props.timelineWidth }}>
        <div className="timeline-controls">
          <div className="timeline-tbd-container">
            <div className="timeline-selector-gradient-container">
              { this.state.leftX > 0 && <div className="timeline-selector-gradient-left" style={{ width: `${this.state.leftX}px` }} /> }
              { rightGradientWidth > 0 && (
              <div
                className="timeline-selector-gradient-right"
                style={{ left: `${this.state.rightX - this.state.leftX}px`, width: `${rightGradientWidth}px` }}
              />
              ) }
            </div>
            { this.renderFullYears() }
            <SVGContainer
              className="timeline-svg-container"
              svgClassName="timeline-svg"
              svgWidth={this.props.timelineWidth}
            >
              <DotLine
                dotPositions={this.props.dotPositionsFn(true)}
                dotClickFn={this.onDotClick}
              />
            </SVGContainer>
          </div>
          <div className="timeline-range-controls">
            <div className={this.state.showExpanded ? 'date-range-data-left-focused' : 'date-range-data-left'}>
              {' '}
              {rangeMin}
            </div>
            <div className="timeline-button-container">
              { this.renderRangeButtons() }
            </div>
            <div className={this.state.showExpanded ? 'date-range-data-right-focused' : 'date-range-data-right'}>
              {' '}
              {rangeMax}
            </div>
          </div>
          { this.state.showExpanded
          && (
          <Draggable
            axis="x"
            bounds={{
              left: (this.state.rightX - this.state.leftX - this.centerThumbWidth) / 2,
              right: rightBound - this.centerThumbWidth - (this.state.rightX - this.state.leftX - this.centerThumbWidth) / 2,
            }}
            position={{ x: (this.state.leftX + this.state.rightX - this.centerThumbWidth) / 2, y: 0 }}
            onDrag={this.onCenterDrag}
          >
            <div className="timeline-selector-center" />
          </Draggable>
          ) }
          { this.state.showExpanded && this.renderExpandedYears() }
          { this.state.showExpanded && (
            <SVGContainer
              className="category-rollup-svg-container"
              svgClassName="category-rollup-svg"
              svgWidth={this.props.timelineWidth}
            >
              <DotLine
                dotPositions={this.props.dotPositionsFn(false)}
              />
            </SVGContainer>
          ) }
        </div>
      </div>
    );
  }
}
