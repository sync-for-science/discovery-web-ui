import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';

import './TimeWidget.css';
import { formatDate, numericPart } from '../../util.js';

import SVGContainer from '../SVGContainer';
import DotLine from '../DotLine';

//
// Render the time widget of ParticipantDetail page
//
export default class TimeWidget extends Component {

   static propTypes = {
      minDate: PropTypes.string.isRequired,
      maxDate: PropTypes.string.isRequired,
      timelineWidth: PropTypes.string.isRequired,
      setLeftRightFn: PropTypes.func.isRequired,
      dotPositionsFn: PropTypes.func.isRequired
   }
    
   state = {
      leftX: 0,
      rightX: numericPart(this.props.timelineWidth),
      thumbDates: null
   }

   locToDate(pos) {
      let min = new Date(this.props.minDate).getTime();
      let max = new Date(this.props.maxDate).getTime();
      let target = min + (max - min) * pos;
      return new Date(target).toISOString();
   }

   onLeftDragStop = this.onLeftDragStop.bind(this);
   onLeftDragStop(e, data) {
      const width = numericPart(this.props.timelineWidth);
//      let dates = this.props.setLeftRightFn(data.x/width, this.state.rightX/width);
      this.props.setLeftRightFn(data.x/width, this.state.rightX/width);
      let dates = {minDate: this.locToDate(data.x/width), maxDate: this.locToDate(this.state.rightX/width)};
      this.setState({ leftX: data.x, thumbDates: dates });
   }

   onRightDragStop = this.onRightDragStop.bind(this);
   onRightDragStop(e, data) {
      const width = numericPart(this.props.timelineWidth);
//      let dates = this.props.setLeftRightFn(this.state.leftX/width, data.x/width);
      this.props.setLeftRightFn(this.state.leftX/width, data.x/width);
      let dates = {minDate: this.locToDate(this.state.leftX/width), maxDate: this.locToDate(data.x/width)};
      this.setState({ rightX: data.x, thumbDates: dates });
   }

   render() {
      const fmtMinDate = formatDate(this.props.minDate, true, true);
      const fmtMaxDate = formatDate(this.props.maxDate, true, true);
      const firstYear = new Date(fmtMinDate).getUTCFullYear();
      const lastYear = new Date(fmtMaxDate).getUTCFullYear();
      const maxSingleYears = 15;
      const incr = Math.max(1, Math.ceil((lastYear-firstYear)/maxSingleYears));
      let years = [];

      for (let year = firstYear; year <= lastYear; year+=incr) {
	 years.push(
	    <div className='timeline-years' key={year}>
	       {year}
	    </div>
	 );
      }

      const rangeMin = formatDate(this.state.thumbDates? this.state.thumbDates.minDate : this.props.minDate, true, true);
      const rangeMax = formatDate(this.state.thumbDates? this.state.thumbDates.maxDate : this.props.maxDate, true, true);
      const rightBound = numericPart(this.props.timelineWidth);

      return (
	 <div className='time-widget'>
	    <div className="calendar-daterange-box">
	       <button className="calendar-button-off" />
	       <div className="date-range">
		  {rangeMin}<br/>to<br/>{rangeMax}
	       </div>
	    </div>
	    <div className="timeline-controls">
	       <div className="timeline-reference-box">
		  {years}
	       </div>
	       <div className="timeline-selection-box">
	          <SVGContainer className='timeline-svg-container' svgClassName='timeline-svg' svgWidth={this.props.timelineWidth}>
		     <DotLine dotPositions={this.props.dotPositionsFn('TimeWidget', 'TimeWidget', true)}
			      context={ {parent:this.constructor.name, rowName:'timeWidget'} } />
	          </SVGContainer>
		  <Draggable axis='x' bounds={{left:0, right:this.state.rightX}} defaultPosition={{x:0, y:0}} onStop={this.onLeftDragStop}>	       
		     <div className='timeline-selector-left'></div>
		  </Draggable>
		  <Draggable axis='x' bounds={{left:this.state.leftX, right:rightBound}} defaultPosition={{x:rightBound, y:0}} onStop={this.onRightDragStop}>
		     <div className='timeline-selector-right'></div>
		  </Draggable> 
	       </div>
	    </div>
	 </div>  
      )
   }
}
