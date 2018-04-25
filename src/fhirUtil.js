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
      given .map(elt => String(elt || '').trim()).join(' '),
      family.map(elt => String(elt || '').trim()).join(' '),
      suffix.map(elt => String(elt || '').trim()).join(' ')
   ].filter(Boolean).join(' ').replace( /\s\s+/g, ' ' );
}
