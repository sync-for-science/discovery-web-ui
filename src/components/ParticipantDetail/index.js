import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { get } from 'axios';

import './ParticipantDetail.css';
import config from '../../config.js';
import FhirTransform from '../../FhirTransform.js';
import { getPatientName, getPatientAddress } from '../../fhirUtil.js';
import PageHeader from '../PageHeader';
import TimeWidget from '../TimeWidget';
import CategoryRollup from '../CategoryRollup';
import Categories from '../Categories';
import Category from '../Category';
import ProviderRollup from '../ProviderRollup';
import Providers from '../Providers';
import Provider from '../Provider';
import PageFooter from '../PageFooter';
import DiscoveryModal from '../DiscoveryModal';

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
      fetchError: null,		    // Possible axios error object
      catsExpanded: true,
      provsExpanded: true,
      modalName: '',
      modalIsOpen: false,
      dotClickContext: null,
   }

   onOpenModal =  (name) => this.setState({ modalName: name, modalIsOpen: true });
   onCloseModal = ()     => this.setState({ modalName: '', modalIsOpen: false });

   // Options for jsonQuery -- see https://www.npmjs.com/package/json-query
   get queryOptions() {
      return {
	 locals: {
	    isCategory: (input, value) => input && input.category ? input.category.text === value : false
	 }
      };
   }

   // Collect resources by category from a provider section of the merged data set
   // (functions in the template will be replaced with their return values)
   get categoriesForProviderTemplate() {
      return {
	 'Patient': [{
	    name:       e => FhirTransform.getPathItem(e, 'entry.resource[resourceType=Patient].name'),
	    gender:     e => FhirTransform.getPathItem(e, 'entry.resource[resourceType=Patient].gender'),
	    birthDate:  e => FhirTransform.getPathItem(e, 'entry.resource[resourceType=Patient].birthDate'),
	    address:    e => FhirTransform.getPathItem(e, 'entry.resource[resourceType=Patient].address'),
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

   // Normalize an array of dates by comparing elements to 'min' (returning 0.0) and 'max' (returning 1.0)
   //   (if min == max then return 0.5)
   normalizeDates(elts, minDate, maxDate) {
      let min = (minDate instanceof Date) ? minDate : new Date(minDate);
      let max = (maxDate instanceof Date) ? maxDate : new Date(maxDate);
      let delta = max - min;
       return elts.map( elt => (delta === 0) ? 0.5 : (((elt instanceof Date) ? elt : new Date(elt)) - min) / delta);
   }

   //
   // Modal callback function
   //
   fetchModalData = this.fetchModalData.bind(this);
   fetchModalData(modalName) {
      switch (modalName) {
         case 'participantInfoModal':
	    let identType = this.state.details.pathItem('[category=Patient].data.identType');
	    let res = { Name: getPatientName(this.state.details.pathItem('[category=Patient].data')),
			Address: getPatientAddress(this.state.details.pathItem('[category=Patient].data')),
			Gender: this.state.details.pathItem('[category=Patient].data.gender'),
			'Birth Date': this.state.details.pathItem('[category=Patient].data.birthDate') };
	    res[identType] = this.state.details.pathItem('[category=Patient].data.identifier');
	    return res;
	 default:
	    return '?????';
      }
   }

   //
   // Callback function for this component's state
   //	parent:		'CategoryRollup', 'Category', 'ProviderRollup', 'Provider'
   //	rowName:	<category-name>/<provider-name>
   //	dotType:	'active', 'inactive', 'highlight'
   //
   // TODO: fix after TimeWidget is in place
   fetchData = (parent, rowName, dotType) => {
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

	 switch (parent) {
	    case 'ProviderRollup':
	       switch (dotType) {
	          case 'highlight':
		     // TODO: get from state
		     return this.normalizeDates([midDate], minDate, maxDate);
	          case 'inactive':
		     return normAllDates.slice(0, mid);
	          default:	// 'active'
		     return normAllDates.slice(mid, normAllDates.length);
	       }
	    case 'Provider':
	       let provDates = this.cleanDates(this.state.details.pathItem(`[*provider=${rowName}].itemDate`, this.queryOptions));
	       let normProvDates = this.normalizeDates(provDates, minDate, maxDate);
	       let indexOfMidProvDate = provDates.indexOf(midDate);
	       switch (dotType) {
	          case 'highlight':
		     // TODO: get from state
		     return indexOfMidProvDate >= 0 ? [ normProvDates[indexOfMidProvDate] ] : [];
	          case 'inactive':
		     return indexOfMidProvDate >= 0 ? normProvDates.slice(0, indexOfMidProvDate)
						    : normProvDates.filter(value => value < normAllDates[mid]);
	          default:	// 'active'
		     return indexOfMidProvDate >= 0 ? normProvDates.slice(indexOfMidProvDate, normProvDates.length)
						    : normProvDates.filter(value => value >= normAllDates[mid]);
	       }
            case 'CategoryRollup':
	       switch (dotType) {
	          case 'highlight':
		     // TODO: get from state
		     return this.normalizeDates([midDate], minDate, maxDate);
	          case 'inactive':
		     return normAllDates.slice(0, mid);
	          default:	// 'active'
		     return normAllDates.slice(mid, normAllDates.length);
	       }
            default:   // 'Category'
	       let catDates = this.cleanDates(this.state.details.pathItem(`[*category=${rowName}].itemDate`, this.queryOptions));
	       let normCatDates = this.normalizeDates(catDates, minDate, maxDate);
	       let indexOfMidCatDate = catDates.indexOf(midDate);
	       switch (dotType) {
	          case 'highlight':
		     // TODO: get from state
		     return indexOfMidCatDate >= 0 ? [ normCatDates[indexOfMidCatDate] ] : [];
	          case 'inactive':
		     return indexOfMidCatDate >= 0 ? normCatDates.slice(0, indexOfMidCatDate)
		       				   : normCatDates.filter(value => value < normAllDates[mid]);
	          default:	// 'active'
		     return indexOfMidCatDate >= 0 ? normCatDates.slice(indexOfMidCatDate, normCatDates.length)
		       				   : normCatDates.filter(value => value >= normAllDates[mid]);
	       }
	 }
      }
   }

   //
   // Handle dot clicks
   //   context = {
   //      parent:	   'CategoryRollup', 'Category', 'ProviderRollup', 'Provider'
   //      rowName:	   <category-name>/<provider-name>
   //      dotType:	   'active', 'inactive', 'highlight'
   //      location:	   scaled location on DotLine (added below)
   //   } 
   //   location:	   normalized x-location of the clicked dot
   //
   onDotClick = (context, location) => {
      context.location = location;
      this.setState({ dotClickContext: context });
//      alert(JSON.stringify(context, null, 3));
   }

   //
   // Handle Category/Provider expand/contract
   //    section:	'Categories', 'Providers'
   //	 expand:	true/false
   //
   onExpandContract = (section, expand) => {
      if (section === 'Categories') {
	 this.setState({ catsExpanded: expand });
      } else {
	 this.setState({ provsExpanded: expand });
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
      if (this.state.fetchError) {
	 return <p>{ 'ParticipantDetail: ' + this.state.fetchError.message }</p>;
      }

      if (this.state.isLoading) {
	 return <p>Loading ...</p>;
      }

      return (
         <div className='participant-detail'>
	    <div className='participant-detail-fixed-header'>
	       <PageHeader modalFn={this.onOpenModal} />
	       <TimeWidget />
	    </div>
	    <div className='participant-detail-categories-and-providers'>
	       <Categories>
	          <CategoryRollup key='rollup' callbackFn={this.fetchData} dotClickFn={this.onDotClick} expansionFn={this.onExpandContract} />
		  {/* TODO: change spacer class names to have 'participant-detail-' prefix */}
	          { this.state.catsExpanded ? [
		       <div className='category category-nav-spacer-top' key='0' />,
	               this.categories.map(
			  cat => <Category key={cat} categoryName={cat} callbackFn={this.fetchData} dotClickFn={this.onDotClick} /> ),
		       <div className='category category-nav-spacer-bottom' key='1' />
		  ] : null }
	       </Categories>
	       <Providers>
	          <ProviderRollup key='rollup' callbackFn={this.fetchData} dotClickFn={this.onDotClick} expansionFn={this.onExpandContract} />
		  {/* TODO: change spacer class names to have 'participant-detail-' prefix */}
		  { this.state.provsExpanded ? [
		       <div className='provider provider-nav-spacer-top' key='0' />,
		       this.providers.map(
			  prov => <Provider key={prov} providerName={prov} callbackFn={this.fetchData} dotClickFn={this.onDotClick} /> ),
		          <div className='provider provider-nav-spacer-bottom' key='1' />
		  ] : null }
	       </Providers>
	    </div>
	    <DiscoveryModal isOpen={this.state.modalIsOpen} modalName={this.state.modalName} onClose={this.onCloseModal} callbackFn={this.fetchModalData} />
	    <PageFooter callbackFn={this.fetchData} context={this.state.dotClickContext} />  
	       { /* Temp data display --
	         <pre>{ this.state.details ? JSON.stringify(this.state.details.initialData,null,3) : 'Loading...' }</pre>
	         <br/>
	         <pre>{ this.state.details ? JSON.stringify(this.state.details.transformedData,null,3) : 'Loading...' }</pre> */ }
	 </div>
      );
   }
}
