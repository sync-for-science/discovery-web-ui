/*
 * Extracts a name string from the FHIR patient object.
 *
 * @param {Object} patient FHIR patient object
 * @returns {String} Patient's name, or an empty string
 */
export function getPatientName(patient) {
   if (!patient) {
      return '';
   }

   let name = Array.isArray(patient.name) ? patient.name[0] : patient.name;
   if (!name) {
      return '';
   }

   let prefix = Array.isArray(name.prefix) ? name.prefix : [ name.prefix ];
   let given  = Array.isArray(name.given ) ? name.given  : [ name.given  ];
   let family = Array.isArray(name.family) ? name.family : [ name.family ];
   let suffix = Array.isArray(name.suffix) ? name.suffix : [ name.suffix ];

   return [
      prefix.map(elt => String(elt || '').trim()).join(' '),
      given.map (elt => String(elt || '').trim()).join(' '),
      family.map(elt => String(elt || '').trim()).join(' '),
      suffix.map(elt => String(elt || '').trim()).join(' ')
   ].filter(Boolean).join(' ').replace( /\s\s+/g, ' ' );
}

export function getPatientAddress(patient) {
   if (!patient) {
      return '';
   }

   let addr = Array.isArray(patient.address) ? patient.address[0] : patient.address;
   if (!addr) {
      return '';
   }

   let line = Array.isArray(addr.line) ? addr.line : [ addr.line ];

   return line.map(elt => String(elt || '').trim()).join('\n') + '\n'
	+ addr.city + ', ' + addr.state + ' ' + addr.postalCode + '\n'
	+ addr.country;
}
