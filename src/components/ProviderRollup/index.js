import React from 'react';
import PropTypes from 'prop-types';

// import './ProviderRollup.css';
import '../../css/Selector.css';

//import SVGContainer from '../SVGContainer';
//import DotLine from '../DotLine';

import DiscoveryContext from '../DiscoveryContext';

//
// Render the DiscoveryApp "rollup" provider line
//
export default class ProviderRollup extends React.Component {

   static myName = 'ProviderRollup';

   static contextType = DiscoveryContext;	// Allow the shared context to be accessed via 'this.context'

   static propTypes = {
      svgWidth: PropTypes.string.isRequired,
      dotPositionsFn: PropTypes.func.isRequired,
      dotClickFn: PropTypes.func,
      isExpanded: PropTypes.bool.isRequired,
      expansionFn: PropTypes.func.isRequired,
      provsEnabledFn: PropTypes.func.isRequired,		// Callback to report changed provider enable/disable
      categories: PropTypes.arrayOf(PropTypes.string)
   }

   state = {
      isExpanded: this.props.isExpanded
   }

   handleTwistyClick = () => {
      this.setState({isExpanded: !this.state.isExpanded});
      this.props.expansionFn('Providers', !this.state.isExpanded);
   }

   handleSetClearButtonClick = () => {
      let enabled = Object.keys(this.context.provsEnabled).reduce((count, key) => count + (this.context.provsEnabled[key] &&
											   this.props.providers.includes(key) ? 1 : 0), 0);
      let newProvsEnabled = {};

      if (enabled === 0) {
	 // None enabled
	 if (this.context.savedProvsEnabled) {
	    // --> prior saved partial
	    newProvsEnabled = this.context.savedProvsEnabled;

	 } else {
	    // --> all enabled
	    for (let prov of this.props.providers) {
	       newProvsEnabled[prov] = true;
	    }
	 }

      } else if (enabled < this.props.providers.length) {
	 // Part enabled --> all enabled (and save partial)
	 this.context.updateGlobalContext({ savedProvsEnabled: this.context.provsEnabled });
	 for (let prov of this.props.providers) {
	    newProvsEnabled[prov] = true;
	 }

      } else {
	 // All enabled --> none enabled
	 for (let prov of this.props.providers) {
	    newProvsEnabled[prov] = false;
	 }
      }

      this.props.provsEnabledFn(newProvsEnabled);
   }

   buttonClass() {
      let enabled = this.context.provsEnabled ? Object.keys(this.context.provsEnabled).reduce((count, key) =>
											  count + (this.context.provsEnabled[key] &&
												   this.props.providers.includes(key) ? 1 : 0), 0)
					      : 0;

      if (enabled === 0) return 'selector-rollup-nav-button-none';
      if (enabled < this.props.providers.length) return 'selector-rollup-nav-button-partial';
      return 'selector-rollup-nav-button-all';
   }

   render() {
      return (
	 <div className='selector-rollup'>
	    <button className={this.state.isExpanded ? 'selector-rollup-nav-enabled' : 'selector-rollup-nav-disabled'} onClick={this.handleTwistyClick} >
	      {/*Providers*/}Providers
            </button>
	    <button className={this.buttonClass()} onClick={this.handleSetClearButtonClick} />
	      {/* <SVGContainer className='provider-rollup-svg-container' svgClassName='provider-rollup-svg' svgWidth={this.props.svgWidth}>
	       <DotLine dotPositions={this.props.dotPositionsFn(ProviderRollup.myName, 'Providers', true)}
			context={ {parent:ProviderRollup.myName, rowName:'Providers'} }
			dotClickFn={this.props.dotClickFn} />
			</SVGContainer> */}
	 </div>
      )
   }
}
