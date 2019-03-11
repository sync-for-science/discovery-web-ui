import React from 'react';

import './Providers.css';

//
// Render the provider section of ParticipantDetail page
//
export default class Providers extends React.Component {

   render() {
      return (
	 <div className='providers'>
	    { this.props.children }
	 </div>
      )
   }
}
