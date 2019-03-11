import React from 'react';
import PropTypes from 'prop-types';

import './Category.css';

import SVGContainer from '../SVGContainer';
import DotLine from '../DotLine';

//
// Render a category line of ParticipantDetail page
//
export default class Category extends React.Component {

   static propTypes = {
      categoryName: PropTypes.string.isRequired,
      svgWidth: PropTypes.string.isRequired,
      dotPositionsFn: PropTypes.func.isRequired,
      dotClickFn: PropTypes.func.isRequired,
      enabledFn: PropTypes.func.isRequired
   }

   state = {
      isEnabled: true
   }

   componentDidMount() {
      window.addEventListener('keydown', this.onKeydown);
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
      this.props.enabledFn('Category', this.props.categoryName, !this.state.isEnabled);
      this.setState({isEnabled: !this.state.isEnabled});
   }

   render() {
      return (
	 <div className='category'>
	    <div className='category-nav'>
	       <button className={this.state.isEnabled ? 'category-button-enabled' : 'category-button-disabled'} onClick={this.handleButtonClick} >
	          { this.props.categoryName }
	       </button>
	    </div>
	    <SVGContainer className='category-svg-container' svgClassName='category-svg' svgWidth={this.props.svgWidth}>
	       <DotLine dotPositions={this.props.dotPositionsFn(this.constructor.name, this.props.categoryName, this.state.isEnabled)}
			context={ {parent:this.constructor.name, rowName:this.props.categoryName} }
			dotClickFn={this.props.dotClickFn} />
	    </SVGContainer>
	 </div>
      )
   }
}
