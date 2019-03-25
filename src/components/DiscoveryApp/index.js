import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'axios';

import './DiscoveryApp.css';
import config from '../../config.js';
import FhirTransform from '../../FhirTransform.js';
import { cleanDates, normalizeDates, timelineIncrYears, ignoreCategories, unimplemented } from '../../util.js';
import PageHeader from '../PageHeader';
import LongitudinalView from '../LongitudinalView';
import SummaryView from '../SummaryView';
import CompareView from '../CompareView';
import BenefitsView from '../BenefitsView';
import ConsultView from '../ConsultView';
import DiabetesView from '../DiabetesView';
//import ReportView from '../ReportView';
import DiscoveryModal from '../DiscoveryModal';
import PageFooter from '../PageFooter';

import DiscoveryContext from '../DiscoveryContext';

//
// Render the top-level Discovery application page
//
export default class DiscoveryApp extends React.Component {

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
      searchMatchWords: [],	// Search results matching words
      laserSearch: false,	// Laser Search enabled?
      isLoading: false,
      fetchError: null,		// Possible axios error object
      modalName: '',
      modalIsOpen: false,
      lastEvent: null,
      currentView: null
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

	       this.checkResourceCoverage(resources);	// Check whether we "found" all resources

	       const itemDates = cleanDates(resources.pathItem('itemDate'));

	       if (itemDates.length === 0) {
		  throw new Error('No matching resources returned');
	       }

	       const minDate = itemDates[0];						     // Earliest date we have data for this participant
	       const firstYear = parseInt(minDate.substring(0,4));			     // minDate's year
	       const startDate = firstYear+'-01-01';					     // Jan 1 of minDate's year
	       const maxDate = itemDates[itemDates.length-1];				     // The latest date we have data for this participant
	       const lastYear = parseInt(maxDate.substring(0,4));			     // maxDate's year
	       const incr = timelineIncrYears(minDate, maxDate, config.maxSinglePeriods);    // Number of years between timeline ticks
	       const endDate = (lastYear + incr - (lastYear-firstYear)%incr - 1) + '-12-31'  // Dec 31 of last year of timeline tick periods
	       const normDates = normalizeDates(itemDates, startDate, endDate);
	       const allDates = itemDates.map((date, index) => ({position: normDates[index], date: date}));
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

   checkResourceCoverage(resources) {
      for (let providerName in resources.initial) {
	 if (resources.initial[providerName].error) {
	    alert('Could not read resources from provider ' + providerName);
	 } else {
	    let initialResourceIDs = resources.initial[providerName].entry.map(elt => elt.resource.id);
	    let finalResourceIDs = resources.transformed.filter(elt => elt.provider === providerName).map(elt => elt.data.id);
	    if (finalResourceIDs.length !== initialResourceIDs.length) {
	       let missingResources = initialResourceIDs.filter(id => !finalResourceIDs.includes(id)).map(id =>
					 resources.initial[providerName].entry.find(elt => elt.resource.id === id));
	       alert('Participant ' + this.props.match.params.index + ' (' + providerName + ') has ' +
		     finalResourceIDs.length + ' resources but should have ' + initialResourceIDs.length);
	       console.log(JSON.stringify(missingResources, null, 3));
	    }
	 }
      }
   }

   // See queryOptions()
   isCategory(input, value) {
//      console.log('input.category: ' + JSON.stringify(input.category,null,3));
      if (input && input.category) {
	 if (input.category.text === value) {
	    return true;
	 } else if (input.category.coding) {
	    return input.category.coding[0].code === value || input.category.coding[0].display === value;
	 } else if (input.category[0]) {
	    if (input.category[0].coding) {
	       return input.category[0].coding[0].code === value || input.category[0].coding[0].display === value;
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

   // Options for jsonQuery -- see https://www.npmjs.com/package/json-query
   get queryOptions() {
      return {
	 locals: {
	    isCategory: (input, value) => this.isCategory(input, value),
	    isNotCategory: (input, value) => !this.isCategory(input, value)
	 }
      };
   }
    
   // Collect resources by category from a provider section of the merged data set
   // (functions in the template will be replaced with their return values)
   get categoriesForProviderTemplate() {
      return {
	 'Patient':			e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Patient]'),
	 'Conditions':     		e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Condition]'),
	 'Lab Results':			e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation]'
										       +'[*:isCategory(Laboratory)|:isCategory(laboratory)]', this.queryOptions),
	 'Vital Signs':			e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation]'
										       +'[*:isCategory(Vital Signs)|:isCategory(vital-signs)]', this.queryOptions),
	 'Social History':		e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation]'
										       +'[*:isCategory(Social History)]', this.queryOptions),
	 'Meds Statement':		e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationStatement]'),
	 'Meds Requested':      	e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationOrder|resourceType=MedicationRequest]'),
	 'Meds Dispensed':      	e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationDispense]'),
	 'Meds Administration':		e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationAdministration]'),
	 'Immunizations':		e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Immunization]'),
	 'Procedures':			e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Procedure]').concat(
					        FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation][*:isCategory(procedure)]', this.queryOptions)),
	 'Document References':		e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=DocumentReference]'),
	 'Allergies':			e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=AllergyIntolerance]'),
	 'Benefits':			e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=ExplanationOfBenefit]'),
	 'Claims':			e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Claim]'),
	 'Encounters':			e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Encounter]'),
	 'Exams':			e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation]'
										       +'[*:isCategory(Exam)|:isCategory(exam)]', this.queryOptions),

	 // Currently unsupported
	 'Practitioner':		e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Practitioner]'),
	 'List':			e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=List]'),
	 'Questionnaire':		e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Questionnaire]'),
	 'QuestionnaireResponse':	e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=QuestionnaireResponse]'),
	 'Observation-Other':	 	e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation]'
										       +'[*:isNotCategory(Laboratory)&:isNotCategory(laboratory)'
										       + '&:isNotCategory(Vital Signs)&:isNotCategory(vital-signs)'
										       + '&:isNotCategory(Social History)&:isNotCategory(procedure)'
										       + '&:isNotCategory(Exam)&:isNotCategory(exam)]', this.queryOptions),
	 'DiagnosticReport':    	e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=DiagnosticReport]'),
	 'CarePlan':			e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=CarePlan]'),
	 'Medication':			e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Medication]'),
	 'Organization':		e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Organization]'),
	 'Goal':			e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Goal]'),
	 'Basic':			e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Basic]'),
	 'ImmunizationRecommendation':	e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=ImmunizationRecommendation]'),
	 'ImagingStudy':		e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=ImagingStudy]')
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
	       date = new Date().toISOString().substring(0,10);		// Use today's date
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
	    case 'Exams': 
	       date = item.performedDateTime || item.effectiveDateTime || (item.performedPeriod ? item.performedPeriod.start : null);
	       break;
	    case 'Document References':
	       date = item.created;
	       break;
	    case 'Allergies':
	       date = item.recordedDate || item.assertedDate;
	       break;
	    case 'List':
	       date = item.date; 
	       break;
	    case 'CarePlan':
	    case 'Encounters':
	       date = item.period.start;
	       break;
	    case 'Benefits':
	    case 'Claims':
	       date = item.billablePeriod.start;
	       break;
	    case 'ImagingStudy':
	       date = item.started;
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
			   id: this.props.match.params.index,
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
	    if (resource.category === 'Patient') {
		 // Ignore
	    } else if (ignoreCategories().includes(resource.category)) {
	       // Add the "Unimplemented" category
	       cats[unimplemented()] = null;
	    } else {
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
   // Search callback function
   //
   searchCallback = this.searchCallback.bind(this);
   searchCallback(refs, matchWords, laserSearch) {
      let plusRefs = refs.map(ref => {
	 ref.position = this.state.dates.allDates.find(elt => elt.date === ref.date).position;
	 return ref;
      });
      this.setState({ searchRefs: plusRefs, searchMatchWords: matchWords, laserSearch: laserSearch });
   }

   renderCurrentView() {
      switch(this.state.currentView) {
         case 'longitudinalView':
	    return <LongitudinalView resources={this.state.resources} dates={this.state.dates} categories={this.categories} providers={this.providers}
				     lastEvent={this.state.lastEvent} />;

         case 'compareView':
	    return <CompareView resources={this.state.resources} dates={this.state.dates} categories={this.categories} providers={this.providers}
				lastEvent={this.state.lastEvent} />;

//         case 'reportView':
//	    return <ReportView resources={this.state.resources} dates={this.state.dates} categories={this.categories} providers={this.providers}
//			       searchRefs={this.state.searchRefs} lastEvent={this.state.lastEvent} />;

         case 'benefitsView':
	    return <BenefitsView resources={this.state.resources} dates={this.state.dates} categories={this.categories} providers={this.providers}
				 lastEvent={this.state.lastEvent} />;

         case 'consultView':
	    return <ConsultView resources={this.state.resources} dates={this.state.dates} categories={this.categories} providers={this.providers}
				lastEvent={this.state.lastEvent} />;

         case 'diabetesView':
	    return <DiabetesView resources={this.state.resources} dates={this.state.dates} categories={this.categories} providers={this.providers}
				 lastEvent={this.state.lastEvent} />;

         case 'summaryView':
         default:
	    return <SummaryView resources={this.state.resources} dates={this.state.dates} categories={this.categories} providers={this.providers}
			        lastEvent={this.state.lastEvent} />;
      }
   }

   render() {
      if (this.state.fetchError) {
	 return <p>{ 'DiscoveryApp: ' + this.state.fetchError.message }</p>;
      }

      if (this.state.isLoading) {
	 return <p>Loading ...</p>;
      }

      return (
	 <DiscoveryContext.Provider value={{providers: this.providers, laserSearch: this.state.laserSearch, resources: this.state.resources,
					    searchRefs: this.state.searchRefs, searchMatchWords: this.state.searchMatchWords}}>
	    <div className='discovery-app'>
	       <PageHeader rawQueryString={this.props.location.search} modalIsOpen={this.state.modalIsOpen}
			   modalFn={ name => this.setState({ modalName: name, modalIsOpen: true }) }
			   viewFn={ name => this.setState({ currentView: name }) }
			   searchData={this.state.resources && this.state.resources.transformed}
			   searchCallback={this.searchCallback}
			   resources={this.state.resources} />
	       { this.state.currentView && this.renderCurrentView() }
	       <DiscoveryModal isOpen={this.state.modalIsOpen} modalName={this.state.modalName}
			       onClose={ name => this.setState({ modalName: '', modalIsOpen: false })} />
	       <PageFooter resources={this.state.resources} />
	    </div>
	 </DiscoveryContext.Provider>
      );
   }
}
