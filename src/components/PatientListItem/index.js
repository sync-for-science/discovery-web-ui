import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import './PatientListItem.css';

//
// Render info and link for a patient/participant
//
export default class PatientListItem extends Component
{
   static propTypes = {
      id: PropTypes.string,
      name: PropTypes.string
   }

   render() {
      const id = this.props.id;
      return (
	 <div className="PatientListItem">
	    <Link to={'/patient/'+id}>{this.props.name+' ('+id+')'}</Link>
	 </div>
      );
   }
}
