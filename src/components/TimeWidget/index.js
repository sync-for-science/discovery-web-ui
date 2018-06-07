import React, { Component } from 'react';

import './TimeWidget.css';

//
// Render the time widget of ParticipantDetail page
//
export default class TimeWidget extends Component {

   render() {
      return (
	 <div className='time-widget'>
	    <div className="calendar-daterange-box">
	       <button className="calendar-button-off" />
	       <div className="date-range">
	          00/00/0000 - 00/00/0000
	       </div>
	    </div>
	    <div className="timeline-controls">
	       <div className="timeline-reference-box">
	          <div className="timeline-years">
	             2009
	          </div>
	          <div className="timeline-years">
	             2010
	          </div>
	          <div className="timeline-years">
	             2011
	          </div>
	          <div className="timeline-years">
	             2012
	          </div>
	          <div className="timeline-years">
	             2013
	          </div>
	          <div className="timeline-years">
	             2014
	          </div>
	          <div className="timeline-years">
	             2015
	          </div>
	          <div className="timeline-years">
	             2016
	          </div>
	          <div className="timeline-years">
	             2017
	          </div>
	          <div className="timeline-years">
	             2018
	          </div>
	       </div>
	       <div className="timeline-selection-box">
	          <hr/>
	       </div>
	    </div>
	 </div>  
      )
   }
}
