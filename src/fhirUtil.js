import React from 'react';

import './components/ContentPanel/ContentPanel.css';
import './components/ContentPanel/ContentPanelCategories.css';

import FhirTransform from './FhirTransform.js';
import { stringCompare, formatDate, formatDPs, isValid, tryWithDefault, titleCase } from './util.js';
import TimeSeries from './components/TimeSeries';

import CondDiv from './components/CondDiv';

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

export function renderAllergies(matchingData, appContext) {
   let found = [];
   for (const elt of matchingData) {
      try {
	  found.push({provider: elt.provider, code: elt.data.code, clinicalStatus: elt.data.clinicalStatus,
		      verificationStatus: elt.data.verificationStatus, type: elt.data.type, category: elt.data.category,
		      criticality: elt.data.criticality, substance: elt.data.substance, reaction: elt.data.reaction});
      } catch (e) {}
   }

   if (found.length > 0) {
      let isMultipleProviders = appContext.providers.length > 1;
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className='content-data'>
	       { elt.display && <div className='col01 label'>Allergy</div> }
	       { elt.display && <div className='col02 value-text medium'>{elt.code.coding[0].display}</div> }

	       { isMultipleProviders && <div className='col01 label'>Provider</div> }
	       { isMultipleProviders && <div className='col02 value-text'>{elt.provider}</div> }

	       { elt.clinicalStatus && <div className='col01 label'>Clinical status</div> }
	       { elt.clinicalStatus && <div className='col02 value-text'>{elt.clinicalStatus}</div> }

	       <CondDiv check={elt.verificationStatus} expected={'confirmed'}>
	          <div className='col01 label'>Verification</div>
	          <div className='col02 value-text'>{elt.verificationStatus}</div>
	       </CondDiv>

	       { elt.type && <div className='col01 label'>Type</div> }
	       { elt.type && <div className='col02 value-text'>{elt.type}</div> }

	       { elt.category && <div className='col01 label'>Category</div> }
	       { elt.category && <div className='col02 value-text'>{elt.category}</div> }

	       { elt.criticality && <div className='col01 label'>Criticality</div> }
	       { elt.criticality && <div className='col02 value-text'>{elt.criticality}</div> }

	       { elt.substance && <div className='col01 label'>Substance</div> }
	       { elt.substance && <div className='col02 value-text'>{elt.substance.coding[0].display}</div> }

	       { elt.reaction && <div className='col01 label'>Reaction</div> }
	       { elt.reaction && <div className='col02 value-text'>{elt.reaction[0].manifestation[0].coding[0].display}</div> }
	    </div>
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
export function renderDisplay(matchingData, typeLabel, appContext) {
   let found = [];
   for (const elt of matchingData) {
      try {
	  found.push({provider: elt.provider, display: elt.data.code.coding[0].display, status: elt.data.status, clinicalStatus: elt.data.clinicalStatus,
		      verificationStatus: elt.data.verificationStatus, reason: elt.data.reasonReference, valueQuantity: elt.data.valueQuantity});
      } catch (e) {}
   }

   if (found.length > 0) {
      let isMultipleProviders = appContext.providers.length > 1;
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className='content-data'>
	       { elt.display && <div className='col01 label'>{typeLabel}</div> }
	       { elt.display && <div className='col02 value-text medium'>{elt.display}</div> }

	       { elt.valueQuantity && <div className='col01 label'>Result</div> }
	       { elt.valueQuantity && <div className='col02 value-number'>{elt.valueQuantity.value + ' ' + elt.valueQuantity.unit}</div> }

	       { isValid(elt, e => e.reason[0].code) && <div className='col01 label'>Reason</div> }
	       { isValid(elt, e => e.reason[0].code) && <div className='col02 value-text'>{elt.reason[0].code.coding[0].display}</div> } 

	       { isValid(elt, e => e.reason[0].onsetDateTime) && <div className='col01 label'>Onset</div> }
	       { isValid(elt, e => e.reason[0].onsetDateTime) &&
		   <div className='col02 value-text'>{formatDate(elt.reason[0].onsetDateTime,false,false)}</div> }

	       { isValid(elt, e => e.reason[0].abatementDateTime) && <div className='col01 label'>Abatement</div> }
	       { isValid(elt, e => e.reason[0].abatementDateTime) &&
		   <div className='col02 value-text'>{formatDate(elt.reason[0].abatementDateTime,false,false)}</div> }

	       { isValid(elt, e => e.reason[0].assertedDate) && <div className='col01 label'>Asserted</div> }
	       { isValid(elt, e => e.reason[0].assertedDate) &&
		   <div className='col02 value-text'>{formatDate(elt.reason[0].assertedDate,false,false)}</div> }

	       { isMultipleProviders && <div className='col01 label'>Provider</div> }
	       { isMultipleProviders && <div className='col02 value-text'>{elt.provider}</div> }

	       <CondDiv check={elt.status} expected={['final', 'completed']}>
		  <div className='col01 label'>Status</div>
		  <div className='col02 value-text'>{elt.status}</div>
	       </CondDiv>

	       { elt.clinicalStatus && <div className='col01 label'>Clinical status</div> }
	       { elt.clinicalStatus && <div className='col02 value-text'>{elt.clinicalStatus}</div> }

	       <CondDiv check={elt.verificationStatus} expected={'confirmed'}>
		  <div className='col01 label'>Verification</div>
		  <div className='col02 value-text'>{elt.verificationStatus}</div>
	       </CondDiv>
	    </div>
	 </div>
      );
   } else {
      return null;
   }
}

export function renderImmunizations(matchingData, appContext) {
   let found = [];
   for (const elt of matchingData) {
      try {
	  found.push({provider: elt.provider, display: elt.data.vaccineCode.coding[0].display, status: elt.data.status,
		      notGiven: elt.data.notGiven, wasNotGiven: elt.data.wasNotGiven,
		      reported: elt.data.reported, primarySource: elt.data.primarySource});
      } catch (e) {}
   }

   if (found.length > 0) {
      let isMultipleProviders = appContext.providers.length > 1;
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className='content-data'>
	       { elt.display && <div className='col01 label'>Vaccine</div> }
	       { elt.display && <div className='col02 value-text medium'>{elt.display}</div> }

	       <CondDiv check={[elt.notGiven, elt.wasNotGiven]} expected={false}>
		  <div className='col01 label'>Given</div>
		  { elt.notGiven !== undefined && <div className='col02 value-text'>{elt.notGiven ? 'no' : 'yes'}</div> }
		  { elt.wasNotGiven !== undefined && <div className='col02 value-text'>{elt.wasNotGiven ? 'no' : 'yes'}</div> }
	       </CondDiv>

	       <CondDiv check={elt.reported} expected={false}>
		  <div className='col01 label'>Reported</div>
		  <div className='col02 value-text'>{elt.reported ? 'yes' : 'no'}</div>
	       </CondDiv>

	       <CondDiv check={elt.primarySource} expected={true}>
		  <div className='col01 label'>Primary Source</div>
		  <div className='col02 value-text'>{elt.primarySource ? 'yes' : 'no'}</div>
	       </CondDiv>

	       { isMultipleProviders && <div className='col01 label'>Provider</div> }
	       { isMultipleProviders && <div className='col02 value-text'>{elt.provider}</div> }

	       <CondDiv check={elt.status} expected={['final', 'completed']}>
		  <div className='col01 label'>Status</div>
		  <div className='col02 value-text'>{elt.status}</div>
	       </CondDiv>
	    </div>
	 </div>
      );
   } else {
      return null;
   }
}

export function renderLabs(matchingData, resources, dotClickFn, appContext) {
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
	    series[displayStr].push({ provider: elt.provider, x: xVal, y: yVal });
	 } else {
	    // New series
	    series[displayStr] = [{ provider: elt.provider, x: xVal, y: yVal }];
	 }
      } catch (e) {};
   }

   if (found.length > 0) {
      let isMultipleProviders = appContext.providers.length > 1;
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

	 // Select only values with matching provider and then sort
	 let sortedSeries = series[elt.display] && series[elt.display].filter(e => e.provider === elt.provider)
								      .sort((a, b) => stringCompare(a.x.toISOString(), b.x.toISOString()));
	 let thisValue = elt.valueQuantity ? elt.valueQuantity.value : null;

	 return (
	    <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}
		 id={formatDate(elt.date.toISOString(), true, true) + '-' + elt.display}>
	       <div className='content-data'>
		  { elt.display && <div className='col01 label'>Measure</div> }
		  { elt.display && <div className='col02 value-text medium'>{elt.display}</div> }

		  { elt.valueQuantity && <div className='col01 label'>Value</div> }
		  { elt.valueQuantity && <div className={'col02 value-number' + (highlightValue ? ' highlight' : '')}>
			{formatDPs(elt.valueQuantity.value, 1) + (elt.valueQuantity.unit ? ' ' + elt.valueQuantity.unit : '') }</div> }

		  { elt.valueString && <div className='col01 label'>Value</div> }
		  { elt.valueString && <div className='col02 value-text'>{elt.valueString}</div> }

		  { elt.referenceRange && <div className='col01 label'>{elt.referenceRange[0].meaning.coding[0].display}</div> }
		  { elt.referenceRange && <div className='col02 value-text'>
			{ elt.referenceRange[0].low.value
			  + (elt.referenceRange[0].low.unit && elt.referenceRange[0].low.unit !== elt.referenceRange[0].high.unit ? ' ' + elt.referenceRange[0].low.unit : '')
			  + ' - '
			  + elt.referenceRange[0].high.value
			  + (elt.referenceRange[0].high.unit ? ' ' + elt.referenceRange[0].high.unit : '') } </div> }

		  { isMultipleProviders && <div className='col01 label'>Provider</div> }
		  { isMultipleProviders && <div className='col02 value-text'>{elt.provider}</div> }

		  <CondDiv check={elt.status} expected={'final'}>
		     <div className='col01 label'>Status</div>
		     <div className='col02 value-text'>{elt.status}</div>
		  </CondDiv>
	       </div>
	       <div className='content-graph'>
		  { sortedSeries && <TimeSeries measure={elt.display} data={sortedSeries} highlights={[{x:elt.date, y:thisValue}]} dotClickFn={dotClickFn} /> }
	       </div>
	       <div className='content-extras'>
		  {/* TODO: stuff goes here */}
	       </div>
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
export function renderMeds(matchingData, appContext) {
   let found = [];
   for (const elt of matchingData) {
      try {
	  found.push({provider: elt.provider, display:elt.data.medicationCodeableConcept.coding[0].display, quantity:elt.data.quantity,
		      daysSupply:elt.data.daysSupply, dosageInstruction:elt.data.dosageInstruction, dispenseRequest:elt.data.dispenseRequest,
		      status:elt.data.status, reason:elt.data.reasonReference});
      } catch (e) {};
   }

   if (found.length > 0) {
      let isMultipleProviders = appContext.providers.length > 1;
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className='content-data'>
	       { elt.display && <div className='col01 label'>Medication</div> }
	       { elt.display && <div className='col02 value-text medium'>{elt.display}</div> }

	       { isValid(elt, e => e.reason[0].code) && <div className='col01 label'>Reason</div> }
	       { isValid(elt, e => e.reason[0].code) && <div className='col02 value-text'>{elt.reason[0].code.coding[0].display}</div> } 

	       { isValid(elt, e => e.reason[0].onsetDateTime) && <div className='col01 label'>Onset</div> }
	       { isValid(elt, e => e.reason[0].onsetDateTime) &&
		   <div className='col02 value-text'>{formatDate(elt.reason[0].onsetDateTime,false,false)}</div> }

	       { isValid(elt, e => e.reason[0].abatementDateTime) && <div className='col01 label'>Abatement</div> }
	       { isValid(elt, e => e.reason[0].abatementDateTime) &&
		   <div className='col02 value-text'>{formatDate(elt.reason[0].abatementDateTime,false,false)}</div> }

	       { isValid(elt, e => e.reason[0].assertedDate) && <div className='col01 label'>Asserted</div> }
	       { isValid(elt, e => e.reason[0].assertedDate) &&
		   <div className='col02 value-text'>{formatDate(elt.reason[0].assertedDate,false,false)}</div> }

	       { isMultipleProviders && <div className='col01 label'>Provider</div> }
	       { isMultipleProviders && <div className='col02 value-text'>{elt.provider}</div> }

	       <CondDiv check={elt.status} expected={['active', 'completed']}>
		  <div className='col01 label'>Status</div>
		  <div className='col02 value-text'>{elt.status}</div>
	       </CondDiv>

	       { elt.quantity && <div className='col01 label'>Quantity</div> }
	       { elt.quantity && <div className='col02 value-text'>{elt.quantity.value + ' ' + elt.quantity.unit}</div> }

	       { elt.daysSupply && <div className='col01 label'>Supply</div> }
	       { elt.daysSupply && <div className='col02 value-text'>{elt.daysSupply.value + ' ' + elt.daysSupply.unit}</div> }

	       { isValid(elt, e => e.dosageInstruction[0].text) && <div className='col01 label'>Dosage</div> }
	       { isValid(elt, e => e.dosageInstruction[0].text) && <div className='col02 value-text'>{elt.dosageInstruction[0].text}</div> }

	       { isValid(elt, e => e.dosageInstruction[0].timing.repeat.boundsPeriod.start) && <div className='col01 label'>Starting on</div> }
	       { isValid(elt, e => e.dosageInstruction[0].timing.repeat.boundsPeriod.start) &&
		   <div className='col02 value-text'>{elt.dosageInstruction[0].timing.repeat.boundsPeriod.start}</div> }

	       { isValid(elt, e => e.dispenseRequest.numberOfRepeatsAllowed) && <div className='col01 label'>Refills</div> }
	       { isValid(elt, e => e.dispenseRequest.numberOfRepeatsAllowed) &&
		   <div className='col02 value-text'>{elt.dispenseRequest.numberOfRepeatsAllowed}</div> }
	    </div>
	 </div>
      );
   } else {
      return null;
   }
}

export function renderSocialHistory(matchingData, appContext) {
   let found = [];
   for (const elt of matchingData) {
      try {
	  found.push({provider: elt.provider, display: elt.data.code.coding[0].display, status: elt.data.status, value: elt.data.valueCodeableConcept.coding[0].display});
      } catch (e) {}
   }

   if (found.length > 0) {
      let isMultipleProviders = appContext.providers.length > 1;
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className='content-data'>
	       { elt.display && <div className='col01 label'>Type</div> }
	       { elt.display && <div className='col02 value-text medium'>{elt.display}</div> }

	       <div className='col01 label'>Value</div>
	       <div className='col02 value-text'>{elt.value}</div>

	       { isMultipleProviders && <div className='col01 label'>Provider</div> }
	       { isMultipleProviders && <div className='col02 value-text'>{elt.provider}</div> }

	       <CondDiv check={elt.status} expected={'final'}>
		  <div className='col01 label'>Status</div>
		  <div className='col02 value-text'>{elt.status}</div>
	       </CondDiv>
	    </div>
	 </div>
      );
   } else {
      return null;
   }
}

export function renderEncounters(matchingData, appContext) {
   let found = [];
   for (const elt of matchingData) {
      try {
	  found.push({ provider: elt.provider, display: tryWithDefault(elt, e => e.data.type[0].coding[0].display, null), status: elt.data.status,
		       date: elt.itemDate, class: elt.data.class.code ? elt.data.class.code : elt.data.class, period: elt.data.period });
      } catch (e) {}
   }

   if (found.length > 0) {
      let isMultipleProviders = appContext.providers.length > 1;
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className='content-data'>	       
	       { elt.display && <div className='col01 label'>Type</div> }
	       { elt.display && <div className='col02 value-text medium'>{elt.display}</div> }

	       { elt.period.start !== elt.period.end && <div className='col01 label'>Ending</div> }
	       { elt.period.start !== elt.period.end && <div className='col02 value-text'>{formatDate(elt.period.end, true, false)}</div> }

	       <div className='col01 label'>Class</div>
	       <div className='col02 value-text'>{elt.class}</div>

	       <CondDiv check={elt.status} expected={'finished'}>
		  <div className='col01 label'>Status</div>
		  <div className='col02 value-text'>{elt.status}</div>
	       </CondDiv>

	       { isMultipleProviders && <div className='col01 label'>Provider</div> }
	       { isMultipleProviders && <div className='col02 value-text'>{elt.provider}</div> }
	    </div>
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

export function renderVitals(matchingData, resources, dotClickFn, appContext) {
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
			value:isValid(elt, e => e.data.valueQuantity) ? elt.data.valueQuantity.value : undefined,
			unit:isValid(elt, e => e.data.valueQuantity) ? elt.data.valueQuantity.unit : undefined,
			component:elt.data.component, status:elt.data.status});
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
		  series[displayStr].push({ provider: elt.provider, x: xVal, y: yVal });
	       } else {
		  // New series
		  series[displayStr] = [{ provider: elt.provider, x: xVal, y: yVal }];
	       }
	    } else if (elt.data.component) {
	       // Dual/pair data values
	       const y1 = tryWithDefault(elt, e => e.data.component[0].valueQuantity.value, 0);
	       const y2 = tryWithDefault(elt, e => e.data.component[1].valueQuantity.value, 0);
	       const yVal = (y1 + y2) / 2;
	       const yVar = Math.abs(y2 - y1);
	       if (series.hasOwnProperty(displayStr)) {
		  // Add to series
		  series[displayStr].push({ provider: elt.provider, x: xVal, y: yVal, yVariance: yVar, y1: y1, y2: y2 });
	       } else {
		  // New series
	          series[displayStr] = [{ provider: elt.provider, x: xVal, y: yVal, yVariance: yVar, y1: y1, y2: y2 }];
	       }
	    }
	 }
      } catch (e) {};
   }

   if (found.length > 0) {
      let isMultipleProviders = appContext.providers.length > 1;
      return found.sort((a, b) => stringCompare(a.display, b.display)).map((elt, index) => {
	 // Select only values with matching provider and then sort
	 let sortedSeries = series[elt.display] && series[elt.display].filter(e => e.provider === elt.provider)
								      .sort((a, b) => stringCompare(a.x.toISOString(), b.x.toISOString()));
	 let thisValue = elt.value ? elt.value
				   : (tryWithDefault(elt, e => e.component[0].valueQuantity.value, 0)
				      + tryWithDefault(elt, e => e.component[1].valueQuantity.value, 0))/2;

	 return (
	    <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}
		 id={formatDate(elt.date.toISOString(), true, true) + '-' + elt.display}>
	       <div className='content-data'>
		  { elt.display && <div className='col01 label'>Measure</div> }
		  { elt.display && <div className='col02 value-text medium'>{elt.display}</div> }

		  { elt.value && <div className='col01 label'>Value</div> }
	          { elt.value && <div className='col02 value-number'>{formatDPs(elt.value, 1) + ' ' + elt.unit}</div> }

	          { elt.component && <div className='col01 label'>{trimVitalsLabels(elt.component[0].code.coding[0].display)}</div> }
	          { elt.component && <div className='col02 value-number'>
			{ tryWithDefault(elt, e => formatDPs(e.component[0].valueQuantity.value, 1), '???') + ' '
			  + tryWithDefault(elt, e => e.component[0].valueQuantity.unit, '???')}</div> }

	          { elt.component && <div className='col01 label'>{trimVitalsLabels(elt.component[1].code.coding[0].display)}</div> }
	          { elt.component && <div className='col02 value-number'>
			{ tryWithDefault(elt, e => formatDPs(e.component[1].valueQuantity.value,1), '???') + ' '
			  + tryWithDefault(elt, e => e.component[1].valueQuantity.unit, '???')}</div> }

	          { isMultipleProviders && <div className='col01 label'>Provider</div> }
	          { isMultipleProviders && <div className='col02 span07 value-text'>{elt.provider}</div> }

	          <CondDiv check={elt.status} expected={'final'}>
	             <div className='col01 label'>Status</div>
	             <div className='col02 value-text'>{elt.status}</div>
	          </CondDiv>
	       </div>
	       <div className='content-graph'>
		  { sortedSeries && <TimeSeries measure={elt.display} data={sortedSeries} highlights={[{x:elt.date, y:thisValue}]} dotClickFn={dotClickFn} /> }
	       </div>
	       <div className='content-extras'>
		  {/* TODO: stuff goes here */}
	       </div>
	    </div>
	 );
      });

   } else {
      return null;
   }
}

function renderContainedResource(res, index, appContext) {
   let payload = [];
   switch (res.resourceType) {
      case 'Coverage':
	 payload.push(<div className='col01 label' key={index+'-1'}>Coverage</div>);
	 payload.push(<div className='col02 value-text' key={index+'-2'}>{res.type.text}</div>);
	 break;
      case 'ReferralRequest':
	 payload.push(<div className='col01 label' key={index+'-1'}>Referral</div>);
	 payload.push(<div className='col02 value-text' key={index+'-2'}>{res.status}</div>);
	 break;
      default:
	 payload.push(<div className='col01 label' key={index+'-1'}>{res.resourceType}</div>);
	 payload.push(<div className='col02 value-text' key={index+'-2'}>????</div>);
	 break;
   }
   return payload;
}

function renderContained(contained, appContext) {
    return contained.map((elt, index) => renderContainedResource(elt, index, appContext));
}

export function renderEOB(matchingData, appContext) {
   let found = [];
   for (const elt of matchingData) {
      try {
	 found.push({ provider: elt.provider, totalCost: elt.data.totalCost, totalBenefit: elt.data.totalBenefit,
		      claimType: elt.data.type, billablePeriod: elt.data.billablePeriod, status: elt.data.status,
		      contained: elt.data.contained, careTeam: elt.data.careTeam, diagnosis: elt.data.diagnosis });
      } catch (e) {}
   }

   if (found.length > 0) {
      let isMultipleProviders = appContext.providers.length > 1;
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className='content-data'>
	       <div className='col01 label'>Period</div>
	       <div className='col02 value-text medium'>
		  { formatDate(elt.billablePeriod.start, true, true) }
		  &nbsp;&nbsp;&mdash;&nbsp;
		  { formatDate(elt.billablePeriod.end, true, true) }
	       </div>

	       <div className='col01 label'>Claim type</div>
	       <div className='col02 value-text'>{elt.claimType.coding[0].display}</div>

	       <div className='col01 label'>Total cost</div>
	       <div className='col02 value-number'>{elt.totalCost.value.toFixed(2) + ' ' +  elt.totalCost.code}</div>
	
	       <div className='col01 label'>Total benefit</div>
	       { elt.totalBenefit ? <div className='col02 value-number'>{elt.totalBenefit.value.toFixed(2) + ' ' + elt.totalBenefit.code}</div>
				  : <div className='col02 value-text'>unknown</div> }

	       { isMultipleProviders && <div className='col01 label'>Provider</div> }
	       { isMultipleProviders && <div className='col02 value-text'>{elt.provider}</div> }

	       { isValid(elt, e => e.diagnosis[0].diagnosisReference.code) && <div className='col01 label'>Diagnosis</div> }
	       { isValid(elt, e => e.diagnosis[0].diagnosisReference.code) &&
		   <div className='col02 value-text'>{elt.diagnosis[0].diagnosisReference.code.coding[0].display}</div> }

	       <CondDiv check={elt.status} expected={'active'}>
		  <div className='col01 label'>Status</div>
		  <div className='col02 value-text'>{elt.status}</div>
	       </CondDiv>

	       { isValid(elt, e => e.careTeam[0].role.coding[0].display) && <div className='col01 label'>Role</div> }
	       { isValid(elt, e => e.careTeam[0].role.coding[0].display) && <div className='col02 value-text'>{elt.careTeam[0].role.coding[0].display}</div> }

	       { elt.contained && renderContained(elt.contained, appContext) }
	    </div>
	 </div>
      );
   } else {
      return null;
   }
}

export function renderClaims(matchingData, appContext) {
   let found = [];
   for (const elt of matchingData) {
      try {
	 found.push({ provider: elt.provider, total: elt.data.total, billablePeriod: elt.data.billablePeriod,
		      status: elt.data.status, use: elt.data.use, diagnosis: elt.data.diagnosis });
      } catch (e) {}
   }

   if (found.length > 0) {
      let isMultipleProviders = appContext.providers.length > 1;
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className='content-data'>
	       <div className='col01 label'>Period</div>
	       <div className='col02 value-text medium'>
		  { formatDate(elt.billablePeriod.start, true, true) }
		  &nbsp;&nbsp;&mdash;&nbsp;
		  { formatDate(elt.billablePeriod.end, true, true) }
	       </div>

	       <div className='col01 label'>Total</div>
	       <div className='col02 value-number'>{elt.total.value.toFixed(2) + ' ' + elt.total.code}</div>
	
	       { isMultipleProviders && <div className='col01 label'>Provider</div> }
	       { isMultipleProviders && <div className='col02 value-text'>{elt.provider}</div> }

	       { isValid(elt, e => e.diagnosis[0].diagnosisReference.code) && <div className='col01 label'>Diagnosis</div> }
	       { isValid(elt, e => e.diagnosis[0].diagnosisReference.code) &&
		   <div className='col02 value-text'>{elt.diagnosis[0].diagnosisReference.code.coding[0].display}</div> }

	       <CondDiv check={elt.status} expected={'active'}>
		  <div className='col01 label'>Status</div>
		  <div className='col02 value-text'>{elt.status}</div>
	       </CondDiv>

	       <CondDiv check={elt.use} expected={'complete'}>
		  <div className='col01 label'>Use</div>
		  <div className='col02 value-text'>{elt.use}</div>
	       </CondDiv>
	    </div>
	 </div>
      );
   } else {
      return null;
   }
}

export function renderExams(matchingData, appContext) {
   let found = [];
   for (const elt of matchingData) {
      try {
	  found.push({provider: elt.provider, display: elt.data.code.coding[0].display, status: elt.data.status,
		      value: elt.data.valueQuantity.value, unit: elt.data.valueQuantity.unit});
      } catch (e) {}
   }

   if (found.length > 0) {
      let isMultipleProviders = appContext.providers.length > 1;
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className='content-data'>
	       { elt.display && <div className='col01 label'>Type</div> }
	       { elt.display && <div className='col02 value-text medium'>{elt.display}</div> }

	       <div className='col01 label'>Value</div>
	       <div className='col02 value-text'>{elt.value + ' ' + elt.unit}</div>

	       { isMultipleProviders && <div className='col01 label'>Provider</div> }
	       { isMultipleProviders && <div className='col02 value-text'>{elt.provider}</div> }

	       <CondDiv check={elt.status} expected={'final'}>
		  <div className='col01 label'>Status</div>
		  <div className='col02 value-text'>{elt.status}</div>
	       </CondDiv>
	    </div>
	 </div>
      );
   } else {
      return null;
   }
}
