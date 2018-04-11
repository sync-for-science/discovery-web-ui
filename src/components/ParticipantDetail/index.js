import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { get } from 'axios';

import './ParticipantDetail.css';
import config from '../../config.js';

import PageHeader from '../PageHeader';
import TimeWidget from '../TimeWidget';
import CategoryRollup from '../CategoryRollup';
import Categories from '../Categories';
import Category from '../Category';
import ProviderRollup from '../ProviderRollup';
import Providers from '../Providers';
import Provider from '../Provider';
import PageFooter from '../PageFooter';

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
      get(config.serverUrl + '/participants/' + this.props.match.params.index)
         .then(response => this.setState({ details: response.data, isLoading: false }))
	 .catch(fetchError => this.setState({ fetchError, isLoading: false }));
   }

   render() {
      const { details, isLoading, fetchError } = this.state;

      if (fetchError) {
	  return <p>{ 'ParticipantDetail: ' + fetchError.message }</p>;
      }

      if (isLoading) {
	 return <p>Loading ...</p>;
      }

      // TODO: categories/providers from data payload
      return (
         <div className='participant-detail'>
	    <div className='participant-detail-fixed-header'>
	       <PageHeader />
	       <TimeWidget />
	    </div>
	    <div className='participant-detail-categories-and-providers'>
	       <Categories>
	          <CategoryRollup key='0' active={[0.25, 0.50, 0.75]} highlight={[0.50]} inactive={[0.30, 0.55, 0.60]} />
	          <Category key='1' active={[0.25, 0.50, 0.75]} highlight={[0.50]} inactive={[0.30, 0.55, 0.60]} />
	          &nbsp;&nbsp;&nbsp;+ set of Category
	       </Categories>
	       <Providers>
	          <ProviderRollup key='0' active={[0.25, 0.50, 0.75]} highlight={[0.50]} inactive={[0.30, 0.55, 0.60]} />
	          <Provider key='1' active={[0.25, 0.50, 0.75]} highlight={[0.50]} inactive={[0.30, 0.55, 0.60]} />
	          &nbsp;&nbsp;&nbsp;+ set of Category
	       </Providers>
	    </div>
	    <PageFooter />  
	    Temp data display --
	    <pre>{JSON.stringify(details,null,3)}</pre>
	 </div>
      );
   }
}

