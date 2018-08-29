import React, { Component } from 'react';
import { get } from 'axios';
import queryString from 'query-string';

import './ParticipantList.css';
import ParticipantListItem from '../ParticipantListItem';
import config from '../../config.js';

//
// Render the list of participants
//
export default class ParticipantList extends Component {

   state = {
      participants: {},
      isLoading: false,
      fetchError: null,
      logoClasses: ['logo-s4s-button']		// Parsed from query string 'logos=a,b,c'
   }
    
   componentDidMount() {
      const queryVals = queryString.parse(this.props.location.search);
      if (queryVals.logos) {
	  this.setState({logoClasses: queryVals.logos.split(',')});
      }
      this.setState({ isLoading: true });
      get(config.serverUrl + '/participants')
         .then(response => this.setState({ participants: response.data, isLoading: false }))
	 .catch(fetchError => this.setState({ fetchError, isLoading: false }));
   }

   render() {
      return (
	 <div className='participant-list'>
            <div className='participant-list-header'>
               <div className='logo-box'>
		  { this.state.logoClasses.map(
		       (logoClass,index) => <div className={logoClass+'-off'} key={logoClass+index} /> )}
	       </div>
	    </div>
		
	    <div className='participant-list-content'>
	       <div className='participant-list-title'>Select a Participant to View Details</div>
				<div className="participant-list-content-data">
					<div className='participant-list-header-wrapper'>
	       			<div className='participant-list-column-header-flagged'/>
	       			<div className='participant-list-column-header-name-id'>Participant</div>
	       			<div className='participant-list-column-header-gender'>Gender</div>
	       			<div className='participant-list-column-header-dob'>DOB</div>
	       			<div className='participant-list-column-header-dates'>Date Range</div>
	       			<div className='participant-list-column-header-providers'>Providers</div>
	       			<div className='participant-list-column-header-values'>Data Values</div>
					</div>
					<div className='participant-list-data-wrapper'>
	       			{ this.renderList() }
					</div>
	    		</div>
			</div>
	 	</div>
      );
   }

   renderList() {
      const { participants, isLoading, fetchError } = this.state;
      const results = [];

      if (fetchError) {
	 return <p>{ 'ParticipantList: ' + fetchError.message }</p>;
      }

      if (isLoading) {
	 return <p>Loading ...</p>;
      }

      for (let participantId in participants) {
	 results.push(<ParticipantListItem key={participantId} id={participantId}
					   participant={participants[participantId]} rawQueryString={this.props.location.search}/>);
      }
      return results;
   }
}
