import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import './ParticipantListItem.css';

//
// Render info and link for a patient/participant
//
export default class ParticipantListItem extends Component
{
   static propTypes = {
      id: PropTypes.string,
      name: PropTypes.string
   }

   render() {
      const id = this.props.id;
      return (
	 <div className="participant-list-item">
	    <Link to={'/participant/'+id}>{this.props.name+' ('+id+')'}</Link>
	 </div>
      );
   }
}
