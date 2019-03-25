import React from 'react';
import PropTypes from 'prop-types';
import { formatDate } from '../../util.js';
import {XYPlot, XAxis, YAxis, VerticalGridLines, HorizontalGridLines, LineMarkSeries, LineSeries, WhiskerSeries} from 'react-vis';
import 'react-vis/dist/style.css';

import './TimeSeries.css';

//
// Time series using react-vis
//
export default class TimeSeries extends React.Component {

   static propTypes = {
      measure: PropTypes.string.isRequired,
      data: PropTypes.array.isRequired,
      highlights: PropTypes.array
   }

   handleDotClick = this.handleDotClick.bind(this);
   handleDotClick(datapoint, event) {
      let dotDate = datapoint.x.toISOString();
      let formattedDotDate = formatDate(dotDate, true, true);
      console.log(dotDate);
      let elt = document.getElementById(formattedDotDate + '-' + this.props.measure);
      if (elt) {
	 console.log('Found: ' + formattedDotDate);
	 elt.scrollIntoView({behavior: 'smooth', block: 'center'});
      } else {
	 console.log('Not found: ' + formattedDotDate);
      }
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

//	 <XYPlot className={this.props.className+'-time-series'} xType='time' width={400} height={120} yDomain={[minY-maxVar/1.9,maxY+maxVar/1.9]}>

      return (
	 // Make yDomain ~5% larger than whiskers
	 <XYPlot xType='time' width={400} height={120} yDomain={[minY-maxVar/1.9, maxY+maxVar/1.9]}>
	    <VerticalGridLines />
	    <HorizontalGridLines />
	    <XAxis tickFormat={d => d.getFullYear()} tickTotal={years} />
	    <YAxis />
	    <WhiskerSeries data={this.props.data} strokeWidth={2} />
	      <LineSeries data={this.props.data} />
	  {/* <LineMarkSeries data={this.props.data} size={4.5} color='#01a6aa' onValueClick={this.handleDotClick} /> */}
	    { this.props.highlights && <WhiskerSeries  data={this.props.data.filter(elt=>elt.x===this.props.highlights[0].x)} strokeWidth={2} color='#8d3031' /> }
	    {/* this.props.highlights && <LineMarkSeries data={this.props.highlights} xDomain={[minX,maxX]} size={8}   color='#8d3031' onValueClick={this.handleDotClick} /> */}
	    {/* this.props.highlights && <LineMarkSeries data={this.props.highlights} xDomain={[minX,maxX]} size={5}   color='white'   onValueClick={this.handleDotClick} /> */}
	    {/* this.props.highlights && <LineMarkSeries data={this.props.highlights} xDomain={[minX,maxX]} size={3.7} color='#01a6aa' onValueClick={this.handleDotClick} /> */}
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

//	  <XYPlot className={this.props.className+'-time-series'} xType='time' width={400} height={120} yDomain={[minY,maxY]}>
//	      <LineMarkSeries data={this.props.data} size={8} opacity='0' onValueClick={(datapoint, event)=>{
//		  console.log(datapoint.x);
//	      }} />

      return (
	 <XYPlot xType='time' width={400} height={120} yDomain={[minY,maxY]}>
	    <VerticalGridLines />
	    <HorizontalGridLines />
	    <XAxis tickFormat={d => d.getFullYear()} tickTotal={years} />
	    <YAxis />
	    <LineMarkSeries data={this.props.data} size={4.5} onValueClick={this.handleDotClick} />
	    { this.props.highlights && <LineMarkSeries data={this.props.highlights} size={8}   color='#8d3031' onValueClick={this.handleDotClick} /> }
	    { this.props.highlights && <LineMarkSeries data={this.props.highlights} size={5}   color='white'   onValueClick={this.handleDotClick} /> }	       
	    { this.props.highlights && <LineMarkSeries data={this.props.highlights} size={3.7} color='#01a6aa' onValueClick={this.handleDotClick} /> }
	 </XYPlot>
      );
   }

//	    { this.props.highlights && <LineMarkSeries data={this.props.highlights} xDomain={[minX,maxX]} size={8} color='#8d3031' /> }
//	    { this.props.highlights && <LineMarkSeries data={this.props.highlights} xDomain={[minX,maxX]} size={5} color='white' /> }
//	    { this.props.highlights && <LineMarkSeries data={this.props.highlights} xDomain={[minX,maxX]} size={3.7} color='#01a6aa' /> }


   render() {
      if (this.props.data && this.props.data.length > 1) {
	  if (this.props.data[0].yVariance) {
	      return this.renderLineWhisker();
	  } else {
	      return this.renderLineMark();
	  }
      } else {
	  return null;
      }
   }
}
