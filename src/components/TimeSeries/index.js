import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {XYPlot, XAxis, YAxis, VerticalGridLines, HorizontalGridLines, LineMarkSeries, LineSeries, WhiskerSeries} from 'react-vis';
import 'react-vis/dist/style.css';

import './TimeSeries.css';

//
// Time series using react-vis
//
export default class TimeSeries extends Component {

   static propTypes = {
      data: PropTypes.array.isRequired,
      highlights: PropTypes.array
   }

   renderLineWhisker() {
      let minX = this.props.data.reduce((res, elt) => elt.x < res ? elt.x : res, this.props.data[0].x);
      let maxX = this.props.data.reduce((res, elt) => elt.x > res ? elt.x : res, this.props.data[0].x);
      let minY = this.props.data.reduce((res, elt) => elt.y < res ? elt.y : res, this.props.data[0].y);
      let maxY = this.props.data.reduce((res, elt) => elt.y > res ? elt.y : res, this.props.data[0].y);
      let maxVar = this.props.data.reduce((res, elt) => elt.yVariance > res ? elt.yVariance : res, this.props.data[0].yVariance);
      let years = maxX.getFullYear() - minX.getFullYear() + 1;

      // TODO: some visualization when all data is the same date?
      if (minX === maxX) {
	 return null;
      }

      // TODO: fix kluge
      if (minY === maxY) {
	 minY = maxY/1.5;
      }

      return (
	 // Make yDomain ~5% larger than whiskers
	 <XYPlot className={this.props.className+'-time-series'} xType='time' width={400} height={120} yDomain={[minY-maxVar/1.9,maxY+maxVar/1.9]}>
	    <VerticalGridLines />
	    <HorizontalGridLines />
	    <XAxis tickFormat={d => d.getFullYear()} tickTotal={years} />
	    <YAxis />
	    <LineSeries data={this.props.data} />
	    <WhiskerSeries data={this.props.data} strokeWidth={2} />
	    { this.props.highlights && <LineMarkSeries data={this.props.highlights} xDomain={[minX,maxX]} size={8} color='#8d3031' /> }
	    { this.props.highlights && <LineMarkSeries data={this.props.highlights} xDomain={[minX,maxX]} size={5} color='white' /> }
	    { this.props.highlights && <LineMarkSeries data={this.props.highlights} xDomain={[minX,maxX]} size={3.7} color='#01a6aa' /> }
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
      if (minX === maxX) {
	 return null;
      }

      // TODO: better technique to set Y scale for this case?
      if (minY === maxY) {
	 minY = maxY/1.5;
      }

      return (
	 <XYPlot className={this.props.className+'-time-series'} xType='time' width={400} height={120} yDomain={[minY,maxY]}>
	    <VerticalGridLines />
	    <HorizontalGridLines />
	    <XAxis tickFormat={d => d.getFullYear()} tickTotal={years} />
	    <YAxis />
	    <LineMarkSeries data={this.props.data} size={3} />
	    { this.props.highlights && <LineMarkSeries data={this.props.highlights} xDomain={[minX,maxX]} size={8} color='#8d3031' /> }
	    { this.props.highlights && <LineMarkSeries data={this.props.highlights} xDomain={[minX,maxX]} size={5} color='white' /> }
	    { this.props.highlights && <LineMarkSeries data={this.props.highlights} xDomain={[minX,maxX]} size={3.7} color='#01a6aa' /> }
	 </XYPlot>
      );
   }

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
