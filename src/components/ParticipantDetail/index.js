import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { get } from 'axios';

import './ParticipantDetail.css';
import config from '../../config.js';
import FhirTransform from '../../FhirTransform.js';
import { getStyle } from '../../util.js';
import { formatPatientName, formatPatientAddress, formatPatientMRN } from '../../fhirUtil.js';
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
      allDates: null,
      minDate: 0,
      startDate: 0,
      maxDate: 0,
      endDate: 0,
      isLoading: false,
      fetchError: null,		    // Possible axios error object
      catsExpanded: true,
      provsExpanded: true,
      modalName: '',
      modalIsOpen: false,
      dotClickContext: null,
      svgWidth: '0'
   }

   // Kluge: following needs to know about lower-level SVG-related classes
   updateSvgWidth = () => {
      const elt = document.querySelector('.category-rollup-svg-container');
      this.setState({ svgWidth: getStyle(elt, 'width') });
   }

   componentDidMount() {
      this.updateSvgWidth();
      window.addEventListener('resize', this.updateSvgWidth);       

      this.setState({ isLoading: true });

      // Get the merged dataset and transform it using topTemplate
      get(config.serverUrl + '/participants/' + this.props.match.params.index)
         .then(response => {
	    // Check for non-empty response
	    if (Object.getOwnPropertyNames(response.data).length !== 0) {
	       let details = new FhirTransform(response.data, this.topTemplate);
	       let dates = this.cleanDates(details.pathItem('itemDate'));
	       let minDate = dates.length > 0 ? dates[0] : null;		// Earliest date we have data for this participant
	       let startDate = minDate.substring(0,4)+'-01-01';			// Jan 1 of minDate's year
	       let maxDate = dates.length > 0 ? dates[dates.length-1] : null;	// The latest date we have data for this participant
	       let endDate = maxDate.substring(0,4)+'-12-31';			// Dec 31 of maxDate's year
	       let normDates = dates.length > 0 ? this.normalizeDates(dates, startDate, endDate) : [];
	       let allDates = dates.length > 0 ? dates.map((date, index) => ({position: normDates[index], date: date})) : [];
	       this.setState({ details: details,
			    allDates: allDates,
			    minDate: minDate,
			    startDate: startDate,
			    maxDate: maxDate,
			    endDate: endDate,
			    isLoading: false })
	    } else {
		this.setState({ fetchError: { message: 'Invalid Participant ID' },
				isLoading: false })
	    }
	 })
	 .catch(fetchError => this.setState({ fetchError: fetchError, isLoading: false }));
   }

   componentWillUnmount() {
      window.removeEventListener('resize', this.updateSvgWidth);
   }

   // Remove nulls and duplicates from dateArray, then sort in ascending order
   cleanDates(dateArray) {
      return dateArray.filter((value, index) => value !== null && dateArray.indexOf(value) === index)
	   	      .sort((a, b) => new Date(b) - new Date(a)).reverse();
//      let res = dateArray.filter((value, index) => value !== null && dateArray.indexOf(value) === index)
//	   	      .sort((a, b) => new Date(b) - new Date(a)).reverse();
//       return res;
   }

   // Normalize an array of dates by comparing elements to 'min' (returning 0.0) and 'max' (returning 1.0)
   //   (if min == max then return 0.5)
   normalizeDates(elts, minDate, maxDate) {
      let min = (minDate instanceof Date) ? minDate : new Date(minDate);
      let max = (maxDate instanceof Date) ? maxDate : new Date(maxDate);
      let delta = max - min;
       return elts.map( elt => (delta === 0) ? 0.5 : (((elt instanceof Date) ? elt : new Date(elt)) - min) / delta);
   }

   // Options for jsonQuery -- see https://www.npmjs.com/package/json-query
   get queryOptions() {
      return {
	 locals: {
	    isCategory: (input, value) => {
	       console.log('input.category: ' + JSON.stringify(input.category,null,3));
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
	 'Meds Requested':        e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationOrder|resourceType=MedicationRequest]'),
	 'Meds Dispensed':        e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationDispense]'),
	 'Immunizations':	  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Immunization]'),
	 'Procedures':		  e => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Procedure]|[*resourceType=Observation]'
													   +'[*:isCategory(procedure)]'),
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
	    case 'Meds Requested':
	       try {
		  return item.dosageInstruction[0].timing.repeat.boundsPeriod.start;
	       } catch (e) {
		  return item.authoredOn;
	       }
	    case 'Meds Dispensed':
	       return item.whenHandedOver;
	    case 'Immunizations':
	       return item.date;
	    case 'Procedures':
	       return item.performedDateTime;
	    case 'Document References':
	       return item.created;
	    case 'Allergies':
	       return item.recordedDate || item.assertedDate;
	    default:
	       return null;	// Items without a date
	 }
      } catch (err) {
	   return `*** ${category}: DATE NOT FOUND ***`;
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

   //
   // Modal callback function
   //
   fetchModalData = this.fetchModalData.bind(this);
   fetchModalData(modalName) {
      switch (modalName) {
         case 'participantInfoModal':
	    let res = { Name: formatPatientName(this.state.details.pathItem('[category=Patient].data.name')),
			Address: formatPatientAddress(this.state.details.pathItem('[category=Patient].data.address')),
			Gender: this.state.details.pathItem('[category=Patient].data.gender'),
			'Birth Date': this.state.details.pathItem('[category=Patient].data.birthDate'),
			'Medical Record Number': formatPatientMRN(this.state.details.pathItem('[category=Patient].data.identifier'))
		      };
	    return res;
	 default:
	    return '?????';
      }
   }

   //
   // Callback function for this component's state, returning the requested array of position+date objects
   //	parent:		'CategoryRollup', 'Category', 'ProviderRollup', 'Provider'
   //	rowName:	<category-name>/<provider-name>
   //	dotType:	'active', 'inactive', 'highlight'
   //
   // TODO: fix after TimeWidget is complete
   fetchDates = this.fetchDates.bind(this);
   fetchDates(parent, rowName, dotType) {
      if (!this.state.details) {
	 return [];
      } else {
	 let { startDate, endDate, allDates } = this.state;
	 if (allDates.length === 0) {
	    return [];
	 } else {
	     // TODO: temp kluge
	     let mid = Math.trunc(allDates.length/2);
	     let midDate = allDates[mid].date;

	     switch (parent) {
	        case 'ProviderRollup':
                case 'CategoryRollup':
	           switch (dotType) {
	              case 'highlight':
		         // TODO: get from state
		         return [allDates[mid]];
	              case 'inactive':
		         return allDates.slice(0, mid);
	              default:  // 'active'
		         return allDates.slice(mid, allDates.length);
		   }
	        case 'Provider':
	           let provDates = this.cleanDates(this.state.details.pathItem(`[*provider=${rowName}].itemDate`, this.queryOptions));
	           let normProvDates = this.normalizeDates(provDates, startDate, endDate);
	           let allProvDates = provDates.map((date, index) => ({position: normProvDates[index], date: date}));
	           let indexOfMidProvDate = provDates.indexOf(midDate);
	           switch (dotType) {
	              case 'highlight':
		         // TODO: get from state
		         return indexOfMidProvDate >= 0 ? [ allProvDates[indexOfMidProvDate] ] : [];
	              case 'inactive':
		         return indexOfMidProvDate >= 0 ? allProvDates.slice(0, indexOfMidProvDate)
							: allProvDates.filter(value => value.position < allDates[mid].position);
		      default:  // 'active'
		         return indexOfMidProvDate >= 0 ? allProvDates.slice(indexOfMidProvDate, allProvDates.length)
							: allProvDates.filter(value => value.position >= allDates[mid].position);
		   }
                default:   // 'Category'
	           let catDates = this.cleanDates(this.state.details.pathItem(`[*category=${rowName}].itemDate`, this.queryOptions));
	           let normCatDates = this.normalizeDates(catDates, startDate, endDate);
	           let allCatDates = catDates.map((date, index) => ({position: normCatDates[index], date: date}));
	           let indexOfMidCatDate = catDates.indexOf(midDate);
	           switch (dotType) {
	              case 'highlight':
		         // TODO: get from state
		         return indexOfMidCatDate >= 0 ? [ allCatDates[indexOfMidCatDate] ] : [];
	              case 'inactive':
		         return indexOfMidCatDate >= 0 ? allCatDates.slice(0, indexOfMidCatDate)
		       				       : allCatDates.filter(value => value.position < allDates[mid].position);
		      default:  // 'active'
		         return indexOfMidCatDate >= 0 ? allCatDates.slice(indexOfMidCatDate, allCatDates.length)
		       				       : allCatDates.filter(value => value.position >= allDates[mid].position);
		   }
	     }
	 }
      }
   }

   //
   // Return data for the clicked dot
   //    parent:	   'CategoryRollup', 'Category', 'ProviderRollup', 'Provider'
   //    rowName:	   <category-name>/<provider-name>
   //    dotType:	   'active', 'inactive', 'highlight'
   //    date:		   date of the clicked dot
   //
   fetchDataForDot = (parent, rowName, dotType, date) => {
       switch (parent) {
       case 'CategoryRollup':
       case 'ProviderRollup':
	   // Return all resources for categories/providers matching the clicked date
	   return this.state.details.pathItem(`[*itemDate=${date}]`);
	   
       case 'Category':
	   // Return all resources matching the clicked category and date
	   return this.state.details.pathItem(`[*itemDate=${date}][*category=${rowName}]`);

       case 'Provider':
       default:
	   // Return all resources matching the clicked provider and date
	   return this.state.details.pathItem(`[*itemDate=${date}][*provider=${rowName}]`);
       }
   }

   //
   // Handle dot clicks
   //   context = {
   //      parent:	   'CategoryRollup', 'Category', 'ProviderRollup', 'Provider'
   //      rowName:	   <category-name>/<provider-name>
   //      dotType:	   'active', 'inactive', 'highlight'
   //      date:	   date of the clicked dot (added below)
   //	   data:	   data associated with the clicked dot (added below)
   //   } 
   //   date:		   date of the clicked dot
   //
   onDotClick = (context, date) => {
      context.date = date;
      context.data = this.fetchDataForDot(context.parent, context.rowName, context.dotType, context.date);
      this.setState({ dotClickContext: context });
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
	      <PageHeader rawQueryString={this.props.location.search} modalIsOpen={this.state.modalIsOpen}
			  modalFn={ name => this.setState({ modalName: name, modalIsOpen: true })} />
	       <TimeWidget minDate={this.state.minDate} maxDate={this.state.maxDate} />
	    </div>
	    <div className='participant-detail-categories-and-providers'>
	       <Categories>
	          <CategoryRollup key='rollup' svgWidth={this.state.svgWidth}
			          callbackFn={this.fetchDates} dotClickFn={this.onDotClick} expansionFn={this.onExpandContract} />
		  {/* TODO: change spacer class names to have 'participant-detail-' prefix */}
	          { this.state.catsExpanded ? [
		       <div className='category-nav-spacer-top' key='0' />,
	               this.categories.map(
			  cat => <Category key={cat} svgWidth={this.state.svgWidth} categoryName={cat}
					   callbackFn={this.fetchDates} dotClickFn={this.onDotClick} /> ),
		       <div className='category-nav-spacer-bottom' key='1' />
		  ] : null }
	       </Categories>
	       <Providers>
	          <ProviderRollup key='rollup' svgWidth={this.state.svgWidth}
				  callbackFn={this.fetchDates} dotClickFn={this.onDotClick} expansionFn={this.onExpandContract} />
		  {/* TODO: change spacer class names to have 'participant-detail-' prefix */}
		  { this.state.provsExpanded ? [
		       <div className='provider-nav-spacer-top' key='0' />,
		       this.providers.map(
			  prov => <Provider key={prov} svgWidth={this.state.svgWidth} providerName={prov}
					    callbackFn={this.fetchDates} dotClickFn={this.onDotClick} /> ),
		       <div className='provider-nav-spacer-bottom' key='1' />
		  ] : null }
	       </Providers>
	    </div>
	      <DiscoveryModal isOpen={this.state.modalIsOpen} modalName={this.state.modalName}
			      onClose={ name => this.setState({ modalName: '', modalIsOpen: false })} callbackFn={this.fetchModalData} />
	    <PageFooter context={this.state.dotClickContext} />  
	 </div>
      );
   }
}
