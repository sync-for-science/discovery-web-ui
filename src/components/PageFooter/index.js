import React, { Component } from 'react';

import './PageFooter.css';

import ContentPanel from '../ContentPanel';

//
// Render the page footer of ParticipantDetail page
//
export default class PageFooter extends Component {

   render() {
      return (
	 <div className='page-footer'>
	    <ContentPanel />
	 </div>
      )
   }
}
