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
      width: PropTypes.string,				 // Added via React.cloneElement() in <SVGContainer/>
      height: PropTypes.string,				 // Added via React.cloneElement() in <SVGContainer/>
      dotPositions: PropTypes.arrayOf(PropTypes.shape({	 // Dots to be rendered
         position: PropTypes.number.isRequired,		 //   Horizontal position (range: 0.0 - 1.0)
	 date: PropTypes.string.isRequired,		 //   Associated date
	 dotType: PropTypes.string.isRequired		 //   'active'/'inactive'/'active-highlight'/'inactive-highlight'/'view-accent'/'view-accent-highlight'/
							 //      'active-search'/'inactive-search'/'active-highlight-search'/'inactive-highlight-search'
      })).isRequired,
      context: PropTypes.shape({
	 parent: PropTypes.string.isRequired,		 // Parent component name
	 rowName: PropTypes.string.isRequired		 // Specific category/provider name
      }),
      dotClickFn: PropTypes.func			 // Callback when a dot is clicked
   }

   //
   // Accumulate array of svg <circle> elements for dots
   //
   renderDot = (result, dot, index) => {
      // TODO: make consistent (need units?)
      const halfHeight = numericPart(this.props.height)/2 + unitPart(this.props.height);

      switch (dot.dotType) {
         case 'inactive':
	    result.push(<circle className='inactive-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
				onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, dot.date, dot.dotType) : null } />);
	    break;

         case 'inactive-search':
	    result.push(<circle className='inactive-search-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
				onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, dot.date, dot.dotType) : null } />);
	    break;

         case 'active-search':
	    result.push(<circle className='active-search-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
				onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, dot.date, dot.dotType) : null } />);
	    break;

         case 'inactive-highlight':
	    result.push(<circle className='inactive-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
				onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, dot.date, dot.dotType) : null } />);
	    break;

         case 'active-highlight':
	    result.push(<circle className='active-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
				onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, dot.date, dot.dotType) : null } />);
	    break;

         case 'inactive-highlight-search':
	    result.push(<circle className='inactive-search-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
				onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, dot.date, dot.dotType) : null } />);
	    break;

         case 'active-highlight-search':
	    result.push(<circle className='active-search-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
				onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, dot.date, dot.dotType) : null } />);
	    break;

         case 'view-accent':
	    result.push(<circle className='view-accent-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
				onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, dot.date, dot.dotType) : null } />);
	    break;

         case 'view-accent-highlight':
	    result.push(<circle className='view-accent-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
				onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, dot.date, dot.dotType) : null } />);
	    break;

         default: // 'active'
	    result.push(<circle className='active-dots' key={index} cx={dot.position*100+'%'} cy={halfHeight} r={config.normalDotRadius}
				onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, dot.date, dot.dotType) : null } />);
	    break;
      }

      if (dot.dotType.includes('highlight')) {
	 result.push(<circle className='highlight-ring-dots' key={'r'+index} cx={dot.position*100+'%'} cy={halfHeight} r={config.highlightDotRadius}
			     onClick={ this.props.dotClickFn ? e => this.props.dotClickFn(this.props.context, dot.date, dot.dotType) : null } />);
      }

      return result;
   }

   render() {
      return this.props.dotPositions.length > 0 ? this.props.dotPositions.reduce(this.renderDot, []) : null;
   }
}
