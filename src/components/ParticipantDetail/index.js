import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { get } from 'axios';

import './ParticipantDetail.css';
import config from '../../config.js';
import FhirTransform from '../../FhirTransform.js';

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
      details: undefined,
      isLoading: false,
      fetchError: null
   }

   // Options for jsonQuery -- see https://www.npmjs.com/package/json-query
   get queryOptions() {
      return {
	 locals: {
	    isCategory: (input, value) => input && input.category ? input.category.text === value : false
	 }
      };
   }

   // Collect resources by category from a provider section of the merged data set
   // (functions will be replaced with their results)
   get categoriesForProviderTemplate() {
      return {
	 'Patient': {
	    name:       e => FhirTransform.getPathItem(e, 'entry.resource[resourceType=Patient].name'),
	    identType:	e => FhirTransform.getPathItem(e, 'entry.resource[resourceType=Patient].identifier[0].type.text'),
            identifier: e => FhirTransform.getPathItem(e, 'entry.resource[resourceType=Patient].identifier[0].value')
	 },
	 'Conditions':     	  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Condition]'),
	 'Lab Results':		  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation][*:isCategory(Laboratory)]', this.queryOptions),
	 'Vital Signs':		  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation][*:isCategory(Vital Signs)]', this.queryOptions),
	 'Social History':	  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation][*:isCategory(Social History)]', this.queryOptions),
	 'Medications Requested': e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationOrder]'),
	 'Medications Dispensed': e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationDispense]'),
	 'Immunizations':	  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Immunization]'),
	 'Procedures':		  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Procedure]'),
	 'Document References':	  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=DocumentReference]'),
	 'Allergies':		  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=AllergyIntolerance]')
      }
   }

   // Template/function for the full merged data set, ordered by provider then category
   get providerTemplate() {
      return data => {
	 var result = {};
	 var obj;
	 for (let providerName in data) {
	    if (data[providerName].error) {
	       // Error response
	       obj = { Error: data[providerName].error };
	    } else {
	       // Valid data
	       obj = FhirTransform.transform(data[providerName], this.categoriesForProviderTemplate);
	       for (let propName in obj) {
		  if (obj[propName] === null || obj[propName] === undefined || (obj[propName] instanceof Array && obj[propName].length === 0)) {
	             // Remove empty top-level item
		     delete obj[propName];
		  }
	       }
	    }
	    result[providerName] = obj;
	 }
	 return result;
      }
   }

   // Template/function for the full merged data set, ordered by category then provider
   get categoryTemplate() {
      return data => {
	 var result = {};
	 var obj;
	 for (let providerName in data) {
	    if (data[providerName].error) {
	       // Error response
	       if (!result.Error) {
		  // Init container  
		  result.Error = {};
	       }
	       result.Error[providerName] = data[providerName].error;
	    } else {
	       // Valid data
	       obj = FhirTransform.transform(data[providerName], this.categoriesForProviderTemplate);
	       for (let propName in obj) {
		  if (obj[propName] === null || obj[propName] === undefined || (obj[propName] instanceof Array && obj[propName].length === 0)) {
	             // Ignore empty top-level item
		  } else {
		     if (!result[propName]) {
			// Init container for this category
			result[propName] = {};
		     }
		     result[propName][providerName] = obj[propName];
		  }
	       }
	    }
	 }
	 return result;
      }
   }

   // TODO: currently assumes providerTemplate
   get providers() {
      let provs = {};
      if (this.state.details) {
	 let obj = this.state.details.transformed;
	 for (let provider in obj) {
	    // Add the found provider
	    provs[provider] = null;
	 }
      }
      return Object.keys(provs);
   }

   // TODO: currently assumes providerTemplate
   get categories() {
      let cats = {};
      if (this.state.details) {
	 let obj = this.state.details.transformed;
	 for (let provider in obj) {
	    for (let category in obj[provider]) {
	       if (category !== 'Patient') {
		  // Add the found category (doesn't matter if previously added)
		  cats[category] = null;
	       } 
	    }
	 }
      }
      return Object.keys(cats);
   }

   componentDidMount() {
      this.setState({ isLoading: true });
      // Get the merged dataset and transform it according to category/provider template
      get(config.serverUrl + '/participants/' + this.props.match.params.index)
         .then(response => this.setState({ details: new FhirTransform(response.data, this.providerTemplate),
//         .then(response => this.setState({ details: new FhirTransform(response.data, this.categoryTemplate),
					   isLoading: false }))
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
	          { this.categories.map(
		      name => <Category key={name} category={name} active={[0.25, 0.50, 0.75]} highlight={[0.50]} inactive={[0.30, 0.55, 0.60]} /> )}
	       </Categories>
	       <Providers>
	          <ProviderRollup key='0' active={[0.25, 0.50, 0.75]} highlight={[0.50]} inactive={[0.30, 0.55, 0.60]} />
	          { this.providers.map(
	              name => <Provider key={name} provider={name} active={[0.25, 0.50, 0.75]} highlight={[0.50]} inactive={[0.30, 0.55, 0.60]} /> )}
	       </Providers>
	    </div>
	    <PageFooter />  
	    Temp data display --
	      <pre>{ details ? JSON.stringify(details.transformedData,null,3) : 'Loading...' }</pre>
	 </div>
      );
   }
}
