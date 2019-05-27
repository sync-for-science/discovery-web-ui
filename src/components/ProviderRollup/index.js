import React from 'react';
import PropTypes from 'prop-types';

// import './ProviderRollup.css';
import '../../css/Selector.css';

//import SVGContainer from '../SVGContainer';
//import DotLine from '../DotLine';

//
// Render the DiscoveryApp "rollup" provider line
//
export default class ProviderRollup extends React.Component {

   static myName = 'ProviderRollup';

   static propTypes = {
      svgWidth: PropTypes.string.isRequired,
      dotPositionsFn: PropTypes.func.isRequired,
      dotClickFn: PropTypes.func.isRequired,
      isExpanded: PropTypes.bool.isRequired,
      expansionFn: PropTypes.func.isRequired,
      allOnOffFn: PropTypes.func.isRequired,
   }

   state = {
      isExpanded: this.props.isExpanded
   }

   handleTwistyClick = () => {
      this.setState({isExpanded: !this.state.isExpanded});
      this.props.expansionFn('Providers', !this.state.isExpanded);
   }

   handleDoubleClick = () => {
      this.props.allOnOffFn('Provider');
   }
	
   render() {
      return (
	 <div className='selector-rollup'>
	    <div className={this.state.isExpanded ? 'selector-rollup-nav-enabled' : 'selector-rollup-nav-disabled'}
		 onClick={this.handleTwistyClick} onDoubleClick={this.handleDoubleClick} >
	      {/*Providers*/}For
	    </div>
	      {/* <SVGContainer className='provider-rollup-svg-container' svgClassName='provider-rollup-svg' svgWidth={this.props.svgWidth}>
	       <DotLine dotPositions={this.props.dotPositionsFn(ProviderRollup.myName, 'Providers', true)}
			context={ {parent:ProviderRollup.myName, rowName:'Providers'} }
			dotClickFn={this.props.dotClickFn} />
			</SVGContainer> */}
	 </div>
      )
   }
}
