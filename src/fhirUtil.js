import React from 'react';

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

export function formatDPs(number, places) {
   const mult = Math.pow(10, places);
   return parseFloat(Math.round(number * mult) / mult).toFixed(places);
}

export function renderSingleValue(matchingData, searchStrings, headerString) {
   let classNameBase = headerString.toLowerCase().replace(/ /g, '-').replace(/[()]/g, '');
   let found = [];
   for (const elt of matchingData) {
      try {
	 for (const search of searchStrings) {
	    if (elt.data.code.coding[0].display.toLowerCase() === search) {
	       found.push({value: elt.data.valueQuantity.value, unit: elt.data.valueQuantity.unit});
	    }
	 }
      } catch (e) {}
   }

   if (found.length > 0) {
      return found.map((elt, index) => 
	 <div className={classNameBase} key={index}>
	    <div className={classNameBase+'-header'}>{headerString}</div>

	    <div className={classNameBase+'-value'}>{formatDPs(elt.value,1)}</div>
	    <div className={classNameBase+'-unit'}>{elt.unit}</div>
	 </div>
      );
   } else {
      return null;
   }
}

export function renderPairValue(matchingData, searchStrings, component0search, component0label, component1label, headerString) {
   let classNameBase = headerString.toLowerCase().replace(/ /g, '-');
   let found = [];
   for (const elt of matchingData) {
      try {
	 for (const search of searchStrings) {
	    if (elt.data.code.coding[0].display.toLowerCase() === search) {
	       let newElt = { unit: elt.data.component[0].valueQuantity.unit };
	       if (elt.data.component[0].code.coding[0].display === component0search) {
		  newElt[component0label] = elt.data.component[0].valueQuantity.value;
		  newElt[component1label] = elt.data.component[1].valueQuantity.value;
		  found.push(newElt);
	       } else {
		  newElt[component0label] = elt.data.component[1].valueQuantity.value;
		  newElt[component1label] = elt.data.component[0].valueQuantity.value;
		  found.push(newElt);
	       }
	    }
	 }
      } catch (e) {}
   }

   if (found.length > 0) {
      return found.map((elt, index) => 
	 <div className={classNameBase} key={index}>
	    <div className={classNameBase+'-header'}>{headerString}</div>

	    <div className={classNameBase+'-value'}>{elt[component0label]}</div>
	    <div className={classNameBase+'-unit'}>{elt.unit}</div>
	    <div className={classNameBase+'-label'}>{component0label}</div>

	    <div className={classNameBase+'-value'}>{elt[component1label]}</div>
	    <div className={classNameBase+'-unit'}>{elt.unit}</div>
	    <div className={classNameBase+'-label'}>{component1label}</div>
	 </div>
      );
   } else {
      return null;
   }
}

export function renderVaccines(matchingData, className) {
   let found = [];
   for (const elt of matchingData) {
      try {
	 found.push({display: elt.data.vaccineCode.coding[0].display});
      } catch (e) {}
   }

   if (found.length > 0) {
      return found.map((elt, index) => 
	 <div className={className+'-display'} key={index}>{elt.display}</div>
      );
   } else {
      return null;
   }
}

export function renderMeds(matchingData, className) {
   let found = [];
   for (const elt of matchingData) {
      try {
	  found.push({display: elt.data.medicationCodeableConcept.coding[0].display, quantity: elt.data.quantity, daysSupply: elt.data.daysSupply});
      } catch (e) {};
   }

   if (found.length > 0) {
      return found.map((elt, index) => 
	 <div className={className+'-container'} key={index}>
	    <div className={className+'-display'}>{elt.display}</div>
	    { elt.quantity && <div className={className+'-quantity'}>{elt.quantity.value}</div> }
	    { elt.quantity && <div className={className+'-unit'}>{elt.quantity.unit}</div> }
	    { elt.daysSupply && <div className={className+'-supply'}>{elt.daysSupply.value}</div> }
	    { elt.daysSupply && <div className={className+'-unit'}>{elt.daysSupply.unit}</div> }
	 </div>
      );
   } else {
      return null;
   }
}

export function renderDisplay(matchingData, className) {
   let found = [];
   for (const elt of matchingData) {
      try {
	 found.push({display: elt.data.code.coding[0].display});
      } catch (e) {}
   }

   if (found.length > 0) {
      return found.map((elt, index) => 
	 <div className={className+'-display'} key={index}>{elt.display}</div>
      );
   } else {
      return null;
   }
}
