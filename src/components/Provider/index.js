import React from 'react';
import PropTypes from 'prop-types';

import '../../css/Selector.css';
import { titleCase } from '../../util.js';

import SVGContainer from '../SVGContainer';
import DotLine from '../DotLine';

//
// Render a DiscoveryApp provider line
//
export default class Provider extends React.Component {

   static myName = 'Provider';

   static propTypes = {
      providerName: PropTypes.string.isRequired,
      svgWidth: PropTypes.string.isRequired,
      dotPositionsFn: PropTypes.func.isRequired,
      dotClickFn: PropTypes.func,
      enabledFn: PropTypes.func.isRequired,
      isEnabled: PropTypes.bool
   }

   state = {
      isEnabled: true
   }

   componentDidMount() {
      window.addEventListener('keydown', this.onKeydown);
      if (this.props.isEnabled !== undefined) {
	 this.setState({ isEnabled: this.props.isEnabled });
//	 this.props.enabledFn(Provider.myName, this.props.providerName, this.props.isEnabled);
      }
   }

   componentDidUpdate(prevProps, prevState) {
      if (this.props.isEnabled !== prevProps.isEnabled) {
	 this.setState({ isEnabled: this.props.isEnabled });
//	 this.props.enabledFn(Provider.myName, this.props.providerName, this.props.isEnabled);
      }
   }

   componentWillUnmount() {
      window.removeEventListener('keydown', this.onKeydown);
   }

   onKeydown = (event) => {
      if (event.key === 'Enter') {
	 // Do nothing (don't want in-focus buttons to toggle on Enter
	 event.preventDefault();
      }
   }

   handleButtonClick = () => {
      this.props.enabledFn(Provider.myName, this.props.providerName, !this.state.isEnabled);
      this.setState({isEnabled: !this.state.isEnabled});
   }

   render() {
      return (
	 <div className='selector'>
	    <div className='selector-nav'>
	       <button className={this.state.isEnabled ? 'selector-button-enabled' : 'selector-button-disabled'} onClick={this.handleButtonClick} >
		  { titleCase(this.props.providerName) }
	       </button>
	    </div>
	    <SVGContainer className='selector-svg-container' svgClassName='selector-svg' svgWidth={this.props.svgWidth}>
	       <DotLine dotPositions={this.props.dotPositionsFn(Provider.myName, this.props.providerName, this.state.isEnabled)}
			context={ {parent:Provider.myName, rowName:this.props.providerName} }
			dotClickFn={this.props.dotClickFn} />
	    </SVGContainer>
	 </div>
      )
   }
}
