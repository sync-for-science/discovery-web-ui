import React from 'react';
import PropTypes from 'prop-types';
import { formatDate } from '../../util.js';
import {XYPlot, XAxis, YAxis, VerticalGridLines, HorizontalGridLines, LineSeries, MarkSeries, WhiskerSeries} from 'react-vis';
import 'react-vis/dist/style.css';

import './TimeSeries.css';

//
// Time series using react-vis
//
export default class TimeSeries extends React.Component {

   static propTypes = {
      measure: PropTypes.string.isRequired,
      data: PropTypes.array.isRequired,
      highlights: PropTypes.array,
      dotClickFn: PropTypes.func
   }

   handleDotClick = this.handleDotClick.bind(this);
   handleDotClick(datapoint, event) {
      let dotDate = datapoint.x.toISOString();
      let formattedDotDate = formatDate(dotDate, true, true);
      this.props.dotClickFn && this.props.dotClickFn(dotDate);
      // Need to "yield" via setTimeout() for 'elt' to resolve correctly
      setTimeout(() => {
	 let elt = document.getElementById(formattedDotDate + '-' + this.props.measure);
	 if (elt) {
	    console.log('Found: ' + formattedDotDate);
	    elt.scrollIntoView({behavior: 'smooth', block: 'center'});
	 } else {
	    console.log('Not found: ' + formattedDotDate);
	 }
      });
   }

   renderLineWhisker() {
      let minX = this.props.data.reduce((res, elt) => elt.x < res ? elt.x : res, this.props.data[0].x);
      let maxX = this.props.data.reduce((res, elt) => elt.x > res ? elt.x : res, this.props.data[0].x);
      let minY = this.props.data.reduce((res, elt) => elt.y < res ? elt.y : res, this.props.data[0].y);
      let maxY = this.props.data.reduce((res, elt) => elt.y > res ? elt.y : res, this.props.data[0].y);
      let maxVar = this.props.data.reduce((res, elt) => elt.yVariance > res ? elt.yVariance : res, this.props.data[0].yVariance);
      let years = maxX.getFullYear() - minX.getFullYear() + 1;

      // TODO: some visualization when all data is the same date?
//      if (minX === maxX) {
//	 // something else
//      }

      // TODO: fix kluge
      if (minY === maxY) {
	 minY = maxY/1.5;
      }

      let currentPoint = this.props.data.find(elt => elt.x.getTime() === this.props.highlights[0].x.getTime());
      let highlights = currentPoint && [{x:currentPoint.x, y:currentPoint.y1}, {x:currentPoint.x, y:currentPoint.y2}];
      let systolicSeries = this.props.data.map(elt => ({x: elt.x, y: elt.y1}));
      let diastolicSeries = this.props.data.map(elt => ({x: elt.x, y: elt.y2}));

      return (
	 // Make yDomain ~5% larger than whiskers
	 <XYPlot xType='time' width={400} height={120} yDomain={[minY-maxVar/1.9, maxY+maxVar/1.9]}>
	    <VerticalGridLines />
	    <HorizontalGridLines />
	    <XAxis tickFormat={d => d.getFullYear()} tickTotal={years} />
	    <YAxis />

	    <WhiskerSeries data={this.props.data} strokeWidth={2} />
	    <MarkSeries className='mark' data={systolicSeries} size={4.5} color='#01a6aa' onValueClick={this.handleDotClick} />
	    <MarkSeries className='mark' data={diastolicSeries} size={4.5} color='#01a6aa' onValueClick={this.handleDotClick} />

	    { this.props.highlights && <MarkSeries className='mark' data={highlights} xDomain={[minX,maxX]} size={8} color='#8d3031' onValueClick={this.handleDotClick} /> }
	    { this.props.highlights && <MarkSeries className='mark' data={highlights} xDomain={[minX,maxX]} size={5} color='white' onValueClick={this.handleDotClick} /> }
	    { this.props.highlights && <MarkSeries className='mark' data={highlights} xDomain={[minX,maxX]} size={3.7} color='#01a6aa' onValueClick={this.handleDotClick} /> }
	 </XYPlot>
      );
   }

   renderLineMark() {
      let minX = this.props.data.reduce((res, elt) => elt.x < res ? elt.x : res, this.props.data[0].x);
      let maxX = this.props.data.reduce((res, elt) => elt.x > res ? elt.x : res, this.props.data[0].x);
      let minY = this.props.data.reduce((res, elt) => elt.y < res ? elt.y : res, this.props.data[0].y);
      let maxY = this.props.data.reduce((res, elt) => elt.y > res ? elt.y : res, this.props.data[0].y);
      let years = maxX.getFullYear() - minX.getFullYear() + 1;

      // TODO: some visualization when all data is the same date?
//      if (minX === maxX) {
//	 // something else
//      }

      // TODO: better technique to set Y scale for this case?
      if (minY === maxY) {
	 minY = maxY/1.5;
      }

      return (
	 <XYPlot xType='time' width={400} height={120} yDomain={[minY,maxY]}>
	    <VerticalGridLines />
	    <HorizontalGridLines />
	    <XAxis tickFormat={d => d.getFullYear()} tickTotal={years} />
	    <YAxis />

	    <LineSeries className='line' data={this.props.data} />
	    <MarkSeries className='mark' data={this.props.data} size={4.5} onValueClick={this.handleDotClick} />

	    { this.props.highlights && <MarkSeries className='mark' data={this.props.highlights} size={8}   color='#8d3031' onValueClick={this.handleDotClick} /> }
	    { this.props.highlights && <MarkSeries className='mark' data={this.props.highlights} size={5}   color='white'   onValueClick={this.handleDotClick} /> }	       
	    { this.props.highlights && <MarkSeries className='mark' data={this.props.highlights} size={3.7} color='#01a6aa' onValueClick={this.handleDotClick} /> }
	 </XYPlot>
      );
   }

   render() {
      if (this.props.data && this.props.data.length > 1) {
	 if (this.props.data[0].hasOwnProperty('yVariance')) {
	    return this.renderLineWhisker();
	 } else {
	    return this.renderLineMark();
	 }
      } else {
	 return null;
      }
   }
}
