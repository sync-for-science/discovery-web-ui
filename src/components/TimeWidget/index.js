import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';

import './TimeWidget.css';
import config from '../../config.js';

import SVGContainer from '../SVGContainer';
import DotLine from '../DotLine';

//
// Render the time widget of ParticipantDetail page
//
export default class TimeWidget extends Component {

   static propTypes = {
      minDate: PropTypes.oneOfType([
	 PropTypes.string,
	 PropTypes.number
      ]).isRequired,
      maxDate: PropTypes.oneOfType([
	 PropTypes.string,
	 PropTypes.number
      ]).isRequired,
      timelineWidth: PropTypes.oneOfType([
	 PropTypes.string,
	 PropTypes.number
      ]).isRequired,
      setLeftRightFn: PropTypes.func.isRequired,
      callbackFn: PropTypes.func.isRequired
   }
    
   state = {
      leftX: 0,
      rightX: this.numericPart(this.props.timelineWidth),
      thumbDates: null
   }

   onLeftDragStop = this.onLeftDragStop.bind(this);
   onLeftDragStop(e, data) {
      let width = this.numericPart(this.props.timelineWidth);
      let dates = this.props.setLeftRightFn(data.x/width, this.state.rightX/width);
      this.setState({ leftX: data.x, thumbDates: dates });
   }

   onRightDragStop = this.onRightDragStop.bind(this);
   onRightDragStop(e, data) {
      let width = this.numericPart(this.props.timelineWidth);
      let dates = this.props.setLeftRightFn(this.state.leftX/width, data.x/width);
      console.log(JSON.stringify(dates,null,3));
      this.setState({ rightX: data.x, thumbDates: dates });
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
      let years = [];

      for (var year = firstYear; year <= lastYear; year+=incr) {
	 years.push(
	    <div className='timeline-years' key={year}>
	       {year}
	    </div>
	 );
      }

      const rangeMin = this.formatDate(this.state.thumbDates? this.state.thumbDates.minDate : this.props.minDate);
      const rangeMax = this.formatDate(this.state.thumbDates? this.state.thumbDates.maxDate : this.props.maxDate);
      const rightBound = this.numericPart(this.props.timelineWidth);

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
	          <Draggable axis='x' bounds={{left:0, right:this.state.rightX}} defaultPosition={{x:0, y:0}} onStop={this.onLeftDragStop}> 
		     <div className='timeline-selector-left'></div>
		  </Draggable>
	          <SVGContainer className='timeline-svg-container' svgClassName='timeline-svg' svgWidth={this.props.timelineWidth}>
		     <DotLine className='inactive-dots' key='inactive' dotRadius={config.normalDotRadius}
			      dotPositions={this.props.callbackFn('TimeWidget', 'TimeWidget', true, 'inactive')} />
		     <DotLine className='active-dots' key='active' dotRadius={config.normalDotRadius}
			      dotPositions={this.props.callbackFn('TimeWidget', 'TimeWidget', true, 'active')} />
	          </SVGContainer>
	          <Draggable axis='x' bounds={{left:this.state.leftX, right:rightBound}} defaultPosition={{x:rightBound, y:0}} onStop={this.onRightDragStop}>
		     <div className='timeline-selector-right'></div>
	          </Draggable>
	       </div>
	    </div>
	 </div>  
      )
   }

   numericPart(val) {
      const index = val.toString().search(/[A-Za-z%]/);
      return parseFloat(val.toString().substring(0,index));
   }
}
