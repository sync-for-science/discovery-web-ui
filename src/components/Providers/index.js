import React, { Component } from 'react';

import './Providers.css';

//
// Render the provider section of ParticipantDetail page
//
export default class Providers extends Component {

   render() {
      return (
	 <div className='providers'>
	    { this.props.children }
	 </div>
      )
   }
}
