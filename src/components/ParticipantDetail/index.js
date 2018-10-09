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
      details: null,		    // Will be set to an instance of FhirTransform
      allDates: null,
      minDate: '',		    // Earliest date we have data for this participant
      startDate: '',		    // Jan 1 of minDate's year
      maxDate: '',		    // Latest date we have data for this participant
      endDate: '',		    // Dec 31 of maxDate's year
      minActivePos: 0,		    // Earliest normalized date/position allowed by TimeWidget
      maxActivePos: 1,		    // Latest normalized date/position allowed by TimeWidget
      searchRefs: [],		    // Search results to highlight
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

   onKeydown = (event) => {
      if (this.state.dotClickContext && event.key === 'Enter') {
	 // Open content panel with prior dot click context
	 this.setState({ dotClickContext: Object.assign({}, this.state.dotClickContext) });
      }
   }

   componentDidMount() {
      this.updateSvgWidth();
      window.addEventListener('resize', this.updateSvgWidth);       
      window.addEventListener('keydown', this.onKeydown);

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
      window.removeEventListener('keydown', this.onKeydown);
   }

   // Remove nulls and duplicates from dateArray, then sort in ascending order
   cleanDates(dateArray) {
      return dateArray.filter((value, index) => value !== null && dateArray.indexOf(value) === index)
	   	      .sort((a, b) => new Date(b) - new Date(a)).reverse();
//      let res = dateArray.filter((value, index) => value !== null && dateArray.indexOf(value) === index)
//	   	      .sort((a, b) => new Date(b) - new Date(a)).reverse();
//      return res;
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
	    return '?????';	// TODO
      }
   }

   //
   // Search callback function
   //
   searchCallback = this.searchCallback.bind(this);
   searchCallback(refs) {
      let plusRefs = refs.map(ref => {
	 ref.position = this.state.allDates.find(elt => elt.date === ref.date).position;
	 return ref;
      });
      this.setState({searchRefs: plusRefs});
   }

   //
   // Callback function to record category/provider enable/disable
   //   parent:		'Category', 'Provider'
   //   rowName:	<category-name>/<provider-name>
   //   isEnabled:	the current state to record
   //
   setEnabled = this.setEnabled.bind(this);
   setEnabled(parent, rowName, isEnabled) {
      if (parent === 'Category') {
	 if (this.state.catsEnabled[rowName] !== isEnabled) {
	    let catsEnabled = Object.assign({}, this.state.catsEnabled, {[rowName]: isEnabled})
	    this.setState({catsEnabled: catsEnabled});
	 }
      } else {
	 // Provider
	 if (this.state.provsEnabled[rowName] !== isEnabled) {
	    let provsEnabled = Object.assign({}, this.state.provsEnabled, {[rowName]: isEnabled})
	    this.setState({provsEnabled: provsEnabled});
	 }
      }
   }

   //
   // Is 'dot' in the TimeWidget active range?
   //
   isActiveTimeWidget = this.isActiveTimeWidget.bind(this);
   isActiveTimeWidget(dot) {
      return dot.position >= this.state.minActivePos && dot.position <= this.state.maxActivePos;
   }

   //
   // Concatenate n arrays, skipping null elements
   //
   combine() {
      let res = [];
      for (let i = 0; i < arguments.length; i++) {
	 if (arguments[i]) {
	    res = res.concat(arguments[i]);
	 }
      }
      return res;
   }

   //
   // Include a copy of this dot in result array and mark with 'dotType'
   //
   includeDot(result, dot, dotType) {
      result.push(Object.assign({dotType: dotType}, dot));
      return result;
  }

   //
   // Callback function for this component's state, returning the requested array of position+date+dotType objects
   //	parent:		'CategoryRollup', 'Category', 'ProviderRollup', 'Provider'
   //	rowName:	<category-name>/<provider-name>
   //   isEnabled:	'true' = render normally, 'false' = active dots become inactive
   //
   // TODO: complete after TimeWidget, search are finished
   fetchDotPositions = this.fetchDotPositions.bind(this);
   fetchDotPositions(parent, rowName, isEnabled, fetchAll) {
      if (!this.state.details || this.state.allDates.length === 0) {
	 return [];
      } else {
	 let { startDate, endDate, allDates, searchRefs, dotClickContext } = this.state;
	 let matchContext = dotClickContext && dotClickContext.parent === parent && dotClickContext.rowName === rowName;
	 let inactiveHighlightDots = matchContext && allDates.reduce((res, elt) =>
							 ((!isEnabled || !this.isActiveTimeWidget(elt)) && elt.position === dotClickContext.position)
								? this.includeDot(res, elt, 'inactive-highlight') : res, []);
	
	 let activeHighlightDots = matchContext && allDates.reduce((res, elt) =>
							 (isEnabled && this.isActiveTimeWidget(elt) && elt.position === dotClickContext.position)
								? this.includeDot(res, elt, 'active-highlight') : res, []);

	 let inactiveHighlightSearchDots = matchContext && searchRefs.reduce((res, elt) =>
							 ((!isEnabled || !this.isActiveTimeWidget(elt)) && elt.position === dotClickContext.position)
								? this.includeDot(res, elt, 'inactive-highlight-search') : res, []);

	 let activeHighlightSearchDots = matchContext && searchRefs.reduce((res, elt) =>
							 (isEnabled && this.isActiveTimeWidget(elt) && elt.position === dotClickContext.position)
								? this.includeDot(res, elt, 'active-highlight-search') : res, []);

	 let highlightDots = this.combine(inactiveHighlightDots, activeHighlightDots, inactiveHighlightSearchDots, activeHighlightSearchDots);

	 switch (parent) {
	    case 'ProviderRollup':
            case 'CategoryRollup':
	       if (fetchAll) {
		  return allDates;
	       } else {
		  return this.combine(allDates.reduce((res, elt) => !this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'inactive') : res, []),
				      allDates.reduce((res, elt) => this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'active') : res, []),
				      searchRefs.reduce((res, elt) => !this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'inactive-search') : res, []),
				      searchRefs.reduce((res, elt) => this.isActiveTimeWidget(elt) ? this.includeDot(res, elt, 'active-search') : res, []),
				      highlightDots);
	       }

	    case 'Provider':
	       let provDates = this.cleanDates(this.state.details.pathItem(`[*provider=${rowName}].itemDate`, this.queryOptions));
	       let normProvDates = this.normalizeDates(provDates, startDate, endDate);
	       let provDateObjs = provDates.map((date, index) => ({position: normProvDates[index], date: date}));
	       let provSearchRefs = this.state.searchRefs.filter( elt => elt.provider === rowName);
	       if (fetchAll) {
		  return provDateObjs;
	       } else {
		  return this.combine(provDateObjs.reduce((res, elt) => !isEnabled || !this.isActiveTimeWidget(elt)
									   ? this.includeDot(res, elt, 'inactive') : res, []),
				      provDateObjs.reduce((res, elt) => isEnabled && this.isActiveTimeWidget(elt)
									   ? this.includeDot(res, elt, 'active') : res, []),
				      provSearchRefs.reduce((res, elt) => !isEnabled || !this.isActiveTimeWidget(elt)
									   ? this.includeDot(res, elt, 'inactive-search') : res, []),
				      provSearchRefs.reduce((res, elt) => isEnabled && this.isActiveTimeWidget(elt)
									   ? this.includeDot(res, elt, 'active-search') : res, []),
				      highlightDots);
	       }

            case 'Category':
	       let catDates = this.cleanDates(this.state.details.pathItem(`[*category=${rowName}].itemDate`, this.queryOptions));
	       let normCatDates = this.normalizeDates(catDates, startDate, endDate);
	       let catDateObjs = catDates.map((date, index) => ({position: normCatDates[index], date: date}));
	       let catSearchRefs = this.state.searchRefs.filter( elt => elt.category === rowName);
	       if (fetchAll) {
		  return catDateObjs;
	       } else {
		  return this.combine(catDateObjs.reduce((res, elt) => !isEnabled || !this.isActiveTimeWidget(elt)
									  ? this.includeDot(res, elt, 'inactive') : res, []),
				      catDateObjs.reduce((res, elt) => isEnabled && this.isActiveTimeWidget(elt)
									  ? this.includeDot(res, elt, 'active') : res, []),
				      catSearchRefs.reduce((res, elt) => !isEnabled || !this.isActiveTimeWidget(elt)
									  ? this.includeDot(res, elt, 'inactive-search') : res, []),
				      catSearchRefs.reduce((res, elt) => isEnabled && this.isActiveTimeWidget(elt)
									  ? this.includeDot(res, elt, 'active-search') : res, []),
				      highlightDots);
	       }

	    default:   // TimeWidget
	       return this.combine(allDates.reduce((res, elt) => !this.isActiveTimeWidget(elt)
									  ? this.includeDot(res, elt, 'inactive') : res, []),
				   allDates.reduce((res, elt) => this.isActiveTimeWidget(elt)
									  ? this.includeDot(res, elt, 'active') : res, []));
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
	   return this.state.details.pathItem(`[*itemDate=${date}]`);

       case 'ProviderRollup':
	   // Return all resources for enabled providers matching the clicked date
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
//      return {minDate: this.state.allDates.find(elt => elt.position >= minActivePos).date,
//	      maxDate: this.state.allDates.slice().reverse().find(elt => elt.position <= maxActivePos).date};
   }

   //
   // Handle ContentPanel next/prev button clicks
   //   direction:	'next' or 'prev'
   // Returns true if the button should be enabled, else false
   //
   onNextPrevClick = this.onNextPrevClick.bind(this);
   onNextPrevClick (direction) {
      let newContext = this.state.dotClickContext;
      let dates = this.fetchDotPositions(newContext.parent, newContext.rowName, true, true);
      let currDateIndex = dates.findIndex( elt => elt.date === newContext.date);
      let ret = false;

      if (currDateIndex === -1) {
	 // TODO: an error!
	 return false;
      }

      // Determine next/prev date
      if (direction === 'next') {
	  if (currDateIndex === dates.length-1) {
	     // No 'next' -- do nothing
	     return false;
	  } else {
	     newContext.date = dates[currDateIndex+1].date;
	     newContext.position = dates[currDateIndex+1].position;
	     ret = currDateIndex+1 < dates.length-1;
	  }
      } else {
	 // 'prev'
	 if (currDateIndex === 0) {
	    // No 'prev' -- do nothing
	    return false;
	 } else {
	    newContext.date = dates[currDateIndex-1].date;
	    newContext.position = dates[currDateIndex-1].position;
	    ret = currDateIndex-1 > 0;
	 }
      }

      // Fetch new/appropriate data
      newContext.data = this.fetchDataForDot(newContext.parent, newContext.rowName, newContext.date);

      // Set state accordingly
      this.setState({ dotClickContext: newContext });

      return ret;
   }

   //
   // Handle dot clicks
   //   context = {
   //      parent:	   'CategoryRollup', 'Category', 'ProviderRollup', 'Provider'
   //      rowName:	   <category-name>/<provider-name>
   //      dotType:	   type of the clicked dot (added below)
   //      minDate:	   date of the first dot for this row
   //      maxDate:	   date of the last dot for this row
   //      date:	   date of the clicked dot (added below)
   //      position:	   position of the clicked dot (added below)
   //	   data:	   data associated with the clicked dot (added below)
   //   } 
   //   date:		   date of the clicked dot
   //   dotType:	   'active', 'inactive', 'active-highlight', 'inactive-highlight', 'active-highlight-search', 'inactive-highlight-search'
   //
   onDotClick = (context, date, dotType) => {
      const rowDates = this.fetchDotPositions(context.parent, context.rowName, true, true);
      const position = rowDates.find(elt => elt.date === date).position;

      context.dotType = this.updateDotType(dotType, position, false);
      context.minDate = rowDates[0].date;
      context.maxDate = rowDates[rowDates.length-1].date;
      context.date = date;
      context.position = position;
      context.data = this.fetchDataForDot(context.parent, context.rowName, context.date);

      this.setState({ dotClickContext: context });
   }

   updateDotType(dotType, position, forceSearch) {
      let isActivePos = position >= this.state.minActivePos && position <= this.state.maxActivePos;
      let isSearch = dotType.includes('search') || forceSearch;
      let parts = [];
      parts.push(isActivePos ? 'active' : 'inactive');
      parts.push('highlight');
      if (isSearch) {
	 parts.push('search');
      }
      return parts.join('-');
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
			   modalFn={ name => this.setState({ modalName: name, modalIsOpen: true })}
			   searchData={this.state.details && this.state.details.transformed}
			   searchCallback={this.searchCallback} />
	       <TimeWidget minDate={this.state.minDate} maxDate={this.state.maxDate}
			   timelineWidth={this.state.svgWidth} setLeftRightFn={this.setLeftRight} dotPositionsFn={this.fetchDotPositions} />
	    </div>
	    <div className='participant-detail-categories-and-providers'>
	       <Categories>
	          <CategoryRollup key='rollup' svgWidth={this.state.svgWidth}
			          dotPositionsFn={this.fetchDotPositions} dotClickFn={this.onDotClick} expansionFn={this.onExpandContract} />
		  {/* TODO: change spacer class names to have 'participant-detail-' prefix */}
	          { this.state.catsExpanded ? [
		       <div className='category-nav-spacer-top' key='0' />,
	               this.categories.map(
			  cat => <Category key={cat} svgWidth={this.state.svgWidth} categoryName={cat}
					   dotPositionsFn={this.fetchDotPositions} dotClickFn={this.onDotClick} enabledFn={this.setEnabled} /> ),
		       <div className='category-nav-spacer-bottom' key='1' />
		  ] : null }
	       </Categories>
	       { this.providers.length > 1 ?
		 <Providers>
	            <ProviderRollup key='rollup' svgWidth={this.state.svgWidth}
				    dotPositionsFn={this.fetchDotPositions} dotClickFn={this.onDotClick} expansionFn={this.onExpandContract} />
		    {/* TODO: change spacer class names to have 'participant-detail-' prefix */}
		    { this.state.provsExpanded ? [
		         <div className='provider-nav-spacer-top' key='0' />,
		         this.providers.map(
			    prov => <Provider key={prov} svgWidth={this.state.svgWidth} providerName={prov}
					      dotPositionsFn={this.fetchDotPositions} dotClickFn={this.onDotClick} enabledFn={this.setEnabled} /> ),
		         <div className='provider-nav-spacer-bottom' key='1' />
		    ] : null }
	         </Providers> :
		 <div className='single-provider'>
		    <div className='single-provider-label'>Provider</div>
		    <div className='single-provider-name'>{this.providers[0]}</div>
		 </div>
	       }
	    </div>
	    <DiscoveryModal isOpen={this.state.modalIsOpen} modalName={this.state.modalName}
			    onClose={ name => this.setState({ modalName: '', modalIsOpen: false })} callbackFn={this.fetchModalData} />
	    <PageFooter context={this.state.dotClickContext} catsEnabled={this.state.catsEnabled} provsEnabled={this.state.provsEnabled}
			nextPrevFn={this.onNextPrevClick} />  
	 </div>
      );
   }
}
