import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import './ParticipantListItem.css';

//
// Render info and link for a patient/participant
//
export default class ParticipantListItem extends React.Component
{
   static propTypes = {
      id: PropTypes.string,
      participant: PropTypes.object,
      rawQueryString: PropTypes.string
   }

   render() {
      const id = this.props.id;
      const participant = this.props.participant;
      return [
 <div className='participant-list-item-link' key={'link-'+id}>
    <Link to={'/participant/'+id+this.props.rawQueryString} target='_blank'>
       {participant.name+' ('+id+')'}
    </Link>
 </div>, 
 <div className='participant-list-item-gender' key={'gender-'+id}>
    {participant.gender}
 </div>,
 <div className='participant-list-item-dob' key={'dob-'+id}>
    {participant.dob}
 </div>,
 <div className='participant-list-item-dates' key={'dates-'+id}>
    {participant.dateRange}
 </div>,
 <div className='participant-list-item-providers' key={'providers-'+id}>
    {participant.providerCount ? participant.providerCount : participant.providers.length}
 </div>,
 <div className='participant-list-item-values' key={'values-'+id}>
    {participant.valueCount}
 </div>
      ];
   }
}
