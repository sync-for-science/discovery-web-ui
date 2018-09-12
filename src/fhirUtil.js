import React from 'react';

import { stringCompare, formatDate, formatDPs, isValid, titleCase } from './util.js';
import './components/ContentPanel/ContentPanel.css';

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
      given.map (elt => String(elt || '').trim()).join(' '),
      family.map(elt => String(elt || '').trim()).join(' '),
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

export function formatPatientMRN(identifier) {
   let identElts = Array.isArray(identifier) ? identifier : [ identifier ];
   for (let elt of identElts) {
      try {
	 if (elt.type.coding[0].code === 'MR') {
	    return elt.value;
	 }
      } catch (e) {};
   }

   return 'Unknown';
}

// Remove extraneous words from vital signs labels
function trimVitalsLabels(label) {
   return label.replace(/blood/gi, '').replace(/pressure/gi, '');
}

// Canonicalize vital signs display names
function canonVitals(display) {
   return titleCase(display.replace(/_/g, ' '));
}

export function renderAllergies(matchingData, className) {
   let found = [];
   for (const elt of matchingData) {
      try {
	  found.push({display: elt.data.code.coding[0].display, clinicalStatus: elt.data.clinicalStatus,
		      verificationStatus: elt.data.verificationStatus, type: elt.data.type, category: elt.data.category,
		      criticality: elt.data.criticality});
      } catch (e) {}
   }

   if (found.length > 0) {
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className={className+'-display'}>{elt.display}</div>
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
	  found.push({display: elt.data.code.coding[0].display, status: elt.data.status, clinicalStatus: elt.data.clinicalStatus,
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
	  found.push({display: elt.data.vaccineCode.coding[0].display, status: elt.data.status, notGiven: elt.data.notGiven, wasNotGiven: elt.data.wasNotGiven,
		      reported: elt.data.reported, primarySource: elt.data.primarySource});
      } catch (e) {}
   }

   if (found.length > 0) {
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className={className+'-display'}>{elt.display}</div>
	    { elt.status && <div className={className+'-status-label'}>Status</div> }
	    { elt.status && <div className={className+'-status-value'}>{elt.status}</div> }
	    { ((elt.notGiven !== undefined) || (elt.wasNotGiven !== undefined)) && <div className={className+'-given-label'}>Given</div> }
	    { elt.notGiven !== undefined && <div className={className+'-given-value'}>{elt.notGiven ? 'false' : 'true'}</div> }
	    { elt.wasNotGiven !== undefined && <div className={className+'-given-value'}>{elt.wasNotGiven ? 'false' : 'true'}</div> }
	    { elt.reported !== undefined && <div className={className+'-reported-label'}>Reported</div> }
	    { elt.reported !== undefined && <div className={className+'-reported-value'}>{elt.reported ? 'true' : 'false'}</div> }
	    { elt.primarySource !== undefined && <div className={className+'-primary-label'}>Primary Source</div> }
	    { elt.primarySource !== undefined && <div className={className+'-primary-value'}>{elt.primarySource ? 'true' : 'false'}</div> }
	 </div>
      );
   } else {
      return null;
   }
}

export function renderLabs(matchingData, className) {
   let found = [];
   for (const elt of matchingData) {
      try {
//	 found.push({display:elt.data.code.coding[0].display, value:formatDPs(elt.data.valueQuantity.value, 1), unit:elt.data.valueQuantity.unit,
//		     referenceRange: elt.data.referenceRange, status:elt.data.status});
	  found.push({display: elt.data.code.coding[0].display, valueQuantity: elt.data.valueQuantity, valueString: elt.data.valueString,
		     referenceRange: elt.data.referenceRange, status:elt.data.status});
      } catch (e) {};
   }

   if (found.length > 0) {
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className={className+'-display'}>{elt.display}</div>

	    { elt.valueQuantity && <div className={className+'-value'}>{formatDPs(elt.valueQuantity.value, 1)}</div> }
	    { elt.valueQuantity && <div className={className+'-unit'}>{elt.valueQuantity.unit}</div> }

	    { elt.valueString && <div className={className+'-value-label'}>Value</div> }
	    { elt.valueString && <div className={className+'-value-string'}>{elt.valueString}</div> }

	    { elt.referenceRange && <div className={className+'-ref-label1'}>{elt.referenceRange[0].meaning.coding[0].display}</div> }
	    { elt.referenceRange && <div className={className+'-ref-value1'}>{elt.referenceRange[0].low.value}</div> }
	    { elt.referenceRange && elt.referenceRange[0].low.unit !== elt.referenceRange[0].high.unit &&
	                            <div className={className+'-ref-unit1'}>{elt.referenceRange[0].low.unit}</div> }
	    { elt.referenceRange && <div className={className+'-ref-label2'}>-</div> }
	    { elt.referenceRange && <div className={className+'-ref-value2'}>{elt.referenceRange[0].high.value}</div> }
	    { elt.referenceRange && <div className={className+'-ref-unit2'}>{elt.referenceRange[0].high.unit}</div> }

	    { elt.status && <div className={className+'-status-label'}>Status</div> }
	    { elt.status && <div className={className+'-status-value'}>{elt.status}</div> }
	 </div>
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
	  found.push({display:elt.data.medicationCodeableConcept.coding[0].display, quantity:elt.data.quantity, daysSupply:elt.data.daysSupply,
		      dosageInstruction:elt.data.dosageInstruction, dispenseRequest:elt.data.dispenseRequest, status:elt.data.status,
		      reason:elt.data.reasonReference});
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
	 found.push({display: elt.data.code.coding[0].display, status: elt.data.status, value: elt.data.valueCodeableConcept.coding[0].display});
      } catch (e) {}
   }

   if (found.length > 0) {
      return found.map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className={className+'-display'}>{elt.display}</div>
	    <div className={className+'-value'}>{elt.value}</div>
	    { elt.status && <div className={className+'-status-label'}>Status</div> }
	    { elt.status && <div className={className+'-status-value'}>{elt.status}</div> }
	 </div>
      );
   } else {
      return null;
   }
}

export function renderVitals(matchingData, className) {
   let found = [];
   for (const elt of matchingData) {
      try {
	 // Don't display Vital Signs "container" resources with related elements
	 if (elt.data.code.coding[0].display !== 'Vital Signs') {
	    found.push({display:elt.data.code.coding[0].display,
			value:isValid(elt, elt => elt.data.valueQuantity) && elt.data.valueQuantity.value,
			unit:isValid(elt,  elt => elt.data.valueQuantity) && elt.data.valueQuantity.unit,
			components:elt.data.component, status:elt.data.status});
	 }
      } catch (e) {};
   }

   if (found.length > 0) {
      return found.sort((a, b) => stringCompare(a.display, b.display)).map((elt, index) => 
	 <div className={index < found.length-1 ? 'content-container' : 'content-container-last'} key={index}>
	    <div className={className+'-display'}>{canonVitals(elt.display)}</div>

	    { elt.value && <div className={className+'-value1'}>{formatDPs(elt.value, 1)}</div> }
	    { elt.unit && <div className={className+'-unit1'}>{elt.unit}</div> }

	    { elt.components && <div className={className+'-value1'}>{elt.components[0].valueQuantity.value}</div> }
	    { elt.components && <div className={className+'-unit1'}>{elt.components[0].valueQuantity.unit}</div> }
	    { elt.components && <div className={className+'-label1'}>{trimVitalsLabels(elt.components[0].code.coding[0].display)}</div> }

	    { elt.components && <div className={className+'-value2'}>{elt.components[1].valueQuantity.value}</div> }
	    { elt.components && <div className={className+'-unit2'}>{elt.components[1].valueQuantity.unit}</div> }
	    { elt.components && <div className={className+'-label2'}>{trimVitalsLabels(elt.components[1].code.coding[0].display)}</div> }

	    { elt.status && <div className={className+'-status-label'}>Status</div> }
	    { elt.status && <div className={className+'-status-value'}>{elt.status}</div> }
	 </div>
      );
   } else {
      return null;
   }
}


// export function renderSingleValue(matchingData, searchStrings, headerString) {
//    let classNameBase = headerString.toLowerCase().replace(/ /g, '-').replace(/[()]/g, '');
//    let found = [];
//    for (const elt of matchingData) {
//       try {
// 	 for (const search of searchStrings) {
// 	    if (elt.data.code.coding[0].display.toLowerCase() === search) {
// 		found.push({value: elt.data.valueQuantity.value, unit: elt.data.valueQuantity.unit, status: elt.data.status});
// 	    }
// 	 }
//       } catch (e) {}
//    }

//    if (found.length > 0) {
//       return found.map((elt, index) => 
// 	 <div className={classNameBase} key={index}>
// 	    <div className={classNameBase+'-header'}>{headerString}</div>

// 	    <div className={classNameBase+'-value'}>{formatDPs(elt.value,1)}</div>
// 	    <div className={classNameBase+'-unit'}>{elt.unit}</div>

// 	    <div className={classNameBase+'-status-label'}>Status</div>
// 	    <div className={classNameBase+'-status-value'}>{elt.status}</div>
// 	 </div>
//       );
//    } else {
//       return null;
//    }
// }

// export function renderPairValue(matchingData, searchStrings, component0search, component0label, component1label, headerString) {
//    let classNameBase = headerString.toLowerCase().replace(/ /g, '-');
//    let found = [];
//    for (const elt of matchingData) {
//       try {
// 	 for (const search of searchStrings) {
// 	    if (elt.data.code.coding[0].display.toLowerCase() === search) {
// 	       let newElt = { unit: elt.data.component[0].valueQuantity.unit, status: elt.data.status };
// 	       if (elt.data.component[0].code.coding[0].display === component0search) {
// 		  newElt[component0label] = elt.data.component[0].valueQuantity.value;
// 		  newElt[component1label] = elt.data.component[1].valueQuantity.value;
// 		  found.push(newElt);
// 	       } else {
// 		  newElt[component0label] = elt.data.component[1].valueQuantity.value;
// 		  newElt[component1label] = elt.data.component[0].valueQuantity.value;
// 		  found.push(newElt);
// 	       }
// 	    }
// 	 }
//       } catch (e) {}
//    }

//    if (found.length > 0) {
//       return found.map((elt, index) => 
// 	 <div className={classNameBase} key={index}>
// 	    <div className={classNameBase+'-header'}>{headerString}</div>

// 	    <div className={classNameBase+'-value'}>{elt[component0label]}</div>
// 	    <div className={classNameBase+'-unit'}>{elt.unit}</div>
// 	    <div className={classNameBase+'-label'}>{component0label}</div>

// 	    <div className={classNameBase+'-value'}>{elt[component1label]}</div>
// 	    <div className={classNameBase+'-unit'}>{elt.unit}</div>
// 	    <div className={classNameBase+'-label'}>{component1label}</div>

// 	    <div className={classNameBase+'-status-label'}>Status</div>
// 	    <div className={classNameBase+'-status-value'}>{elt.status}</div>
// 	 </div>
//       );
//    } else {
//       return null;
//    }
// }
