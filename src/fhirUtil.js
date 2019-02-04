import React from 'react';

import './components/ContentPanel/ContentPanel.css';
import FhirTransform from './FhirTransform.js';
import { stringCompare, formatDate, formatDPs, isValid, titleCase } from './util.js';
import TimeSeries from './components/TimeSeries';

function dropFinalDigits(str) {
   let firstDigitIndex = str.search(/[0-9]/);
   return firstDigitIndex > 0 ? str.substring(0, firstDigitIndex) : str;
}

/*
 * Extracts a name string from the FHIR patient name object.
 *
 * @param {Object} FHIR patient name object
 * @returns {String} Patient's name, or an empty string
 */
export function formatPatientName(name) {
   if (!name) {
      return '';
   }

   let nameElt = Array.isArray(name) ? name[0] : name;
   if (!nameElt) {
      return '';
   }

   let prefix = Array.isArray(nameElt.prefix) ? nameElt.prefix : [ nameElt.prefix ];
   let given  = Array.isArray(nameElt.given ) ? nameElt.given  : [ nameElt.given  ];
   let family = Array.isArray(nameElt.family) ? nameElt.family : [ nameElt.family ];
   let suffix = Array.isArray(nameElt.suffix) ? nameElt.suffix : [ nameElt.suffix ];

   return [
      prefix.map(elt => String(elt || '').trim()).join(' '),
      dropFinalDigits(given.map (elt => String(elt || '').trim()).join(' ')),
      dropFinalDigits(family.map(elt => String(elt || '').trim()).join(' ')),
      suffix.map(elt => String(elt || '').trim()).join(' ')
   ].filter(Boolean).join(' ').replace( /\s\s+/g, ' ' );
}

export function formatPatientAddress(address) {
   if (!address) {
      return '';
   }

   let addr = Array.isArray(address) ? address[0] : address;
   if (!addr) {
      return '';
   }

   let line = Array.isArray(addr.line) ? addr.line : [ addr.line ];

   return line.map(elt => String(elt || '').trim()).join('\n') + '\n'
	+ addr.city + ', ' + addr.state + ' ' + addr.postalCode + '\n'
	+ addr.country;
}

export function formatPatientMRN(identifier, maxLength) {
   let identElts = Array.isArray(identifier) ? identifier : [ identifier ];
   for (let elt of identElts) {
      try {
	 if (elt.type.coding[0].code === 'MR') {
	    return maxLength === 0 || elt.value.length <= maxLength ? elt.value : '...' + elt.value.substring(elt.value.length - maxLength);
	 }
      } catch (e) {};
   }

   return 'Unknown';
}

export function renderAllergies(matchingData, className) {
   let found = [];
   for (const elt of matchingData) {
      try {
	  found.push({provider: elt.provider, code: elt.data.code, clinicalStatus: elt.data.clinicalStatus,
		      verificationStatus: elt.data.verificationStatus, type: elt.data.type, category: elt.data.category,
		      criticality: elt.data.criticality, substance: elt.data.substance, reaction: elt.data.reaction});
      } catch (e) {}
   }

   if (found.length > 0) {
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    { elt.code && <div className={className+'-display'}>{elt.code.coding[0].display}</div> }

	    <div className={className+'-provider-label'}>Provider</div> 
	    <div className={className+'-provider-value'}>{elt.provider}</div> 

	    { elt.clinicalStatus && <div className={className+'-clinical-status-label'}>Clinical Status</div> }
	    { elt.clinicalStatus && <div className={className+'-clinical-status-value'}>{elt.clinicalStatus}</div> }
	    { elt.verificationStatus && <div className={className+'-verification-status-label'}>Verification Status</div> }
	    { elt.verificationStatus && <div className={className+'-verification-status-value'}>{elt.verificationStatus}</div> }

	    { elt.type && <div className={className+'-type-label'}>Type</div> }
	    { elt.type && <div className={className+'-type-value'}>{elt.type}</div> }
	    { elt.category && <div className={className+'-category-label'}>Category</div> }
	    { elt.category && <div className={className+'-category-value'}>{elt.category}</div> }
	    { elt.criticality && <div className={className+'-criticality-label'}>Criticality</div> }
	    { elt.criticality && <div className={className+'-criticality-value'}>{elt.criticality}</div> }

	    { elt.substance && <div className={className+'-substance-label'}>Substance</div> }
	    { elt.substance && <div className={className+'-substance-value'}>{elt.substance.coding[0].display}</div> }

	    { elt.reaction && <div className={className+'-reaction-label'}>Reaction</div> }
	    { elt.reaction && <div className={className+'-reaction-value'}>{elt.reaction[0].manifestation[0].coding[0].display}</div> }
	 </div>
      );
   } else {
      return null;
   }
}

//
// renderDisplay()
//
// Used by Conditions, DocumentReferences, MedsAdministration, MedsStatement, Procedures
//
export function renderDisplay(matchingData, className) {
   let found = [];
   for (const elt of matchingData) {
      try {
	  found.push({provider: elt.provider, display: elt.data.code.coding[0].display, status: elt.data.status, clinicalStatus: elt.data.clinicalStatus,
		      verificationStatus: elt.data.verificationStatus, reason: elt.data.reasonReference, valueQuantity: elt.data.valueQuantity});
      } catch (e) {}
   }

   if (found.length > 0) {
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className={className+'-display'}>{elt.display}</div>

	    { elt.valueQuantity && <div className={className+'-value-label'}>Result</div> }
	    { elt.valueQuantity && <div className={className+'-value-value'}>{elt.valueQuantity.value}</div> }
	    { elt.valueQuantity && <div className={className+'-value-unit'}>{elt.valueQuantity.unit}</div> }

	    { isValid(elt, e => e.reason[0].code) && <div className={className+'-reason-label'}>Reason</div> }
	    { isValid(elt, e => e.reason[0].code) && <div className={className+'-reason-value'}>{elt.reason[0].code.coding[0].display}</div> } 
	    { isValid(elt, e => e.reason[0].onsetDateTime) && <div className={className+'-onset-label'}>Onset</div> }
	    { isValid(elt, e => e.reason[0].onsetDateTime) &&
		<div className={className+'-onset-value'}>{formatDate(elt.reason[0].onsetDateTime,false,false)}</div> }
	    { isValid(elt, e => e.reason[0].abatementDateTime) && <div className={className+'-abatement-label'}>Abatement</div> }
	    { isValid(elt, e => e.reason[0].abatementDateTime) &&
	        <div className={className+'-abatement-value'}>{formatDate(elt.reason[0].abatementDateTime,false,false)}</div> }
	    { isValid(elt, e => e.reason[0].assertedDate) && <div className={className+'-asserted-label'}>Asserted</div> }
	    { isValid(elt, e => e.reason[0].assertedDate) &&
	        <div className={className+'-asserted-value'}>{formatDate(elt.reason[0].assertedDate,false,false)}</div> }

	    <div className={className+'-provider-label'}>Provider</div> 
	    <div className={className+'-provider-value'}>{elt.provider}</div> 

	    { elt.status && <div className={className+'-status-label'}>Status</div> }
	    { elt.status && <div className={className+'-status-value'}>{elt.status}</div> }

	    { elt.clinicalStatus && <div className={className+'-clinical-status-label'}>Clinical Status</div> }
	    { elt.clinicalStatus && <div className={className+'-clinical-status-value'}>{elt.clinicalStatus}</div> }

	    { elt.verificationStatus && <div className={className+'-verification-status-label'}>Verification Status</div> }
	    { elt.verificationStatus && <div className={className+'-verification-status-value'}>{elt.verificationStatus}</div> }
	 </div>
      );
   } else {
      return null;
   }
}

export function renderImmunizations(matchingData, className) {
   let found = [];
   for (const elt of matchingData) {
      try {
	  found.push({provider: elt.provider, display: elt.data.vaccineCode.coding[0].display, status: elt.data.status,
		      notGiven: elt.data.notGiven, wasNotGiven: elt.data.wasNotGiven,
		      reported: elt.data.reported, primarySource: elt.data.primarySource});
      } catch (e) {}
   }

   if (found.length > 0) {
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className={className+'-display'}>{elt.display}</div>

	    { ((elt.notGiven !== undefined) || (elt.wasNotGiven !== undefined)) && <div className={className+'-given-label'}>Given</div> }
	    { elt.notGiven !== undefined && <div className={className+'-given-value'}>{elt.notGiven ? 'false' : 'true'}</div> }
	    { elt.wasNotGiven !== undefined && <div className={className+'-given-value'}>{elt.wasNotGiven ? 'false' : 'true'}</div> }
	    { elt.reported !== undefined && <div className={className+'-reported-label'}>Reported</div> }
	    { elt.reported !== undefined && <div className={className+'-reported-value'}>{elt.reported ? 'true' : 'false'}</div> }
	    { elt.primarySource !== undefined && <div className={className+'-primary-label'}>Primary Source</div> }
	    { elt.primarySource !== undefined && <div className={className+'-primary-value'}>{elt.primarySource ? 'true' : 'false'}</div> }

	    <div className={className+'-provider-label'}>Provider</div> 
	    <div className={className+'-provider-value'}>{elt.provider}</div> 

	    { elt.status && <div className={className+'-status-label'}>Status</div> }
	    { elt.status && <div className={className+'-status-value'}>{elt.status}</div> }
	 </div>
      );
   } else {
      return null;
   }
}

export function renderLabs(matchingData, className, resources) {
   // Collect info to display from matchingData
   let found = [];
   for (const elt of matchingData) {
      try {
	 found.push({provider: elt.provider, date:elt.itemDate instanceof Date ? elt.itemDate : new Date(elt.itemDate),
		     display: elt.data.code.coding[0].display,
		     valueQuantity: elt.data.valueQuantity,
		     valueString: elt.data.valueString,
		     referenceRange: elt.data.referenceRange,
		     status:elt.data.status});
      } catch (e) {};
   }

   // Collect full set of series (by display string) to graph from resources
   let series = {};
   let match = FhirTransform.getPathItem(resources.transformed, '[*category=Lab Results]');
   for (const elt of match) {
      try {
	 const displayStr = elt.data.code.coding[0].display;
	 const xVal = elt.itemDate instanceof Date ? elt.itemDate : new Date(elt.itemDate);
	 const yVal = elt.data.valueQuantity.value;
	 if (series.hasOwnProperty(displayStr)) {
	    // Add to series
	    series[displayStr].push({x: xVal, y: yVal});
	 } else {
	    // New series
	    series[displayStr] = [{x: xVal, y: yVal}];
	 }
      } catch (e) {};
   }

   if (found.length > 0) {
      return found.map((elt, index) => {
	 let highlightValue = false;
	 if (elt.referenceRange) {
	    let value = elt.valueQuantity.value;
	    let valueUnits = elt.valueQuantity.unit;

	    let lowValue = elt.referenceRange[0].low.value;
	    let lowUnits = elt.referenceRange[0].low.unit;

	    let highValue = elt.referenceRange[0].high.value;
	    let highUnits = elt.referenceRange[0].high.unit;

	    // Highlight the measured value if outside of the reference range
	    highlightValue = valueUnits === lowUnits && valueUnits === highUnits && (value < lowValue || value > highValue);
	 }

	 let sortedSeries = series[elt.display] && series[elt.display].sort((a, b) => stringCompare(a.x.toISOString(), b.x.toISOString()));
	 let thisValue = elt.valueQuantity ? elt.valueQuantity.value : null;

	 return (
	    <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	       <div className={className+'-display'}>{elt.display}</div>

	       { elt.valueQuantity && <div className={className+(highlightValue?'-value-highlight':'-value')}>{formatDPs(elt.valueQuantity.value, 1)}</div> }
	       { elt.valueQuantity && <div className={className+'-unit'}>{elt.valueQuantity.unit}</div> }

	       { elt.valueString && <div className={className+'-value-label'}>Value</div> }
	       { elt.valueString && <div className={className+'-value-string'}>{elt.valueString}</div> }

	       { sortedSeries && <TimeSeries className={className} data={sortedSeries} highlights={[{x:elt.date, y:thisValue}]} /> }

	       { elt.referenceRange && <div className={className+'-ref-label1'}>{elt.referenceRange[0].meaning.coding[0].display}</div> }
	       { elt.referenceRange && <div className={className+'-ref-value1'}>{elt.referenceRange[0].low.value}</div> }
	       { elt.referenceRange && elt.referenceRange[0].low.unit !== elt.referenceRange[0].high.unit &&
	                            <div className={className+'-ref-unit1'}>{elt.referenceRange[0].low.unit}</div> }
	       { elt.referenceRange && <div className={className+'-ref-label2'}>-</div> }
	       { elt.referenceRange && <div className={className+'-ref-value2'}>{elt.referenceRange[0].high.value}</div> }
	       { elt.referenceRange && <div className={className+'-ref-unit2'}>{elt.referenceRange[0].high.unit}</div> }

	       <div className={className+'-provider-label'}>Provider</div> 
	       <div className={className+'-provider-value'}>{elt.provider}</div> 

	       { elt.status && <div className={className+'-status-label'}>Status</div> }
	       { elt.status && <div className={className+'-status-value'}>{elt.status}</div> }
	    </div>
	 )}
      );
   } else {
      return null;
   }
}

//
// renderMeds()
//
// Used by MedsDispensed, MedsRequested
//
export function renderMeds(matchingData, className) {
   let found = [];
   for (const elt of matchingData) {
      try {
	  found.push({provider: elt.provider, display:elt.data.medicationCodeableConcept.coding[0].display, quantity:elt.data.quantity,
		      daysSupply:elt.data.daysSupply, dosageInstruction:elt.data.dosageInstruction, dispenseRequest:elt.data.dispenseRequest,
		      status:elt.data.status, reason:elt.data.reasonReference});
      } catch (e) {};
   }

   if (found.length > 0) {
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className={className+'-display'}>{elt.display}</div>

	    { isValid(elt, e => e.reason[0].code) && <div className={className+'-reason-label'}>Reason</div> }
	    { isValid(elt, e => e.reason[0].code) && <div className={className+'-reason-value'}>{elt.reason[0].code.coding[0].display}</div> } 
	    { isValid(elt, e => e.reason[0].onsetDateTime) && <div className={className+'-onset-label'}>Onset</div> }
	    { isValid(elt, e => e.reason[0].onsetDateTime) &&
		<div className={className+'-onset-value'}>{formatDate(elt.reason[0].onsetDateTime,false,false)}</div> }
	    { isValid(elt, e => e.reason[0].abatementDateTime) && <div className={className+'-abatement-label'}>Abatement</div> }
	    { isValid(elt, e => e.reason[0].abatementDateTime) &&
	        <div className={className+'-abatement-value'}>{formatDate(elt.reason[0].abatementDateTime,false,false)}</div> }
	    { isValid(elt, e => e.reason[0].assertedDate) && <div className={className+'-asserted-label'}>Asserted</div> }
	    { isValid(elt, e => e.reason[0].assertedDate) &&
	        <div className={className+'-asserted-value'}>{formatDate(elt.reason[0].assertedDate,false,false)}</div> }

	    <div className={className+'-provider-label'}>Provider</div> 
	    <div className={className+'-provider-value'}>{elt.provider}</div> 

	    { elt.status && <div className={className+'-status-label'}>Status</div> }
	    { elt.status && <div className={className+'-status-value'}>{elt.status}</div> }

	    { elt.quantity && <div className={className+'-quantity'}>{elt.quantity.value}</div> }
	    { elt.quantity && <div className={className+'-quantity-unit'}>{elt.quantity.unit}</div> }

	    { elt.daysSupply && <div className={className+'-supply'}>{elt.daysSupply.value}</div> }
	    { elt.daysSupply && <div className={className+'-supply-unit'}>{elt.daysSupply.unit}</div> }

	    { isValid(elt, e => e.dosageInstruction[0].text) && <div className={className+'-dosage'}>{elt.dosageInstruction[0].text}</div> }
	    { isValid(elt, e => e.dosageInstruction[0].timing.repeat.boundsPeriod.start) &&
	        <div className={className+'-start-label'}>starting on</div> }
	    { isValid(elt, e => e.dosageInstruction[0].timing.repeat.boundsPeriod.start) &&
	        <div className={className+'-start-date'}>{elt.dosageInstruction[0].timing.repeat.boundsPeriod.start}</div> }

	    { isValid(elt, e => e.dispenseRequest.numberOfRepeatsAllowed) &&
	        <div className={className+'-repeat-label'}>refills</div> }
	    { isValid(elt, e => e.dispenseRequest.numberOfRepeatsAllowed) &&
	        <div className={className+'-repeat-count'}>{elt.dispenseRequest.numberOfRepeatsAllowed}</div> }
	 </div>
      );
   } else {
      return null;
   }
}

export function renderSocialHistory(matchingData, className) {
   let found = [];
   for (const elt of matchingData) {
      try {
	  found.push({provider: elt.provider, display: elt.data.code.coding[0].display, status: elt.data.status, value: elt.data.valueCodeableConcept.coding[0].display});
      } catch (e) {}
   }

   if (found.length > 0) {
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className={className+'-display'}>{elt.display}</div>
	    <div className={className+'-value'}>{elt.value}</div>
	    <div className={className+'-provider-label'}>Provider</div> 
	    <div className={className+'-provider-value'}>{elt.provider}</div> 
	    { elt.status && <div className={className+'-status-label'}>Status</div> }
	    { elt.status && <div className={className+'-status-value'}>{elt.status}</div> }
	 </div>
      );
   } else {
      return null;
   }
}

// Remove extraneous words from vital signs labels
function trimVitalsLabels(label) {
   return label.replace(/blood/gi, '').replace(/pressure/gi, '');
}

// Canonicalize vital signs display names
function canonVitals(display) {
   return titleCase(display.replace(/_/g, ' '));
}

export function renderVitals(matchingData, className, resources) {
   // Collect info to display from matchingData
   let found = [];
   for (const elt of matchingData) {
      try {
	 // Don't display Vital Signs "container" resources with related elements
	 const displayStr = canonVitals(elt.data.code.coding[0].display);
	 if (displayStr !== 'Vital Signs') {
	    found.push({provider: elt.provider,
			date: elt.itemDate instanceof Date ? elt.itemDate : new Date(elt.itemDate),
			display:displayStr,
			value:isValid(elt, e => e.data.valueQuantity) && elt.data.valueQuantity.value,
			unit:isValid(elt, e => e.data.valueQuantity) && elt.data.valueQuantity.unit,
			components:elt.data.component, status:elt.data.status});
	 }
      } catch (e) {};
   }

   // Collect full set of series (by display string) to graph from resources
   let series = {};
   let match = FhirTransform.getPathItem(resources.transformed, '[*category=Vital Signs]');
   for (const elt of match) {
      try {
	 // Don't graph Vital Signs "container" resources
	 const displayStr = canonVitals(elt.data.code.coding[0].display);
	 if (displayStr !== 'Vital Signs') {
	    const xVal = elt.itemDate instanceof Date ? elt.itemDate : new Date(elt.itemDate);
	    if (elt.data.valueQuantity) {
	       // Single data value
	       const yVal = elt.data.valueQuantity.value;
	       if (series.hasOwnProperty(displayStr)) {
		  // Add to series
		  series[displayStr].push({x: xVal, y: yVal});
	       } else {
		  // New series
		  series[displayStr] = [{x: xVal, y: yVal}];
	       }
	    } else if (elt.data.component) {
	       // Dual/pair data values
	       const yVal = (elt.data.component[0].valueQuantity.value + elt.data.component[1].valueQuantity.value) / 2;
	       const yVar = Math.abs(elt.data.component[1].valueQuantity.value - elt.data.component[0].valueQuantity.value);
	       if (series.hasOwnProperty(displayStr)) {
		  // Add to series
		  series[displayStr].push({x: xVal, y: yVal, yVariance: yVar});
	       } else {
		  // New series
		  series[displayStr] = [{x: xVal, y: yVal, yVariance: yVar}];
	       }
	    }
	 }
      } catch (e) {};
   }

   if (found.length > 0) {
      return found.sort((a, b) => stringCompare(a.display, b.display)).map((elt, index) => {
	 let sortedSeries = series[elt.display] && series[elt.display].sort((a, b) => stringCompare(a.x.toISOString(), b.x.toISOString()));
	 let thisValue = elt.value ? elt.value : (elt.components[0].valueQuantity.value + elt.components[1].valueQuantity.value)/2;
	 return (
	    <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	       <div className={className+'-display'}>{elt.display}</div>

	       { elt.value && <div className={className+'-value1'}>{formatDPs(elt.value, 1)}</div> }
	       { elt.unit && <div className={className+'-unit1'}>{elt.unit}</div> }

	       { elt.components && <div className={className+'-value1'}>{formatDPs(elt.components[0].valueQuantity.value, 1)}</div> }
	       { elt.components && <div className={className+'-unit1'}>{elt.components[0].valueQuantity.unit}</div> }
	       { elt.components && <div className={className+'-label1'}>{trimVitalsLabels(elt.components[0].code.coding[0].display)}</div> }

	       { elt.components && <div className={className+'-value2'}>{formatDPs(elt.components[1].valueQuantity.value, 1)}</div> }
	       { elt.components && <div className={className+'-unit2'}>{elt.components[1].valueQuantity.unit}</div> }
	       { elt.components && <div className={className+'-label2'}>{trimVitalsLabels(elt.components[1].code.coding[0].display)}</div> }

	       { sortedSeries && <TimeSeries className={className} data={sortedSeries} highlights={[{x:elt.date, y:thisValue}]} /> }

	       <div className={className+'-provider-label'}>Provider</div> 
	       <div className={className+'-provider-value'}>{elt.provider}</div> 

	       { elt.status && <div className={className+'-status-label'}>Status</div> }
	       { elt.status && <div className={className+'-status-value'}>{elt.status}</div> }
	    </div>
	 );
      });

   } else {
      return null;
   }
}

function renderContainedResource(res, className, index) {
   let payload = [];
   switch (res.resourceType) {
      case 'Coverage':
	 payload.push(<div className={className+'-contained-label-main'} key={index+'-1'}>Coverage</div>);
	 payload.push(<div className={className+'-contained-value1'} key={index+'-2'}>{res.type.text}</div>);
	 break;
      case 'ReferralRequest':
	 payload.push(<div className={className+'-contained-label-main'} key={index+'-1'}>Referral Request</div>);
	 payload.push(<div className={className+'-contained-label-sub1'} key={index+'-2'}>Intent</div>);
	 payload.push(<div className={className+'-contained-value2'} key={index+'-3'}>{res.intent}</div>);
	 payload.push(<div className={className+'-contained-label-sub2'} key={index+'-4'}>Status</div>);
	 payload.push(<div className={className+'-contained-value3'} key={index+'-5'}>{res.status}</div>);
	 break;
      default:
	 payload.push(<div className={className+'-contained-label-main'} key={index+'-1'}>{res.resourceType}</div>);
	 payload.push(<div className={className+'-contained-value1'} key={index+'-2'}>????</div>);
	 break;
   }
   return payload;
}

function renderContained(contained, className) {
    return contained.map((elt, index) => renderContainedResource(elt, className, index));
}

export function renderEOB(matchingData, className) {
   let found = [];
   for (const elt of matchingData) {
      try {
	 found.push({provider: elt.provider, totalCost: elt.data.totalCost, totalBenefit: elt.data.totalBenefit,
		     claimType: elt.data.type, billablePeriod: elt.data.billablePeriod, status: elt.data.status,
		     contained: elt.data.contained});
      } catch (e) {}
   }

   if (found.length > 0) {
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className={className+'-billable-label'}>For the period</div>
	    <div className={className+'-billable-value'}>{formatDate(elt.billablePeriod.start, true, true)}</div>
	    <div className={className+'-billable-value-separator'}>to</div>
	    <div className={className+'-billable-value2'}>{formatDate(elt.billablePeriod.end, true, true)}</div>

	    <div className={className+'-claim-type-label'}>Claim type</div>
	    <div className={className+'-claim-type-value'}>{elt.claimType.coding[0].display}</div>

	    <div className={className+'-cost-label'}>Total cost</div>
	    <div className={className+'-cost-value'}>{elt.totalCost.value.toFixed(2)}</div>
	    <div className={className+'-cost-currency'}>{elt.totalCost.code}</div>
	
	    <div className={className+'-benefit-label'}>Total benefit</div>
	    <div className={className+'-benefit-value'}>{elt.totalBenefit ? elt.totalBenefit.value.toFixed(2) : 'unknown'}</div>
	    <div className={className+'-benefit-currency'}>{elt.totalBenefit ? elt.totalBenefit.code : ''}</div>

	    <div className={className+'-provider-label'}>Provider</div> 
	    <div className={className+'-provider-value'}>{elt.provider}</div> 

	    { elt.status && <div className={className+'-status-label'}>Status</div> }
	    { elt.status && <div className={className+'-status-value'}>{elt.status}</div> }

	    { elt.contained && renderContained(elt.contained, className) }
	 </div>
      );
   } else {
      return null;
   }
}
