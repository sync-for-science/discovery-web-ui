import React, { Component } from 'react';

import './PatientList.css';
import PatientListItem from '../PatientListItem';
import config from '../../config.js';

//
// Render the list of patients/participants
//
export default class PatientList extends Component {

   state = {
      patients: {},
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
         .then(data => this.setState({ patients: data, isLoading: false }))

         .catch(fetchError => this.setState({ fetchError, isLoading: false }));
   }

   render() {
      return (
	 <div className='PatientList'>
            <header className='PatientList-header'>
              <h1 className='PatientList-title'>Select a participant to view details</h1>
            </header>

	    { this.renderList() }
	 </div>
      );
   }

   renderList() {
      const { patients, isLoading, fetchError } = this.state;
      const results = [];

      if (fetchError) {
	 return <p>{ 'PatientList: ' + fetchError.message }</p>;
      }

      if (isLoading) {
	 return <p>Loading ...</p>;
      }

      for (let patientId in patients) {
	  results.push(<PatientListItem key={patientId} id={patientId} name={patients[patientId]} />);
      }
      return results;
   }
}
