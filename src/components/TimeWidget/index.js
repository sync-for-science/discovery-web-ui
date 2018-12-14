import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';

import './TimeWidget.css';
import config from '../../config.js';
import { formatDate, numericPart, timelineIncrYears } from '../../util.js';

import SVGContainer from '../SVGContainer';
import DotLine from '../DotLine';

const periodPadding = 5;	// .timeline-expanded-years: padding-left + padding-right

//
// Render the time widget of ParticipantDetail page
//
export default class TimeWidget extends Component {

   static propTypes = {
      startDate: PropTypes.string.isRequired,		// Left-most date of the primary timeline
      endDate: PropTypes.string.isRequired,		// Right-most date of the primary timeline
      thumbLeft: PropTypes.number.isRequired,		// Relative location [0..1] of the left-most thumb
      thumbRight: PropTypes.number.isRequired,		// Relative location [0..1] of the right-most thumb
      timelineWidth: PropTypes.string.isRequired,
      setLeftRightFn: PropTypes.func.isRequired,	// Communicate thumb movement to parent
      dotPositionsFn: PropTypes.func.isRequired,	// Get dot positions from parent
      dotClickFn: PropTypes.func.isRequired,		// Communicate dot click to parent
   }
    
   state = {
      leftX: this.props.thumbLeft * numericPart(this.props.timelineWidth),
      rightX: this.props.thumbRight * numericPart(this.props.timelineWidth),
      thumbDates: {minDate: this.locToDate(this.props.thumbLeft), maxDate: this.locToDate(this.props.thumbRight)},
      showExpanded: false
   }

   componentDidUpdate(prevProps, prevState) {
      if (prevProps.timelineWidth !== this.props.timelineWidth || prevProps.thumbLeft !== this.props.thumbLeft) {
	 this.setState({ leftX: this.props.thumbLeft * numericPart(this.props.timelineWidth),
			 thumbDates: {minDate: this.locToDate(this.props.thumbLeft), maxDate: this.locToDate(this.props.thumbRight)} });
      }
      if (prevProps.timelineWidth !== this.props.timelineWidth || prevProps.thumbRight !== this.props.thumbRight) {
	 this.setState({ rightX: this.props.thumbRight * numericPart(this.props.timelineWidth),
			 thumbDates: {minDate: this.locToDate(this.props.thumbLeft), maxDate: this.locToDate(this.props.thumbRight)} });
      }
   }

   // Reset thumbs
   onDoubleClick() {
      this.props.setLeftRightFn(0.0, 1.0, false);
      this.setState({ leftX: 0.0, rightX: numericPart(this.props.timelineWidth), showExpanded: false,
		      thumbDates: {minDate: this.props.startDate, maxDate: this.props.endDate} });
   }

   locToDate(pos) {
      let min = new Date(this.props.startDate ? this.props.startDate : 0).getTime();
      let max = new Date(this.props.endDate ? this.props.endDate : 0).getTime();
      let target = min + (max - min) * pos;
      return new Date(target).toISOString();
   }

   onLeftDragStop = this.onLeftDragStop.bind(this);
   onLeftDragStop(e, data) {
      const width = numericPart(this.props.timelineWidth);
      const showExpanded = data.x !== 0 || this.state.rightX !== numericPart(this.props.timelineWidth);
//      let dates = this.props.setLeftRightFn(data.x/width, this.state.rightX/width);
      this.props.setLeftRightFn(data.x/width, this.state.rightX/width, showExpanded);
      let dates = {minDate: this.locToDate(data.x/width), maxDate: this.locToDate(this.state.rightX/width)};
       this.setState({ leftX: data.x, thumbDates: dates, showExpanded: showExpanded });
   }

   onRightDragStop = this.onRightDragStop.bind(this);
   onRightDragStop(e, data) {
      const width = numericPart(this.props.timelineWidth);
      const showExpanded = this.state.leftX !== 0 || data.x !== numericPart(this.props.timelineWidth);
//      let dates = this.props.setLeftRightFn(this.state.leftX/width, data.x/width);
      this.props.setLeftRightFn(this.state.leftX/width, data.x/width, showExpanded);
      let dates = {minDate: this.locToDate(this.state.leftX/width), maxDate: this.locToDate(data.x/width)};
      this.setState({ rightX: data.x, thumbDates: dates, showExpanded: showExpanded });
   }

   renderFullYears() {
      const firstYear = new Date(formatDate(this.props.startDate, true, true)).getUTCFullYear();
      const lastYear = new Date(formatDate(this.props.endDate, true, true)).getUTCFullYear();
      const thumbFirstYear = new Date(formatDate(this.state.thumbDates.minDate, true, true)).getUTCFullYear();
      const thumbLastYear = new Date(formatDate(this.state.thumbDates.maxDate, true, true)).getUTCFullYear();
      const incr = timelineIncrYears(this.props.startDate, this.props.endDate, config.maxSinglePeriods);
      let years = [];

      for (let year = firstYear; year <= lastYear; year+=incr) {
	 let className = year < thumbFirstYear || year > thumbLastYear ? 'timeline-full-inactive-years'
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
	 const periodWidth = (fullWidth / expPeriods) - periodPadding;

	 const firstPeriodFrac = Math.min(1.0,(new Date((expFirstYear+periodIncr)+'-01-01') - expMinDate)/(yearMillis*periodIncr));
	 const firstPeriodWidth = Math.round(firstPeriodFrac * periodWidth);

	 for (let year = expFirstYear; year <= expLastYear; year+=periodIncr) {

	    let thisWidth = 0;
	    if (year === expFirstYear) {
	       thisWidth = firstPeriodWidth;
	    } else if ((periodIncr === 1 && year === expLastYear) ||
		       (periodIncr > 1 && year+periodIncr >= expLastYear)) {
	       thisWidth = fullWidth - cumWidth - periodPadding;	// Last period width
	    } else {
	       thisWidth = periodWidth
	    }

	    cumWidth += thisWidth + periodPadding;

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

	 const avgMonthWidth = (fullWidth / monthsInRange) - periodPadding;
	 const firstMonthWidth = Math.max(0, avgMonthWidth * (avgMonthDays - expMinDate.getDate()) / avgMonthDays);

	 const monthDate = expMinDate;
	 monthDate.setDate(1);

	 for (let monthNum = 0; monthNum < expMonths; monthNum++) {

	    let thisWidth = 0;
 	    if (monthNum === 0) {
 	       thisWidth = firstMonthWidth;
 	    } else if (monthNum === expMonths-1) {
 	       thisWidth = fullWidth - cumWidth - periodPadding;	// Last month width
 	    } else {
 	       thisWidth = avgMonthWidth;
 	    }
	     
	    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	    const monthLabel = monthNames[monthDate.getMonth()] + '-' + monthDate.getFullYear();
	    const narrowMonthLabel = (monthDate.getMonth()+1) + '/' + monthDate.getFullYear();

	    cumWidth += thisWidth + periodPadding;

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
	    <div className='timeline-shim-left' key='shim-1'/>
	    {periods}
	    <div className='timeline-shim-right' key='shim-2'/>
	 </div>
      );
   }

   render() {
      const rangeMin = formatDate(this.state.thumbDates ? this.state.thumbDates.minDate : this.props.startDate, true, true);
      const rangeMax = formatDate(this.state.thumbDates ? this.state.thumbDates.maxDate : this.props.endDate, true, true);
      const rightBound = numericPart(this.props.timelineWidth);

      return (
	 <div className='time-widget'>
	    <div className='calendar-daterange-box'>
	       <button className='calendar-button-off' />
	       <div className='date-range'>
		  {rangeMin}<br/>to<br/>{rangeMax}
	       </div>
	    </div>
	    <div className='timeline-controls' onDoubleClick={this.onDoubleClick.bind(this)}>
	       { this.renderFullYears() }
	       <div className='timeline-selection-box'> 
	          <SVGContainer className='timeline-svg-container' svgClassName='timeline-svg' svgWidth={this.props.timelineWidth}>
		     <DotLine dotPositions={this.props.dotPositionsFn('TimeWidget', 'Full', true)}
			      context={ {parent:this.constructor.name, rowName:'Full'} }
			      dotClickFn={this.props.dotClickFn} />
	          </SVGContainer>
		  <Draggable axis='x' bounds={{left:0, right:this.state.rightX}} position={{x:this.state.leftX, y:0}} onStop={this.onLeftDragStop}>	       
		     <div className={this.state.showExpanded ? 'timeline-selector-left-alt' : 'timeline-selector-left'}></div>
		  </Draggable>
		  <Draggable axis='x' bounds={{left:this.state.leftX, right:rightBound}} position={{x:this.state.rightX, y:0}} onStop={this.onRightDragStop}>
		     <div className={this.state.showExpanded ? 'timeline-selector-right-alt' : 'timeline-selector-right'}></div>
		  </Draggable>
	       </div>
	       { this.state.showExpanded && this.renderExpandedYears() }
	    </div>
	 </div>  
      )
   }
}
