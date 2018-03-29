import React, { Component } from 'react';

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
      fetchError: null
   }
    
   componentDidMount() {
      this.setState({ isLoading: true });
      fetch(config.serverUrl + '/participants')
         .then(response => {
	    if (response.ok) {
	       return response.json();
	    } else {
	       throw new Error("Can't fetch participants!");
	    }
	 })
         .then(data => this.setState({ participants: data, isLoading: false }))

         .catch(fetchError => this.setState({ fetchError, isLoading: false }));
   }

   render() {
      return (
	 <div className='ParticipantList'>
            <header className='ParticipantList-header'>
              <h1 className='ParticipantList-title'>Select a participant to view details</h1>
            </header>

	    { this.renderList() }
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
	  results.push(<ParticipantListItem key={participantId} id={participantId} name={participants[participantId]} />);
      }
      return results;
   }
}
