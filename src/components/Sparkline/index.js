import React from 'react';
import PropTypes from 'prop-types';
import { XYPlot, LineSeries, MarkSeries } from 'react-vis';
import 'react-vis/dist/style.css';

import './Sparkline.css';
import { log } from '../../utils/logger';

//
// Sparkline using react-vis
//
export default class Sparkline extends React.Component {
  static propTypes = {
    minDate: PropTypes.instanceOf(Date).isRequired,
    maxDate: PropTypes.instanceOf(Date).isRequired,
    dates: PropTypes.arrayOf(PropTypes.instanceOf(Date).isRequired).isRequired,
    clickFn: PropTypes.func,
  }

  handleClick = (_event) => {
    log('Sparkline click');
    // let dotDate = datapoint.x.toISOString();
    // let formattedDotDate = formatDate(dotDate, true, true);
    // this.props.dotClickFn && this.props.dotClickFn(dotDate);
    // // Need to "yield" via setTimeout() for 'elt' to resolve correctly
    // setTimeout(() => {
    //    let elt = document.getElementById(formattedDotDate + '-' + this.props.measure);
    //    if (elt) {
    //       console.log('Found: ' + formattedDotDate);
    //       elt.scrollIntoView({behavior: 'smooth', block: 'center'});
    //    } else {
    //       console.log('Not found: ' + formattedDotDate);
    //    }
    // });
  }

  // TODO: fix so that line color/width come from CSS
  render() {
    const { minDate, maxDate, dates } = this.props;
    if (dates && dates.length > 0) {
      const timeSeriesData = dates.map((d) => ({ x: d, y: 0 }));
      return (
        <XYPlot
          className={this.props.className}
          xType="time"
          width={300}
          height={15}
          xDomain={[minDate, maxDate]}
          onClick={this.handleClick}
        >
          <LineSeries
            className={this.props.clickFn ? 'line' : 'line-noclick'}
            color="black"
            strokeWidth="0.5px"
            data={[{ x: minDate, y: 0 }, { x: maxDate, y: 0 }]}
          />
          <MarkSeries className={this.props.clickFn ? 'mark' : 'mark-noclick'} data={timeSeriesData} size={3.5} />
        </XYPlot>
      );
    }
    return null;
  }
}

//      <XYPlot className={this.props.className} xType='time' width={200} height={20} xDomain={[this.props.minDate, this.props.maxDate]} onClick={this.handleClick} >
//         <LineSeries className='line' data={[{x:this.props.minDate,y:0},{x:this.props.maxDate,y:0}]} onSeriesClick={this.handleSeriesClick} />
//         <LineSeries className='line' data={[{x:this.props.minDate,y:0},{x:this.props.maxDate,y:0}]} strokeWidth={5} opacity={0} onSeriesClick={this.handleSeriesClick} />
//         <MarkSeries className='mark' data={this.props.data} size={3.5} onSeriesClick={this.handleSeriesClick} />
//      </XYPlot>
