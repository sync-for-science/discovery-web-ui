import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './TimeWidget.css';

//
// Render the time widget of ParticipantDetail page
//
export default class TimeWidget extends Component {

   static propTypes = {
      minDate: PropTypes.oneOfType([
	 PropTypes.string,
	 PropTypes.number
      ]),
      maxDate: PropTypes.oneOfType([
	 PropTypes.string,
	 PropTypes.number
      ])
   }
    
   formatDate(date) {
      // Kluge -- "fill out" short form dates
      date = date.length === 4 ? date += '-01' : date;
      date = date.length === 7 ? date += '-01' : date;

      // return only YYYY-MM-DD
       return (date+'').substring(0,10);
   }

   render() {
      let fmtMinDate = this.formatDate(this.props.minDate);
      let fmtMaxDate = this.formatDate(this.props.maxDate);
      let firstYear = new Date(fmtMinDate).getUTCFullYear();
      let lastYear = new Date(fmtMaxDate).getUTCFullYear();
      let incr = Math.max(1, Math.ceil((lastYear-firstYear)/15));
//      if (incr == 0) { incr = 1 };
      let years = [];

      for (var year = firstYear; year <= lastYear; year+=incr) {
	 years.push(
	    <div className='timeline-years' key={year}>
	       {year}
	    </div>
	 );
      }

      return (
	 <div className='time-widget'>
	    <div className="calendar-daterange-box">
	       <button className="calendar-button-off" />
	       <div className="date-range">
		  {fmtMinDate}<br/>to<br/>{fmtMaxDate}
	       </div>
	    </div>
	    <div className="timeline-controls">
	       <div className="timeline-reference-box">
		  {years}
	       </div>
	       <div className="timeline-selection-box">
		  <div className='timeline-selection-row-left'>
		     <div className='timeline-selector-left'></div>
		  </div>
		  <div className='timeline-selection-row-right'>
		     <div className='timeline-selector-right'></div>
		  </div>
	       </div>
	    </div>
	 </div>  
      )
   }
}
