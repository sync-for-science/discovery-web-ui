import React from 'react';
import PropTypes from 'prop-types';

import '../../css/Selector.css';

import SVGContainer from '../SVGContainer';
import DotLine from '../DotLine';

//
// Render a DiscoveryApp category line
//
export default class Category extends React.Component {

   static myName = 'Category';

   static propTypes = {
      categoryName: PropTypes.string.isRequired,
      svgWidth: PropTypes.string.isRequired,
      dotPositionsFn: PropTypes.func.isRequired,
      dotClickFn: PropTypes.func,
      enabledFn: PropTypes.func.isRequired,
      isEnabled: PropTypes.bool
   }

   state = {
      isEnabled: false
   }

   componentDidMount() {
      window.addEventListener('keydown', this.onKeydown);
      if (this.props.isEnabled !== undefined) {
	 this.setState({ isEnabled: this.props.isEnabled });
//	 this.props.enabledFn(Category.myName, this.props.categoryName, this.props.isEnabled);
      }
   }

   componentDidUpdate(prevProps, prevState) {
      if (this.props.isEnabled !== prevProps.isEnabled) {
	 this.setState({ isEnabled: this.props.isEnabled });
//	 this.props.enabledFn(Category.myName, this.props.categoryName, this.props.isEnabled);
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
      this.props.enabledFn(Category.myName, this.props.categoryName, !this.state.isEnabled);
      this.setState({isEnabled: !this.state.isEnabled});
   }

   render() {
      return (
	 <div className='selector'>
	    <div className='selector-nav'>
	       <button className={this.state.isEnabled ? 'selector-button-enabled' : 'selector-button-disabled'} onClick={this.handleButtonClick} >
	          { this.props.categoryName }
	       </button>
	    </div>
	    <SVGContainer className='selector-svg-container' svgClassName='selector-svg' svgWidth={this.props.svgWidth}>
	       <DotLine dotPositions={this.props.dotPositionsFn(Category.myName, this.props.categoryName, this.state.isEnabled)}
			context={ {parent:Category.myName, rowName:this.props.categoryName} }
			dotClickFn={this.props.dotClickFn} />
	    </SVGContainer>
	 </div>
      )
   }
}
