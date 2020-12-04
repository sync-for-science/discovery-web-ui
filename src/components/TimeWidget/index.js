import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import moment from 'moment';

import './TimeWidget.css';
import config from '../../config.js';
import { formatPatientName } from '../../fhirUtil.js';
import { getStyle, formatDisplayDate, formatKeyDate, numericPart, timelineIncrYears } from '../../util.js';

import SVGContainer from '../SVGContainer';
import DotLine from '../DotLine';

import DiscoveryContext from '../DiscoveryContext';

//
// Render the DiscoveryApp Time Widget
//
export default class TimeWidget extends React.Component {

   static myName = 'TimeWidget';

   static contextType = DiscoveryContext;	// Allow the shared context to be accessed via 'this.context'

   static propTypes = {
      minDate: PropTypes.string.isRequired,		// Earliest date we have data for this participant
      maxDate: PropTypes.string.isRequired,		// Latest date we have data for this participant
      startDate: PropTypes.string.isRequired,		// Left-most date of the primary timeline
      endDate: PropTypes.string.isRequired,		// Right-most date of the primary timeline
      thumbLeft: PropTypes.number.isRequired,		// Relative location [0..1] of the left-most thumb
      thumbRight: PropTypes.number.isRequired,		// Relative location [0..1] of the right-most thumb
      timelineWidth: PropTypes.string.isRequired,
      setLeftRightFn: PropTypes.func.isRequired,	// Communicate thumb movement to parent
      dotPositionsFn: PropTypes.func.isRequired,	// Get dot positions from parent
      dotClickFn: PropTypes.func,			// Communicate dot click to parent
      dotContext: PropTypes.object			// The last clicked dot (or null)
   }
    
   state = {
      leftX: this.props.thumbLeft * numericPart(this.props.timelineWidth),
      rightX: this.props.thumbRight * numericPart(this.props.timelineWidth),
      thumbDates: {minDate: this.posToDate(this.props.thumbLeft), maxDate: this.posToDate(this.props.thumbRight)},
      showExpanded: false,
      rangeButton: 'ALL'
   }

   // Define range button characteristics
   ranges = {
      ALL: {
 label: 'All',
 minPos: 0,
 maxPos: 1
      },

      '10YRS': {
 label: '10 years',
 halfSize: 5,
 halfSizeUnit: 'years',
 fullSize: 10,
 fullSizeUnit: 'years'
      },

      '5YRS': {
 label: '5 years',
 halfSize: 30,
 halfSizeUnit: 'months',
 fullSize: 5,
 fullSizeUnit: 'years'
      },

      '1YR': {
 label: '1 year',
 halfSize: 6,
 halfSizeUnit: 'months',
 fullSize: 1,
 fullSizeUnit: 'year'
      },

      '6MOS': {
 label: '6 months',
 halfSize: 3,
 halfSizeUnit: 'months',
 fullSize: 6,
 fullSizeUnit: 'months'
      },

      '1MO': {
 label: '1 month',
 halfSize: 15,
 halfSizeUnit: 'days',
 fullSize: 1,
 fullSizeUnit: 'month'
      }
   }

   cacheSizes() {
      if (!this.centerThumbWidth) {
 let centerThumb = document.querySelector('.timeline-selector-center');
 this.centerThumbWidth = centerThumb ? centerThumb.clientWidth : 0;
      }
      if (!this.periodPadding) {
 let expanded = document.querySelector('.timeline-expanded-years');
 this.periodPadding = expanded ? numericPart(getStyle(expanded, 'padding-left')) + numericPart(getStyle(expanded, 'padding-right')) : 0;
      }	   
   }	

   componentDidMount() {
      this.cacheSizes();
   }

   componentDidUpdate(prevProps, prevState) {
      if (prevProps.timelineWidth !== this.props.timelineWidth || prevProps.thumbLeft !== this.props.thumbLeft) {
 this.setState({ leftX: this.props.thumbLeft * numericPart(this.props.timelineWidth),
 thumbDates: {minDate: this.posToDate(this.props.thumbLeft), maxDate: this.posToDate(this.props.thumbRight)} });
 this.cacheSizes();
      }
      if (prevProps.timelineWidth !== this.props.timelineWidth || prevProps.thumbRight !== this.props.thumbRight) {
 this.setState({ rightX: this.props.thumbRight * numericPart(this.props.timelineWidth),
 thumbDates: {minDate: this.posToDate(this.props.thumbLeft), maxDate: this.posToDate(this.props.thumbRight)} });
 this.cacheSizes();
      }
   }

   // TODO: Move to util.js?
   posToDate(pos) {
      let min = new Date(this.props.startDate ? this.props.startDate : 0).getTime();
      let max = new Date(this.props.endDate ? this.props.endDate : 0).getTime();
      let target = min + (max - min) * pos;
      return new Date(target).toISOString();
   }

   // TODO: Move to util.js?
   dateToPos(dateStr) {
      let min = new Date(this.props.startDate ? this.props.startDate : 0).getTime();
      let max = new Date(this.props.endDate ? this.props.endDate : 0).getTime();
      let target = new Date(dateStr).getTime();
      return (target - min) / (max - min);
   }

   onCenterDrag = (e, data) => {
      let oldCenterX = (this.state.leftX + this.state.rightX - this.centerThumbWidth)/2;
      let delta = data.x - oldCenterX;
      let newLeftX = this.state.leftX + delta;
      let newRightX = this.state.rightX + delta;
      let width = numericPart(this.props.timelineWidth);

      this.props.setLeftRightFn(newLeftX/width, newRightX/width, true);
      let dates = {minDate: this.posToDate(newLeftX/width), maxDate: this.posToDate(newRightX/width)};
      this.setState({ leftX: newLeftX, rightX: newRightX, thumbDates: dates });
   }

   renderFullYears() {
      const firstYear = new Date(formatKeyDate(this.props.startDate)).getUTCFullYear();
      const lastYear = new Date(formatKeyDate(this.props.endDate)).getUTCFullYear();
      const thumbFirstYear = new Date(formatKeyDate(this.state.thumbDates.minDate)).getUTCFullYear();
      const thumbLastYear = new Date(formatKeyDate(this.state.thumbDates.maxDate)).getUTCFullYear();
      const incr = timelineIncrYears(this.props.startDate, this.props.endDate, config.maxSinglePeriods);
      let years = [];

      for (let year = firstYear; year <= lastYear; year+=incr) {
 let className = year < thumbFirstYear || year >= thumbLastYear ? 'timeline-full-inactive-years'
: (this.state.showExpanded ? 'timeline-full-active-double-years'
   : 'timeline-full-active-single-years');
 years.push(
    <div className={className} key={year} >
       {year}
    </div>
 );
      }

      return (
         <div className='timeline'>
    <div className='timeline-shim' key='shim-1'/>
    {years}
    <div className='timeline-shim' key='shim-2'/>
 </div>
      );
   }

   renderExpandedYears() {
      const fullWidth = numericPart(this.props.timelineWidth);

      const expMinDate = new Date(this.state.thumbDates.minDate);
      const expMaxDate = new Date(this.state.thumbDates.maxDate);

      const expFirstYear = parseInt(expMinDate.getFullYear());	// expMinDate's year
      const expLastYear = parseInt(expMaxDate.getFullYear());	// expMaxDate's year

      const expMonths = 1 + expMaxDate.getMonth() - expMinDate.getMonth() + 12 * (expLastYear - expFirstYear);

      let periods = [];
      let cumWidth = 0;

      if (expMonths >= config.maxSinglePeriods) {
 // Years
 const yearMillis = 31536000000;
 const MinWidthForYearLabel = 30;

 const periodIncr = timelineIncrYears(expMinDate.toISOString(), expMaxDate.toISOString(), config.maxSinglePeriods);
 const expPeriods = (expMaxDate - expMinDate) / (yearMillis*periodIncr);
 const periodWidth = (fullWidth / expPeriods) - this.periodPadding;

 const firstPeriodFrac = Math.min(1.0,(new Date((expFirstYear+periodIncr)+'-01-01') - expMinDate)/(yearMillis*periodIncr));
 const firstPeriodWidth = Math.round(firstPeriodFrac * periodWidth);

 for (let year = expFirstYear; year <= expLastYear; year+=periodIncr) {

    let thisWidth = 0;
    if (year === expFirstYear) {
       thisWidth = firstPeriodWidth;
    } else if ((periodIncr === 1 && year === expLastYear) ||
       (periodIncr > 1 && year+periodIncr >= expLastYear)) {
       thisWidth = fullWidth - cumWidth - this.periodPadding;	// Last period width
    } else {
       thisWidth = periodWidth
    }

    cumWidth += thisWidth + this.periodPadding;

    if (thisWidth > 0) {
       periods.push(
          <div className='timeline-expanded-years' key={year} style={{width: thisWidth}}>
     {thisWidth >= MinWidthForYearLabel ? year : null}
          </div>
       );
    }
 }
      } else {
 // Months
 const dayMillis = 86400000;
//	 const MinWidthForMonthLabel = 70;		// Width for font-size:0.800rem
 const MinWidthForMonthLabel = 65;		// Width for font-size:0.750rem
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
     } else if (monthNum === expMonths-1) {
        thisWidth = fullWidth - cumWidth - this.periodPadding;	// Last month width
     } else {
        thisWidth = avgMonthWidth;
     }
     
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthLabel = monthNames[monthDate.getMonth()] + '-' + monthDate.getFullYear();
    const narrowMonthLabel = (monthDate.getMonth()+1) + '/' + monthDate.getFullYear();

    cumWidth += thisWidth + this.periodPadding;

     if (thisWidth > 0) {
        periods.push(
           <div className='timeline-expanded-years' key={monthLabel} style={{width: thisWidth}}>
      {thisWidth >= MinWidthForMonthLabel ? monthLabel : thisWidth >= MinWidthForNarrowMonthLabel ? narrowMonthLabel : null}
           </div>
        );
     }

    monthDate.setMonth(monthDate.getMonth()+1);
 }
      }

      return (
         <div className='timeline-expanded'>
    <div className={'timeline-shim-left' + (this.state.leftX === 0 ? '' : '-alt')} key='shim-1'/>
    {periods}
    <div className={'timeline-shim-right' + (this.state.rightX === numericPart(this.props.timelineWidth) ? '' : '-alt')} key='shim-2'/>
 </div>
      );
   }

   // TODO: collect following from individual view components?
   showHelp() {
      switch (this.context.currentView) {
 case 'reportView':
    return [
       <div className='timeline-help-col-1' key='1'>Shows your detailed data by date and time.</div>,
       <div className='timeline-help-col-2' key='2'>Select a dot to scroll to data for that date and time.</div>,
       <div className='timeline-help-col-3' key='3'>Adjust Records, Providers, or Time to change data shown.</div>
    ];

 case 'financialView':
    return [
       <div className='timeline-help-col-1' key='1'>Shows your claims and benefits data by date and time.</div>,
       <div className='timeline-help-col-2' key='2'>Select a dot to scroll to data for that date and time.</div>,
       <div className='timeline-help-col-3' key='3'>Adjust Records, Providers, or Time to change data shown.</div>
    ];

 case 'tilesView':
    return [
       <div className='timeline-help-col-1' key='1'>Cards summarize your unique data by Record type.</div>,
       <div className='timeline-help-col-2' key='2'>Select Cards to see your detailed data.</div>,
       <div className='timeline-help-col-3' key='3'>Adjust Records, Providers, or Time to change data shown.</div>
    ];

 case 'compareView':
    return [
       <div className='timeline-help-col-1' key='1'>Cards summarize your unique data by Record type and Provider.</div>,
       <div className='timeline-help-col-2' key='2'>Select Cards to see your detailed data.</div>,
       <div className='timeline-help-col-3' key='3'>Adjust Records, Providers, or Time to change data shown.</div>
    ];

 default:
    return '';
      }	   
   }

   setRange(rangeTag, centerDate) {
//      console.log(`Range: ${rangeTag}  CenterDate: ${centerDate}`);
      let range = this.ranges[rangeTag];
      let minPos = range.minPos !== undefined ? range.minPos
      : this.dateToPos(moment(centerDate).subtract(range.halfSize, range.halfSizeUnit).format());
      let maxPos = range.maxPos !== undefined ? range.maxPos
      : this.dateToPos(moment(centerDate).add(range.halfSize, range.halfSizeUnit).format());

      // Adjust window if extends beyond min/max dates
      if (maxPos > 1) {
 maxPos = 1;
 minPos = this.dateToPos(moment(this.props.endDate).subtract(range.fullSize, range.fullSizeUnit).format());
      } else if (minPos < 0) {
 minPos = 0;
 maxPos = this.dateToPos(moment(this.props.startDate).add(range.fullSize, range.fullSizeUnit).format());
      }

      let showExpanded = minPos !== 0 || maxPos !== 1;
      let thumbDates = {minDate: this.posToDate(minPos), maxDate: this.posToDate(maxPos)};
      let width = numericPart(this.props.timelineWidth);
      this.props.setLeftRightFn(minPos, maxPos, showExpanded);
      this.setState({ leftX: minPos*width, rightX: maxPos*width, thumbDates, showExpanded });
   }

   dotInRange(width) {
      let dotX = this.props.dotContext.position * width;
      return this.state.leftX <= dotX && this.state.rightX >= dotX;
   }

   onRangeClick(range) {
      let width = numericPart(this.props.timelineWidth);
      let centerDate = this.dotInRange(width) ? this.props.dotContext.date					// last dot clicked
      : this.posToDate((this.state.leftX+this.state.rightX)/(2*width));	// center of current range

      this.setState({ rangeButton: range });
      this.setRange(range, centerDate);
   }

   onDotClick = (context, date, dotType) => {
      this.setRange(this.state.rangeButton, date);
      this.props.dotClickFn(context, date, dotType);
   }

   renderRangeButtons() {
      let buttons = [];
      let key=0;
      for (let range in this.ranges) {
  buttons.push(<button className={this.state.rangeButton===range ? 'date-range-button-on' : 'date-range-button-off'}
       key={key++} onClick={() => this.onRangeClick(range)}>{this.ranges[range].label}</button>);
      }
      return buttons;
   }

   render() {
//      const rangeMin = formatDisplayDate(this.props.thumbLeft !== 0 ? this.state.thumbDates.minDate : this.props.minDate, true, true);
//      const rangeMax = formatDisplayDate(this.props.thumbRight !== 1 ? this.state.thumbDates.maxDate : this.props.maxDate, true, true);
      const rangeMin = formatDisplayDate(this.props.thumbLeft !== 0 ? this.state.thumbDates.minDate : this.props.startDate, true, true);
      const rangeMax = formatDisplayDate(this.props.thumbRight !== 1 ? this.state.thumbDates.maxDate : this.props.endDate, true, true);
      const rightBound = numericPart(this.props.timelineWidth);
      const rightGradientWidth = numericPart(this.props.timelineWidth) - this.state.rightX;

      return (
 <div className='time-widget'>
    <div className='participant-name'>
       { this.context.resources && formatPatientName(this.context.resources.pathItem('[category=Patient].data.name')) }
    </div>
    <div className='timeline-controls'>
       <div className='timeline-tbd-container'>
  <div className='timeline-selector-gradient-container'>
     { this.state.leftX > 0 && <div className='timeline-selector-gradient-left' style={{width:this.state.leftX+'px'}} /> }
     { rightGradientWidth > 0 && <div className='timeline-selector-gradient-right'
  style={{left:this.state.rightX-this.state.leftX+'px', width:rightGradientWidth+'px'}} /> }
  </div>
  { this.renderFullYears() }
  <SVGContainer className='timeline-svg-container' svgClassName='timeline-svg' svgWidth={this.props.timelineWidth}>
     <DotLine dotPositions={this.props.dotPositionsFn(TimeWidget.myName, 'Full', true)}
      context={ {parent:TimeWidget.myName, rowName:'Full'} }
      dotClickFn={this.props.dotClickFn ? this.onDotClick : null} />
  </SVGContainer>
       </div>
       <div className='timeline-range-controls'>
  <div className={this.state.showExpanded ? 'date-range-data-left-focused' : 'date-range-data-left'}> {rangeMin}</div>
  <div className='timeline-button-container'>
     { this.renderRangeButtons() }
  </div>
  <div className={this.state.showExpanded ? 'date-range-data-right-focused' : 'date-range-data-right'}> {rangeMax}</div>
       </div>
       { this.state.showExpanded &&
 <Draggable axis='x' bounds={{left:(this.state.rightX-this.state.leftX-this.centerThumbWidth)/2,
      right:rightBound-this.centerThumbWidth-(this.state.rightX-this.state.leftX-this.centerThumbWidth)/2}}
    position={{x:(this.state.leftX+this.state.rightX-this.centerThumbWidth)/2, y:0}} onDrag={this.onCenterDrag}>
    <div className='timeline-selector-center' />
 </Draggable> }
       { !this.state.showExpanded &&
 <div className='timeline-help'>
    { this.showHelp() }
 </div> }
       { this.state.showExpanded && this.renderExpandedYears() }
    </div>
 </div>  
      )
   }
}
