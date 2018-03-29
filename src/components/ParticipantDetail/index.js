import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './ParticipantDetail.css';
import config from '../../config.js';

//
// Render the participant detail page
//
export default class ParticipantDetail extends Component {

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
         <div className='ParticipantDetail'>
            <header className='ParticipantDetail-header'>
               <h1 className='ParticipantDetail-title'>Participant Details</h1>
            </header>
	   
	    { this.renderDetails() }
         </div>
      );
   }

   renderDetails() {
      const { details, isLoading, fetchError } = this.state;

      if (fetchError) {
	  return <p>{ 'ParticipantDetail: ' + fetchError.message }</p>;
      }

      if (isLoading) {
	 return <p>Loading ...</p>;
      }

       return <pre>{JSON.stringify(details,null,3)}</pre>;
   }
}
