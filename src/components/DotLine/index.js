import React from 'react';
import PropTypes from 'prop-types';

import './DotLine.css';
import config from '../../config.js';

import { numericPart, unitPart } from '../../util.js';

//
// Render a row of dots (within an SVGContainer)
//
export default class DotLine extends React.Component {

   static propTypes = {
      width: PropTypes.string,     // Added via React.cloneElement() in <SVGContainer/>
      height: PropTypes.string,     // Added via React.cloneElement() in <SVGContainer/>
      dotPositions: PropTypes.arrayOf(PropTypes.shape({  // Dots to be rendered
         position: PropTypes.number.isRequired,   //   Horizontal position (range: 0.0 - 1.0)
 date: PropTypes.string.isRequired,   //   Associated date
 dotType: PropTypes.string.isRequired   //   active/inactive/active-highlight/inactive-highlight/view-accent/view-last-accent/
 //      view-accent-highlight/active-search/inactive-search/active-highlight-search/
 //      inactive-highlight-search
      })).isRequired,
      context: PropTypes.shape({
 parent: PropTypes.string.isRequired,   // Parent component name
 rowName: PropTypes.string.isRequired   // Specific category/provider name
      }),
      dotClickFn: PropTypes.func    // Callback when a dot is clicked
   }

   //
   // Accumulate array of svg <circle> elements for dots
   //
   renderDot = (result, dot, index) => {
      // TODO: make consistent (need units?)
      const halfHeight = numericPart(this.props.height)/2 + unitPart(this.props.height);
      const dotClickFn = this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, dot.date, dot.dotType) : null;
      const style = this.props.dotClickFn ? {} : {cursor: 'default'};
      const isContent = ['Category', 'Provider'].includes(this.props.context.parent);

      switch (dot.dotType) {
         case 'inactive':
         case 'inactive-highlight':
    result.push(<circle className={isContent ? 'inactive-content-dots' : 'inactive-dots'} key={index}
cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius} />);
    break;

         case 'inactive-search':
    result.push(<circle className='inactive-search-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius} />);
    break;

         case 'active-search':
    result.push(<circle className='active-search-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
style={style} onClick={dotClickFn} />);
    break;

         case 'active-highlight':
    result.push(<circle className='active-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
style={style} onClick={dotClickFn} />);
    break;

         case 'inactive-highlight-search':
    result.push(<circle className='inactive-search-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius} />);
    break;

         case 'active-highlight-search':
    result.push(<circle className='active-search-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
style={style} onClick={dotClickFn} />);
    break;

         case 'view-accent':
    result.push(<circle className='view-accent-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
style={style} onClick={dotClickFn} />);
    break;

         case 'view-last-accent':
    result.push(<circle className='view-last-accent-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
style={style} onClick={dotClickFn} />);
    break;

         case 'view-accent-highlight':
    result.push(<circle className='view-accent-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
style={style} onClick={dotClickFn} />);
    break;

         default: // 'active'
    result.push(<circle className='active-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
style={style} onClick={dotClickFn} />);
    break;
      }

      if (dot.dotType.includes('highlight')) {
 result.push(<circle className='highlight-ring-dots' key={'r'+index} cx={dot.position*100+'%'} cy={halfHeight} r={config.highlightDotRadius}
     style={style} onClick={dotClickFn} />);
      }

      return result;
   }

   render() {
      return this.props.dotPositions.length > 0 ? this.props.dotPositions.reduce(this.renderDot, []) : null;
   }
}
