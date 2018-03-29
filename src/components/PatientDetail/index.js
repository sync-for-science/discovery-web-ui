import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './PatientDetail.css';
import config from '../../config.js';

//
// Render the detail page
//
export default class PatientDetail extends Component {

   static propTypes = {
      match: PropTypes.object
   }

   state = {
      details: {},
      isLoading: false,
      fetchError: null
   }

   componentDidMount() {
      this.setState({ isLoading: true });
      fetch(config.serverUrl + '/participants/' + this.props.match.params.index)
	 .then(response => {
	    if (response.ok) {
	       return response.json();
	    } else {
	       throw new Error("Can't fetch participant details!");
	    }
	 })
	 .then(data => this.setState({ details: data, isLoading: false }))

	 .catch(fetchError => this.setState({ fetchError, isLoading: false }));
   }

   render() {
      return (
         <div className='PatientDetail'>
            <header className='PatientDetail-header'>
               <h1 className='PatientDetail-title'>Participant Details</h1>
            </header>
	   
	    { this.renderDetails() }
         </div>
      );
   }

   renderDetails() {
      const { details, isLoading, fetchError } = this.state;

      if (fetchError) {
	  return <p>{ 'PatientDetail: ' + fetchError.message }</p>;
      }

      if (isLoading) {
	 return <p>Loading ...</p>;
      }

       return <pre>{JSON.stringify(details,null,3)}</pre>;
   }
}
