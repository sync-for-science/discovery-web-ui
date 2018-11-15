import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { get } from 'axios';

import './DiscoveryApp.css';
import config from '../../config.js';
import FhirTransform from '../../FhirTransform.js';
import { cleanDates, normalizeDates, timelineIncrYears } from '../../util.js';
import { formatPatientName, formatPatientAddress, formatPatientMRN } from '../../fhirUtil.js';
import PageHeader from '../PageHeader';
import LongitudinalView from '../LongitudinalView';
import DiscoveryModal from '../DiscoveryModal';
import PageFooter from '../PageFooter';

//
// Render the top-level Discovery application page
//
export default class DiscoveryApp extends Component {

   static propTypes = {
      match: PropTypes.object
   }

   state = {
      resources: null,		// Will be set to an instance of FhirTransform
      dates: null,		// Collection of dates for views:
				//    allDates
				//    minDate	   Earliest date we have data for this participant
				//    startDate	   Jan 1 of minDate's year
				//    maxDate	   Latest date we have data for this participant
				//    endDate	   Dec 31 of maxDate's year
      searchRefs: [],		// Search results to highlight
      isLoading: false,
      fetchError: null,		// Possible axios error object
      modalName: '',
      modalIsOpen: false,
      lastEvent: null
   }

   componentDidMount() {
      window.addEventListener('resize', this.onEvent);       
      window.addEventListener('keydown', this.onEvent);

      this.setState({ isLoading: true });

      // Get the merged dataset and transform it using topTemplate
      get(config.serverUrl + '/participants/' + this.props.match.params.index)
         .then(response => {
	    // Non-empty response?
	    if (Object.getOwnPropertyNames(response.data).length !== 0) {
	       const resources = new FhirTransform(response.data, this.topTemplate);
	       const itemDates = cleanDates(resources.pathItem('itemDate'));
	       const minDate = itemDates.length > 0 ? itemDates[0] : null;		     // Earliest date we have data for this participant
	       const firstYear = parseInt(minDate.substring(0,4));			     // minDate's year
	       const startDate = firstYear+'-01-01';					     // Jan 1 of minDate's year
	       const maxDate = itemDates.length > 0 ? itemDates[itemDates.length-1] : null;  // The latest date we have data for this participant
	       const lastYear = parseInt(maxDate.substring(0,4));			     // maxDate's year
	       const incr = timelineIncrYears(minDate, maxDate, config.maxSinglePeriods);    // Number of years between timeline ticks
	       const endDate = (lastYear + incr - (lastYear-firstYear)%incr - 1) + '-12-31'  // Dec 31 of last year of timeline tick periods
	       const normDates = itemDates.length > 0 ? normalizeDates(itemDates, startDate, endDate) : [];
	       const allDates = itemDates.length > 0 ? itemDates.map((date, index) => ({position: normDates[index], date: date})) : [];
	       const dates = { allDates: allDates, minDate: minDate, startDate:startDate, maxDate: maxDate, endDate: endDate };

	       this.setState({ resources: resources,
			       dates: dates,
			       isLoading: false })
	    } else {
		this.setState({ fetchError: { message: 'Invalid Participant ID' },
				isLoading: false })
	    }
	 })
	 .catch(fetchError => this.setState({ fetchError: fetchError, isLoading: false }));
   }

   componentWillUnmount() {
      window.removeEventListener('resize', this.onEvent);
      window.removeEventListener('keydown', this.onEvent);
   }

   onEvent = (event) => {
      this.setState({ lastEvent: event });
   }

   // Options for jsonQuery -- see https://www.npmjs.com/package/json-query
   get queryOptions() {
      return {
	 locals: {
	    isCategory: (input, value) => {
//	       console.log('input.category: ' + JSON.stringify(input.category,null,3));
	       if (input && input.category) {
		  if (input.category.text === value) {
		     return true;
		  } else if (input.category.coding) {
		     return input.category.coding[0].code === value;
		  } else if (input.category[0]) {
		      if (input.category[0].coding) {
			  return input.category[0].coding[0].code === value;
		      } else {
			  return false;
		      }
		  } else {
		     return false;
		  }
	       } else {
		  return false;
	       }
	    }
	 }
      };
   }

   // Collect resources by category from a provider section of the merged data set
   // (functions in the template will be replaced with their return values)
   get categoriesForProviderTemplate() {
      return {
	 'Patient':		  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Patient]'),
	 'Conditions':     	  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Condition]'),
	 'Lab Results':		  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation]'
										 +'[*:isCategory(Laboratory)|:isCategory(laboratory)]', this.queryOptions),
	 'Vital Signs':		  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation]'
										 +'[*:isCategory(Vital Signs)|:isCategory(vital-signs)]', this.queryOptions),
	 'Social History':	  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation]'
										 +'[*:isCategory(Social History)]', this.queryOptions),
	 'Meds Statement':	  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationStatement]'),
	 'Meds Requested':        e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationOrder|resourceType=MedicationRequest]'),
	 'Meds Dispensed':        e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationDispense]'),
	 'Meds Administration':	  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationAdministration]'),
	 'Immunizations':	  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Immunization]'),
	 'Procedures':		  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Procedure]').concat(
					  FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation][*:isCategory(procedure)]', this.queryOptions)),
	 'Document References':	  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=DocumentReference]'),
	 'Allergies':		  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=AllergyIntolerance]')
      }
   }

   itemDate(item, category) {
      let date = null;
      try {
	 switch (category) {
	    case 'Conditions':
	       date = item.onsetDateTime;
	       break;
	    case 'Lab Results':
	    case 'Vital Signs':
	       date = item.effectiveDateTime;
	       break;
	    case 'Social History':
	       date = new Date().toISOString();		// Use today's date
	       break;
	    case 'Meds Statement':
	       date = item.dateAsserted;
	       break;
	    case 'Meds Requested':
	       try {
		  date = item.dosageInstruction[0].timing.repeat.boundsPeriod.start;
	       } catch (e) {
		  date = item.authoredOn;
	       }
	       break;
	    case 'Meds Dispensed':
	       date = item.whenHandedOver;
	       break;
	    case 'Meds Administration':
	       date = item.effectiveTimeDateTime !== undefined ? item.effectiveTimeDateTime
							       : (item.effectiveTimePeriod.start !== undefined ? item.effectiveTimePeriod.start
													       : item.effectiveTimePeriod.end);
	       break;
	    case 'Immunizations':
	       date = item.date;
	       break;
	    case 'Procedures':
	       date = item.performedDateTime || item.effectiveDateTime || (item.performedPeriod ? item.performedPeriod.start : null);
	       break;
	    case 'Document References':
	       date = item.created;
	       break;
	    case 'Allergies':
	       date = item.recordedDate || item.assertedDate;
	       break;
	    default:
	       return null;	// Items without a date
	 }
      } catch (err) {
	  console.log(`*** ${category} -- date error: ${err.message} ***`);
	  return null;
      }

      if (date) {
	 return date;
      } else {
	 console.log(`*** ${category} -- no date found! ***`);
	 return null;
      }
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

   // Return sorted array of all populated category names for this participant
   get categories() {
      let cats = {};
      if (this.state.resources) {
         for (let resource of this.state.resources.transformed) {
	    if (resource.category !== 'Patient') {
	       // Add the found category
	       cats[resource.category] = null;
	    }
	 }
      }
      return Object.keys(cats).sort();
   }

   // Return sorted array of all provider names for this participant
   get providers() {
      let provs = {};
      if (this.state.resources) {
	 for (let resource of this.state.resources.transformed) {
	    // Add the found provider
	    provs[resource.provider] = null;
	 }
      }
      return Object.keys(provs).sort();
   }

   //
   // Modal callback function
   //
   fetchModalData = this.fetchModalData.bind(this);
   fetchModalData(modalName) {
      switch (modalName) {
         case 'participantInfoModal':
	    let res = { Name: formatPatientName(this.state.resources.pathItem('[category=Patient].data.name')),
			Address: formatPatientAddress(this.state.resources.pathItem('[category=Patient].data.address')),
			Gender: this.state.resources.pathItem('[category=Patient].data.gender'),
			'Birth Date': this.state.resources.pathItem('[category=Patient].data.birthDate'),
			'Medical Record Number': formatPatientMRN(this.state.resources.pathItem('[category=Patient].data.identifier'))
		      };
	    return res;
	 default:
	    return '?????';	// TODO
      }
   }

   //
   // Search callback function
   //
   searchCallback = this.searchCallback.bind(this);
   searchCallback(refs) {
      let plusRefs = refs.map(ref => {
	 ref.position = this.state.dates.allDates.find(elt => elt.date === ref.date).position;
	 return ref;
      });
      this.setState({searchRefs: plusRefs});
   }

   render() {
      if (this.state.fetchError) {
	 return <p>{ 'DiscoveryApp: ' + this.state.fetchError.message }</p>;
      }

      if (this.state.isLoading) {
	 return <p>Loading ...</p>;
      }

      return (
         <div className='discovery-app'>
	    <PageHeader rawQueryString={this.props.location.search} modalIsOpen={this.state.modalIsOpen}
			modalFn={ name => this.setState({ modalName: name, modalIsOpen: true })}
			searchData={this.state.resources && this.state.resources.transformed}
			searchCallback={this.searchCallback} />
	    <LongitudinalView resources={this.state.resources} dates={this.state.dates} categories={this.categories} providers={this.providers}
			      searchRefs={this.state.searchRefs} lastEvent={this.state.lastEvent} />
	    <DiscoveryModal isOpen={this.state.modalIsOpen} modalName={this.state.modalName}
			    onClose={ name => this.setState({ modalName: '', modalIsOpen: false })} callbackFn={this.fetchModalData} />
	    <PageFooter/>
	 </div>
      );
   }
}
