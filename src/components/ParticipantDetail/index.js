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
      minDate: 0,		    // Earliest date we have data for this participant
      startDate: 0,		    // Jan 1 of minDate's year
      maxDate: 0,		    // Latest date we have data for this participant
      endDate: 0,		    // Dec 31 of maxDate's year
      minActivePos: 0,		    // Earliest normalized date/position allowed by TimeWidget
      maxActivePos: 1,		    // Latest normalized date/position allowed by TimeWidget
      isLoading: false,
      fetchError: null,		    // Possible axios error object
      catsExpanded: true,
      catsEnabled: {},		    // Enabled status of categories
      provsExpanded: true,
      provsEnabled: {},		    // Enabled status of providers
      modalName: '',
      modalIsOpen: false,
      dotClickContext: null,	    // The current dot
      svgWidth: '0'
   }

   //
   // Inactive dot handling
   //
   //   inactiveLocked: false
   //      Clicking on an inactive dot displays its data
   //      Next/prev from a dot can result in displaying an inactive dot
   //
   //   inactiveLocked: true
   //      Clicking on an inactive dot does nothing
   //      Next/prev will never display an inactive dot
   //
   get inactiveLocked () {
      return true;
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
      if (this.state.details) {
         for (let elt of this.state.details.transformed) {
	    if (elt.category !== 'Patient') {
	       // Add the found category
	       cats[elt.category] = null;
	    }
	 }
      }
      return Object.keys(cats).sort();
   }

   // Return sorted array of all provider names for this participant
   get providers() {
      let provs = {};
      if (this.state.details) {
	 for (let elt of this.state.details.transformed) {
	    // Add the found provider
	    provs[elt.provider] = null;
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
   // Callback function to record category/provider enable/disable
   //   parent:	'Category', 'Provider'
   //   rowName:	<category-name>/<provider-name>
   //	 isEnabled:	the current state to record
   //
   setEnabled = this.setEnabled.bind(this);
   setEnabled(parent, rowName, isEnabled) {
      if (parent === 'Category') {
	 if (this.state.catsEnabled[rowName] !== isEnabled) {
	    let catsEnabled = this.state.catsEnabled;
	    catsEnabled[rowName] = isEnabled;
	    this.setState({catsEnabled: catsEnabled});
//	    console.log(JSON.stringify(catsEnabled, null, 3));

	    if (this.state.dotClickContext) {
	       let newContext = this.state.dotClickContext;
	       newContext.data = this.fetchDataForDot(newContext.parent, newContext.rowName, newContext.date);
	       this.setState({dotClickContext: newContext});
	    }
	 }
      } else {
	 // Provider
	 if (this.state.provsEnabled[rowName] !== isEnabled) {
	    let provsEnabled = this.state.provsEnabled;
	    provsEnabled[rowName] = isEnabled;
	    this.setState({provsEnabled: provsEnabled});
//	    console.log(JSON.stringify(provsEnabled, null, 3));

	    if (this.state.dotClickContext) {
	       let newContext = this.state.dotClickContext;
	       newContext.data = this.fetchDataForDot(newContext.parent, newContext.rowName, newContext.date);
	       this.setState({dotClickContext: newContext});
	    }
	 }
      }
   }

   //
   // Callback function for this component's state, returning the requested array of position+date objects
   //	parent:		'CategoryRollup', 'Category', 'ProviderRollup', 'Provider'
   //	rowName:	<category-name>/<provider-name>
   //   isEnabled:	'true' = render normally, 'false' = active dots become inactive
   //	dotType:	'active', 'inactive', 'highlight', 'all'
   //
   // TODO: complete after TimeWidget, search are finished
   fetchDates = this.fetchDates.bind(this);
   fetchDates(parent, rowName, isEnabled, dotType) {
      if (!this.state.details) {
	 return [];
      } else {
	 let { startDate, endDate, allDates } = this.state;
	 if (allDates.length === 0) {
	    return [];
	 } else {
	     if (dotType === 'highlight') {
		if (this.state.dotClickContext && this.state.dotClickContext.parent === parent && this.state.dotClickContext.rowName === rowName) {
		   return [allDates.find(elt => elt.date === this.state.dotClickContext.date)];
		} else {
		   return [];
		}
	     }

	     switch (parent) {
	        case 'ProviderRollup':
                case 'CategoryRollup':
	           switch (dotType) {
	              case 'inactive':
		         return allDates.filter(elt => elt.position < this.state.minActivePos || elt.position > this.state.maxActivePos);
		      case 'active':
		         return allDates.filter(elt => elt.position >= this.state.minActivePos && elt.position <= this.state.maxActivePos);
	              default:  // 'all'
		         return allDates;
		   }
	        case 'Provider':
	           let provDates = this.cleanDates(this.state.details.pathItem(`[*provider=${rowName}].itemDate`, this.queryOptions));
	           let normProvDates = this.normalizeDates(provDates, startDate, endDate);
	           let allProvDates = provDates.map((date, index) => ({position: normProvDates[index], date: date}));
		   switch (dotType) {
	              case 'inactive':
		         return isEnabled ? allProvDates.filter(elt => elt.position < this.state.minActivePos || elt.position > this.state.maxActivePos)
					  : allProvDates;
		      case 'active':
		         return isEnabled ? allProvDates.filter(elt => elt.position >= this.state.minActivePos && elt.position <= this.state.maxActivePos)
					  : [];
		      default:  // 'all'
		         return allProvDates;
		   }
                case 'Category':
	           let catDates = this.cleanDates(this.state.details.pathItem(`[*category=${rowName}].itemDate`, this.queryOptions));
	           let normCatDates = this.normalizeDates(catDates, startDate, endDate);
	           let allCatDates = catDates.map((date, index) => ({position: normCatDates[index], date: date}));
		   switch (dotType) {
	              case 'inactive':
		         return isEnabled ? allCatDates.filter(elt => elt.position < this.state.minActivePos || elt.position > this.state.maxActivePos)
					  : allCatDates;
		      case 'active':
		         return isEnabled ? allCatDates.filter(elt => elt.position >= this.state.minActivePos && elt.position <= this.state.maxActivePos)
					  : [];
		      default:  // 'all'
		         return allCatDates;
		   }
	        default:   // TimeWidget
		 switch (dotType) {
		    case 'inactive':
		       return allDates.filter(elt => elt.position < this.state.minActivePos || elt.position > this.state.maxActivePos)
		    default: // 'active'
		       return allDates.filter(elt => elt.position >= this.state.minActivePos && elt.position <= this.state.maxActivePos)
		 }
	     }
	 }
      }
   }

   //
   // Return data for the clicked dot
   //    parent:	'CategoryRollup', 'Category', 'ProviderRollup', 'Provider'
   //    rowName:	<category-name>/<provider-name>
   //    date:		date of the clicked dot
   //
   fetchDataForDot = (parent, rowName, date) => {
       switch (parent) {
       case 'CategoryRollup':
	   // Return all resources for enabled categories matching the clicked date
	   return this.state.details.pathItem(`[*itemDate=${date}]`).filter(elt => this.state.catsEnabled[elt.category] === undefined ||
										   this.state.catsEnabled[elt.category]);

       case 'ProviderRollup':
	   // Return all resources for enabled providers matching the clicked date
	   return this.state.details.pathItem(`[*itemDate=${date}]`).filter(elt => this.state.provsEnabled[elt.provider] === undefined ||
										   this.state.provsEnabled[elt.provider]);
	   
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
   // Handle TimeWidget left/right thumb movement
   //   minDatePos:	location [0..1] of left thumb
   //   maxDatePos:	location [0..1] of right thumb
   //
   setLeftRight = this.setLeftRight.bind(this);
   setLeftRight(minActivePos, maxActivePos) {
//      console.log('minPos: ' + minActivePos + '  maxPos: ' + maxActivePos);
      this.setState({ minActivePos: minActivePos,
		      maxActivePos: maxActivePos });
      // Return equivalent min/max dates
      return {minDate: this.state.allDates.find(elt => elt.position >= minActivePos).date,
	      maxDate: this.state.allDates.slice().reverse().find(elt => elt.position <= maxActivePos).date};
   }

   //
   // Handle ContentPanel next/prev button clicks
   //   direction:	'next' or 'prev'
   //
   onNextPrevClick = (direction) => {
      let newContext = this.state.dotClickContext;
      let dates = this.fetchDates(newContext.parent, newContext.rowName, true, 'all');
      let currDateIndex = dates.findIndex( elt => elt.date === newContext.date);

      if (currDateIndex === -1) {
	 // TODO: an error!
	 return;
      }

      // Determine next/prev date
      if (direction === 'next') {
	  if (currDateIndex === dates.length-1) {
	     // No 'next' -- do nothing
	     return;
	  } else {
	     newContext.date = dates[currDateIndex+1].date;
	  }
      } else {
	 // 'prev'
	 if (currDateIndex === 0) {
	    // No 'prev' -- do nothing
	    return;
	 } else {
	    newContext.date = dates[currDateIndex-1].date;
	 }
      }

      // Fetch new/appropriate data
      newContext.data = this.fetchDataForDot(newContext.parent, newContext.rowName, newContext.date);

      // Set state accordingly
      this.setState({ dotClickContext: newContext });
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
      context.dotType = 'highlight';
      context.data = this.fetchDataForDot(context.parent, context.rowName, context.date);
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
	       <TimeWidget minDate={this.state.minDate} maxDate={this.state.maxDate}
			   timelineWidth={this.state.svgWidth} setLeftRightFn={this.setLeftRight} callbackFn={this.fetchDates} />
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
					   callbackFn={this.fetchDates} dotClickFn={this.onDotClick} enabledFn={this.setEnabled} /> ),
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
					    callbackFn={this.fetchDates} dotClickFn={this.onDotClick} enabledFn={this.setEnabled} /> ),
		       <div className='provider-nav-spacer-bottom' key='1' />
		  ] : null }
	       </Providers>
	    </div>
	    <DiscoveryModal isOpen={this.state.modalIsOpen} modalName={this.state.modalName}
			    onClose={ name => this.setState({ modalName: '', modalIsOpen: false })} callbackFn={this.fetchModalData} />
	    <PageFooter context={this.state.dotClickContext} nextPrevFn={this.onNextPrevClick} />  
	 </div>
      );
   }
}
