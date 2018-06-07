import React, { Component } from 'react';

import './Categories.css';

//
// Render the category section of ParticipantDetail page
//
export default class Categories extends Component {

   render() {
      return (
	 <div className='categories'>
	    { this.props.children }  
	 </div>
      )
   }
}

