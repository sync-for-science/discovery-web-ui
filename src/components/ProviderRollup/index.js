import React from 'react';
import PropTypes from 'prop-types';

import './ProviderRollup.css';

//import SVGContainer from '../SVGContainer';
//import DotLine from '../DotLine';

//
// Render the "rollup" provider line of ParticipantDetail page
//
export default class ProviderRollup extends React.Component {

   static propTypes = {
      svgWidth: PropTypes.string.isRequired,
      dotPositionsFn: PropTypes.func.isRequired,
      dotClickFn: PropTypes.func.isRequired,
      expansionFn: PropTypes.func.isRequired
   }

   state = {
      isExpanded: true
   }

   handleTwistyClick = () => {
      this.setState({isExpanded: !this.state.isExpanded});
      this.props.expansionFn('Providers', !this.state.isExpanded);
   }

   render() {
      return (
	 <div className='provider-rollup'>
	    <div className={this.state.isExpanded ? 'provider-rollup-nav-enabled' : 'provider-rollup-nav-disabled'} onClick={this.handleTwistyClick} >
	      {/*Providers*/}For
	    </div>
	      {/* <SVGContainer className='provider-rollup-svg-container' svgClassName='provider-rollup-svg' svgWidth={this.props.svgWidth}>
	       <DotLine dotPositions={this.props.dotPositionsFn(this.constructor.name, 'Providers', true)}
			context={ {parent:this.constructor.name, rowName:'Providers'} }
			dotClickFn={this.props.dotClickFn} />
			</SVGContainer> */}
	 </div>
      )
   }
}
