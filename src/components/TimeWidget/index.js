import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';

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
      dotClickFn: PropTypes.func.isRequired,		// Communicate dot click to parent
   }
    
   state = {
      leftX: this.props.thumbLeft * numericPart(this.props.timelineWidth),
      rightX: this.props.thumbRight * numericPart(this.props.timelineWidth),
      thumbDates: {minDate: this.locToDate(this.props.thumbLeft), maxDate: this.locToDate(this.props.thumbRight)},
      showExpanded: false
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
			 thumbDates: {minDate: this.locToDate(this.props.thumbLeft), maxDate: this.locToDate(this.props.thumbRight)} });
	 this.cacheSizes();
      }
      if (prevProps.timelineWidth !== this.props.timelineWidth || prevProps.thumbRight !== this.props.thumbRight) {
	 this.setState({ rightX: this.props.thumbRight * numericPart(this.props.timelineWidth),
			 thumbDates: {minDate: this.locToDate(this.props.thumbLeft), maxDate: this.locToDate(this.props.thumbRight)} });
	 this.cacheSizes();
      }
   }

   // Reset thumbs
   onDoubleClick = () => {
      this.props.setLeftRightFn(0.0, 1.0, false);
      this.setState({ leftX: 0.0, rightX: numericPart(this.props.timelineWidth), showExpanded: false,
		      thumbDates: {minDate: this.props.startDate, maxDate: this.props.endDate} });
   }

   // TODO: Move to util.js?
   locToDate(pos) {
      let min = new Date(this.props.startDate ? this.props.startDate : 0).getTime();
      let max = new Date(this.props.endDate ? this.props.endDate : 0).getTime();
      let target = min + (max - min) * pos;
      return new Date(target).toISOString();
   }

   onLeftDrag = (e, data) => {
      console.log('onLeftDrag: ' + data.x);
      const width = numericPart(this.props.timelineWidth);
      const leftTarget = (data.x/width < config.timeWidgetThumbResetZone) ? 0 : data.x/width;
      const showExpanded = leftTarget !== 0 || this.state.rightX !== numericPart(this.props.timelineWidth);

      this.props.setLeftRightFn(leftTarget, this.state.rightX/width, showExpanded);
      let dates = {minDate: this.locToDate(leftTarget), maxDate: this.locToDate(this.state.rightX/width)};
      this.setState({ leftX: leftTarget*width, thumbDates: dates, showExpanded: showExpanded });
   }

   onRightDrag = (e, data) => {
      const width = numericPart(this.props.timelineWidth);
      const rightTarget = (data.x/width > 1.0 - config.timeWidgetThumbResetZone) ? 1.0 : data.x/width;
      const showExpanded = this.state.leftX !== 0 || rightTarget*width !== numericPart(this.props.timelineWidth);

      this.props.setLeftRightFn(this.state.leftX/width, rightTarget, showExpanded);
      let dates = {minDate: this.locToDate(this.state.leftX/width), maxDate: this.locToDate(rightTarget)};
      this.setState({ rightX: rightTarget*width, thumbDates: dates, showExpanded: showExpanded });
   }

   onCenterDrag = (e, data) => {
      let oldCenterX = (this.state.leftX + this.state.rightX - this.centerThumbWidth)/2;
      let delta = data.x - oldCenterX;
      let newLeftX = this.state.leftX + delta;
      let newRightX = this.state.rightX + delta;
      let width = numericPart(this.props.timelineWidth);

      this.props.setLeftRightFn(newLeftX/width, newRightX/width, true);
      let dates = {minDate: this.locToDate(newLeftX/width), maxDate: this.locToDate(newRightX/width)};
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

   // // Assumes 'date' object or ISO format string
   // formatLocalDate(date) {
   //    // Add month & day if missing
   //    let strDate = date+'';
   //    strDate = strDate.length === 4 ? strDate += '-01' : strDate;
   //    strDate = strDate.length === 7 ? strDate += '-01' : strDate;

   //    // Strip time, if present
   //    const tLoc = strDate.indexOf('T');
   //    if (tLoc !== -1) {
   // 	 strDate = strDate.substring(0, tLoc);
   //    }

   //    return new Date(strDate.replace(/-/g, '/')).toLocaleDateString();		// Force local "input" date
   // }

   // TODO: collect following from individual view components?
   showHelp() {
      switch (this.context.currentView) {
	 case 'reportView':
	    return [
	       <div className='timeline-help-col-1' key='1'>
		  <b>Timeline</b> shows your detailed clinical and payer data over time. “What data is there about me?”
	       </div>,
	       <div className='timeline-help-col-2' key='2'><b>Select</b> a dot on the Time Bar (above) to scroll to details for that day.  </div>,
	       <div className='timeline-help-col-3' key='3'>
		  <b>Adjust</b> Records or Providers (left), and Time Bar controls (above) to narrow or widen data shown.
	       </div>
	    ];

	 case 'compareView':
	    return [
	       <div className='timeline-help-col-1' key='1'>
		  <b>Compare</b> shows which providers have records of your unique clinical data. “Which provider knows this about me?”
	       </div>,
	       <div className='timeline-help-col-2' key='2'><b>See/hide</b> details by selecting or deselecting Cards. </div>,
	       <div className='timeline-help-col-3' key='3'>
		  <b>Adjust</b> Records or Providers (left), and Time Bar controls (above) to narrow or widen data shown.
	       </div>
	    ];

	 case 'financialView':
	    return [
	       <div className='timeline-help-col-1' key='1'>
		  <b>Payer</b> presents your claims and benefits data. “What health care service data is there about me?”
	       </div>,
	       <div className='timeline-help-col-2' key='2'><b>Select</b> a dot on the Time Bar (above) to scroll to details for that day.  </div>,
	       <div className='timeline-help-col-3' key='3'>
		  <b>Adjust</b> Records or Providers (left), and Time Bar controls (above) to narrow or widen data shown.
	       </div>
	    ];

	 case 'tilesView':
	    return [
	       <div className='timeline-help-col-1' key='1'><b>Catalog</b> lists your unique clinical data by type. “What is known about me?”</div>,
	       <div className='timeline-help-col-2' key='2'><b>See/hide</b> details by selecting or deselecting Cards.  </div>,
	       <div className='timeline-help-col-3' key='3'>
		  <b>Adjust</b> Records or Providers (left), and Time Bar controls (above) to narrow or widen data shown.
	       </div>
	    ];

	 default:
	    return '';
      }	   
   }

   render() {
//      const rangeMin = this.formatLocalDate(this.state.thumbDates ? this.state.thumbDates.minDate : this.props.startDate);
//      const rangeMax = this.formatLocalDate(this.state.thumbDates ? this.state.thumbDates.maxDate : this.props.endDate);
//      const rangeMin = formatDisplayDate(this.state.showExpanded ? this.state.thumbDates.minDate : this.props.minDate, true, true);
//      const rangeMax = formatDisplayDate(this.state.showExpanded ? this.state.thumbDates.maxDate : this.props.maxDate, true, true);
      const rangeMin = formatDisplayDate(this.props.thumbLeft !== 0 ? this.state.thumbDates.minDate : this.props.minDate, true, true);
      const rangeMax = formatDisplayDate(this.props.thumbRight !== 1 ? this.state.thumbDates.maxDate : this.props.maxDate, true, true);
      const rightBound = numericPart(this.props.timelineWidth);

      return (
	 <div className='time-widget'>
	    <div className='calendar-daterange-box'>
              {/*<button className='calendar-button-off' /> */}
	       <div className='date-range'>
		  <div className='date-range-row'>FROM 
		     <div className='date-range-data'>{rangeMin}</div>
		  </div>
		  <div className='date-range-row'>TO 
		     <div className='date-range-data'>{rangeMax}</div>
		  </div>
		  <div className='participant-name'>
		     { this.context.resources && formatPatientName(this.context.resources.pathItem('[category=Patient].data.name')) }
		  </div>
	       </div>
	    </div>
	    <div className='timeline-controls' onDoubleClick={this.onDoubleClick}>
	       <div className='timeline-selection-box'> 
		  <div className='timeline-selector-gradient-container'>
		     <div className='timeline-selector-gradient-left' style={{width:this.state.leftX+'px'}} />
		     <div className='timeline-selector-gradient-right'
 			  style={{left:this.state.rightX-this.state.leftX+'px', width:(numericPart(this.props.timelineWidth)-this.state.rightX)+'px'}} />
		  </div>
		  { this.renderFullYears() }
	          <div className='timeline-selector-container'>
		     <Draggable axis='x' bounds={{left:0, right:this.state.rightX-40}} position={{x:this.state.leftX, y:0}} onDrag={this.onLeftDrag}>
		        <div className={this.state.leftX > 0 ? 'timeline-selector-left-alt' : 'timeline-selector-left'}></div>
		     </Draggable>
		     <Draggable axis='x' bounds={{left:this.state.leftX+40, right:rightBound}} position={{x:this.state.rightX, y:0}} onDrag={this.onRightDrag}>
		        <div className={this.state.rightX < rightBound ? 'timeline-selector-right-alt' : 'timeline-selector-right'}></div>
		     </Draggable>
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
		  </div>
	          <SVGContainer className='timeline-svg-container' svgClassName='timeline-svg' svgWidth={this.props.timelineWidth}>
		     <DotLine dotPositions={this.props.dotPositionsFn(TimeWidget.myName, 'Full', true)}
			      context={ {parent:TimeWidget.myName, rowName:'Full'} }
			      dotClickFn={this.props.dotClickFn} />
	          </SVGContainer>
	       </div>
	       { this.state.showExpanded && this.renderExpandedYears() }
	    </div>
	 </div>  
      )
   }
}
