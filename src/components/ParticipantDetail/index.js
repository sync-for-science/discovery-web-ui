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
      details: undefined,	    // Will be set to an instance of FhirTransform
      isLoading: false,
      fetchError: null		    // Possible axios error object
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
	 'Patient': [{
	    name:       e => FhirTransform.getPathItem(e, 'entry.resource[resourceType=Patient].name'),
	    identType:	e => FhirTransform.getPathItem(e, 'entry.resource[resourceType=Patient].identifier[0].type.text'),
            identifier: e => FhirTransform.getPathItem(e, 'entry.resource[resourceType=Patient].identifier[0].value')
	 }],
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

   itemDate(item, category) {
      try {
	 switch (category) {
	    case 'Conditions':
	       return item.onsetDateTime;
	    case 'Lab Results':
	    case 'Vital Signs':
	       return item.effectiveDateTime;
	    case 'Medications Requested':
	       return item.dosageInstruction[0].timing.repeat.boundsPeriod.start;
	    case 'Medications Dispensed':
	       return item.whenHandedOver;
	    case 'Immunizations':
	       return item.date;
	    case 'Procedures':
	       return item.performedDateTime;
	    case 'Document References':
	       return item.created;
	    case 'Allergies':
	       return item.recordedDate;
	    default:
	       return null;	// Items without a date
	 }
      } catch (err) {
	 return '*** NOT FOUND ***';
      }
   }

   // Remove nulls and duplicates from dateArray, then sort in ascending order
   cleanDates(dateArray) {
      return dateArray.filter((value, index) => value !== null && dateArray.indexOf(value) === index)
	   	      .sort((a, b) => new Date(b) - new Date(a)).reverse();
   }

   // Template/function for the full merged data set
   get topTemplate() {
      return data => {
	 var result = [];
	 for (let providerName in data) {
	    if (data[providerName].error) {
	       // Error response
	       if (!result.Error) {
	          // Init container
		  result.Error = {};
	       }
	       result.Error[providerName] = data[providerName].error;
	    } else {
	       // Valid data for this provider
	       let obj = FhirTransform.transform(data[providerName], this.categoriesForProviderTemplate);
	       for (let propName in obj) {
		  if (obj[propName] === null || obj[propName] === undefined || (obj[propName] instanceof Array && obj[propName].length === 0)) {
		     // Ignore empty top-level item
		  } else {
		     // Flatten data
		     for (let elt of obj[propName]) {
			result.push({
			   provider: providerName,
			   category: propName,
			   itemDate: this.itemDate(elt, propName),
			   data: elt
			});
		     }
		  }
	       }
	    }
	 }
	 return result;
      }
   }

   // Return array of all populated category names for this participant
   get categories() {
      let cats = {};
      if (this.state.details) {
         for (let elt of this.state.details.transformed) {
	    if (elt.category !== 'Patient') {
	       // Add the found category
	       cats[elt.category] = null;
	    }
	 }
      }
      return Object.keys(cats);
   }

   // Return array of all provider names for this participant
   get providers() {
      let provs = {};
      if (this.state.details) {
	 for (let elt of this.state.details.transformed) {
	    // Add the found provider
	    provs[elt.provider] = null;
	 }
      }
      return Object.keys(provs);
   }

   // Normalize an array of dates by comparing elements to 'min' (return 0.0) and 'max' (return 1.0)
   normalizeDates(elts, minDate, maxDate) {
      let min = (minDate instanceof Date) ? minDate : new Date(minDate);
      let max = (maxDate instanceof Date) ? maxDate : new Date(maxDate);
      let delta = max - min;
       return elts.map( elt => (delta === 0) ? 0.5 : (((elt instanceof Date) ? elt : new Date(elt)) - min) / delta);
   }

   //
   // Callback function for this component's state
   //	requestingComponent:	'CategoryRollup', 'Category', 'ProviderRollup', 'Provider'
   //	type:			<category-name>/<provider-name>
   //	subType:		'active', 'inactive', 'highlight'
   //
   // TODO: fix after TimeWidget in place
   fetchData(requestingComponent, type, subType) {
      if (!this.state.details) {
	 return [];
      } else {
	 let allDates = this.cleanDates(this.state.details.pathItem('itemDate'));
	 let minDate = allDates[0];
	 let maxDate = allDates[allDates.length-1];
	 let normAllDates = this.normalizeDates(allDates, minDate, maxDate);
	 // TODO: temp kluge
	 let mid = Math.trunc(normAllDates.length/2);
	 let midDate = allDates[mid];

	 switch (requestingComponent) {
	    case 'ProviderRollup':
	       switch (subType) {
	          case 'highlight':
		     // TODO: get from state
//		     return [0.50];
		     return this.normalizeDates([midDate], minDate, maxDate);
	          case 'inactive':
//		     return [0.30, 0.55, 0.60];
		     return normAllDates.slice(0, mid);
	          default:	// 'active'
//		     return [0.25, 0.50, 0.75];
		     return normAllDates.slice(mid, normAllDates.length);
	       }
	    case 'Provider':
	       let provDates = this.cleanDates(this.state.details.pathItem(`[*provider=${type}].itemDate`, this.queryOptions));
	       let normProvDates = this.normalizeDates(provDates, minDate, maxDate);
	       let indexOfMidProvDate = provDates.indexOf(midDate);
	       switch (subType) {
	          case 'highlight':
		     // TODO: get from state
//		     return [0.50];
		     return indexOfMidProvDate >= 0 ? [ normProvDates[indexOfMidProvDate] ] : [];
	          case 'inactive':
//		     return [0.30, 0.55, 0.60];
		     return indexOfMidProvDate >= 0 ? normProvDates.slice(0, indexOfMidProvDate)
						    : normProvDates.filter(value => value < normAllDates[mid]);
	          default:	// 'active'
//		     return [0.25, 0.50, 0.75];
		     return indexOfMidProvDate >= 0 ? normProvDates.slice(indexOfMidProvDate, normProvDates.length)
						    : normProvDates.filter(value => value >= normAllDates[mid]);
	       }
            case 'CategoryRollup':
	       switch (subType) {
	          case 'highlight':
		     // TODO: get from state
//		     return [0.50];
		     return this.normalizeDates([midDate], minDate, maxDate);
	          case 'inactive':
//		     return [0.30, 0.55, 0.60];
		     return normAllDates.slice(0, mid);
	          default:	// 'active'
//		     return [0.25, 0.50, 0.75];
		     return normAllDates.slice(mid, normAllDates.length);
	       }
            default:   // 'Category'
	       let catDates = this.cleanDates(this.state.details.pathItem(`[*category=${type}].itemDate`, this.queryOptions));
	       let normCatDates = this.normalizeDates(catDates, minDate, maxDate);
	       let indexOfMidCatDate = catDates.indexOf(midDate);
	       switch (subType) {
	          case 'highlight':
		     // TODO: get from state
//		     return [0.50];
		     return indexOfMidCatDate >= 0 ? [ normCatDates[indexOfMidCatDate] ] : [];
	          case 'inactive':
//		     return [0.30, 0.55, 0.60];
		     return indexOfMidCatDate >= 0 ? normCatDates.slice(0, indexOfMidCatDate)
		       				   : normCatDates.filter(value => value < normAllDates[mid]);
	          default:	// 'active'
//		     return [0.25, 0.50, 0.75];
		     return indexOfMidCatDate >= 0 ? normCatDates.slice(indexOfMidCatDate, normCatDates.length)
		       				   : normCatDates.filter(value => value >= normAllDates[mid]);
	       }
	 }
      }
   }

   componentDidMount() {
      this.setState({ isLoading: true });
      // Get the merged dataset and transform it using topTemplate
      get(config.serverUrl + '/participants/' + this.props.match.params.index)
         .then(response => this.setState({ details: new FhirTransform(response.data, this.topTemplate),
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

      return (
         <div className='participant-detail'>
	    <div className='participant-detail-fixed-header'>
	       <PageHeader />
	       <TimeWidget />
	    </div>
	    <div className='participant-detail-categories-and-providers'>
	       <Categories>
	          <CategoryRollup key='rollup' callbackFn={this.fetchData.bind(this)} />
	          { this.categories.map(
		      name => <Category key={name} category={name} callbackFn={this.fetchData.bind(this)} /> )}
	       </Categories>
	       <Providers>
	          <ProviderRollup key='rollup' callbackFn={this.fetchData.bind(this)} />
	          { this.providers.map(
	              name => <Provider key={name} provider={name} callbackFn={this.fetchData.bind(this)} /> )}
	       </Providers>
	    </div>
	    <PageFooter />  
	    Temp data display --
	      <pre>{ details ? JSON.stringify(details.initialData,null,3) : 'Loading...' }</pre>
	      <br/>
	      <pre>{ details ? JSON.stringify(details.transformedData,null,3) : 'Loading...' }</pre>
	 </div>
      );
   }
}
