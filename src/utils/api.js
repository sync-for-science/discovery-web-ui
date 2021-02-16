import FhirTransform from '../FhirTransform';
import {
  classFromCat, formatAge, cleanDates, Const, normalizeDates, timelineIncrYears, tryWithDefault,
} from '../util';
import config from '../config';
import { log } from './logger';
import Unimplemented from '../components/Unimplemented';
import { primaryTextValue } from '../fhirUtil';

const itemDate = (item, category) => {
  let date = null;
  try {
    switch (category) {
      case 'Conditions':
        date = item.onsetDateTime || item.dateRecorded;
        break;
      case 'Lab Results':
      case 'Vital Signs':
      case 'Diagnostic Report':
        date = item.effectiveDateTime;
        break;
      case 'Observation-Other':
        date = item.effectiveDateTime ? item.effectiveDateTime : null;
        break;
      case 'Social History':
        date = new Date().toISOString().substring(0, 10); // Use today's date
        break;
      case 'Meds Statement':
        date = tryWithDefault(item, (item) => item.dateAsserted,
          tryWithDefault(item, (item) => item.effectivePeriod.start,
            tryWithDefault(item, (item) => item.dosage[0].timing.repeat.boundsPeriod.start, null)));
        break;
      case 'Meds Requested':
        date = tryWithDefault(item, (item) => item.dosageInstruction[0].timing.repeat.boundsPeriod.start,
          tryWithDefault(item, (item) => item.authoredOn, item.dateWritten));
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
      case 'List':
        date = item.date;
        break;
      case 'Procedure Requests':
        date = item.orderedOn || item.scheduledDateTime;
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
      case 'Care Plan':
      case 'Encounters':
      case 'Coverage':
        date = item.period.start;
        break;
      case 'Benefits':
      case 'Claims':
        date = item.billablePeriod.start;
        break;
      case 'Imaging Study':
        date = item.started;
        break;

      default:
        return null; // Items without a date
    }
  } catch (err) {
    log(`*** ${category} -- date error: ${err.message} ***`);
    return null;
  }

  if (date) {
    return date;
  }
  log(`*** ${category} -- no date found! ***`);
  return null;
};

// See queryOptions()
const isCategory = (input, value) => {
  //      console.log('input.category: ' + JSON.stringify(input.category,null,3));
  if (input?.category) {
    if (input.category.text === value) {
      return true;
    } if (input.category.coding) {
      return input.category.coding[0].code === value || input.category.coding[0].display === value;
    } if (input.category[0]) {
      if (input.category[0].coding) {
        return input.category[0].coding[0].code === value || input.category[0].coding[0].display === value;
      }
      return false;
    }
    return false;
  }
  return false;
};

const queryOptions = {
  locals: {
    isCategory: (input, value) => isCategory(input, value),
    isNotCategory: (input, value) => !isCategory(input, value),
  },
};

// This is derived from src/components/CatalogView/index.js, line 185:
const getCoding = (record) => {
  const codeObj = classFromCat(record.category).code(record);
  const code = tryWithDefault(codeObj, (codeObj) => codeObj.coding[0].code, tryWithDefault(codeObj, (codeObj) => codeObj.code, '????'));
  const display = primaryTextValue(codeObj);
  return { code, display: display === Const.unknownValue ? `All ${record.category}` : display };
};

// const categoriesForProviderTemplate = ({ participantId }) => ({
const categoriesForProviderTemplate = {
  Patient: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Patient]'),
  Conditions: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Condition]'),
  'Lab Results': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation]'
    + '[*:isCategory(Laboratory)|:isCategory(laboratory)]', queryOptions),
  'Vital Signs': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation]'
    + '[*:isCategory(Vital Signs)|:isCategory(vital-signs)]', queryOptions),
  'Social History': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation]'
    + '[*:isCategory(Social History)]', queryOptions),
  'Meds Statement': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationStatement]'),

  'Meds Requested': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationOrder|resourceType=MedicationRequest]'),
  //   'Meds Requested':        e => e.entry.reduce((res, elt) => {
  //                 (elt.resource.resourceType === 'MedicationOrder' ||
  //            elt.resource.resourceType === 'MedicationRequest') && res.push(elt.resource);
  //                 return res }, []),

  'Meds Dispensed': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationDispense]'),
  'Meds Administration': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationAdministration]'),
  Immunizations: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Immunization]'),
  Procedures: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Procedure]')
    .concat(
      FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation][*:isCategory(procedure)]', queryOptions),
    ),
  'Procedure Requests': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=ProcedureRequest]'),
  'Document References': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=DocumentReference]'),
  Allergies: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=AllergyIntolerance]'),
  Benefits: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=ExplanationOfBenefit]'),
  Claims: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Claim]'),
  Encounters: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Encounter]'),
  Exams: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation]'
    + '[*:isCategory(Exam)|:isCategory(exam)]', queryOptions),

  // Currently unsupported
  Practitioner: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Practitioner]'),
  List: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=List]'),
  Questionnaire: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Questionnaire]'),
  'Questionnaire Response': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=QuestionnaireResponse]'),
  'Observation-Other': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation]'
    + '[*:isNotCategory(Laboratory)&:isNotCategory(laboratory)'
    + '&:isNotCategory(Vital Signs)&:isNotCategory(vital-signs)'
    + '&:isNotCategory(Social History)&:isNotCategory(procedure)'
    + '&:isNotCategory(Exam)&:isNotCategory(exam)]', queryOptions),
  'Diagnostic Report': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=DiagnosticReport]'),
  'Care Plan': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=CarePlan]'),
  Medication: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Medication]'),
  Organization: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Organization]'),
  Goal: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Goal]'),
  Basic: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Basic]'),
  'Immunization Recommendation': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=ImmunizationRecommendation]'),
  'Imaging Study': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=ImagingStudy]'),
  Coverage: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Coverage]'),
  'Related Person': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=RelatedPerson]'),
  Device: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Device]'),
};
// });

const checkResourceCoverage = (rawResponseData, normalizedResources, participantId) => {
  for (const providerName in rawResponseData) {
    if (rawResponseData[providerName].error) {
      alert(`Could not read resources from provider ${providerName}`);
    } else {
      const initialResourceIDs = rawResponseData[providerName].entry.map((elt) => elt.resource.id);
      const finalResourceIDs = normalizedResources.filter((elt) => elt.provider === providerName).map((elt) => elt.data.id);
      if (finalResourceIDs.length !== initialResourceIDs.length) {
        // eslint-disable-next-line max-len
        const missingResources = initialResourceIDs.filter((id) => !finalResourceIDs.includes(id)).map((id) => rawResponseData[providerName].entry.find((elt) => elt.resource.id === id));
        alert(`Participant ${participantId} (${providerName}) has ${
          finalResourceIDs.length} resources but should have ${initialResourceIDs.length}`);
        log(JSON.stringify(missingResources, null, 3));
      }
    }
  }
};

// Template/function for the full merged data set
export const normalizeResourcesAndInjectPartipantId = (participantId) => (data) => {
  const result = [];
  for (const provider in data) {
    if (data[provider].error) {
      console.error('data[providerName].error: ', data[provider].error); // eslint-disable-line no-console
      // Error response
      if (!result.Error) {
        // Init container
        result.Error = {};
      }
      result.Error[provider] = data[provider].error;
    } else {
      // Valid data for this provider
      const obj = FhirTransform.transform(data[provider], categoriesForProviderTemplate);
      for (const category in obj) {
        if (obj[category] === null || obj[category] === undefined || (obj[category] instanceof Array && obj[category].length === 0)) {
          // Ignore empty top-level item
        } else {
          // Flatten data
          for (const record of obj[category]) {
            // for (const record in obj[propName]) {
            result.push({
              provider,
              category,
              itemDate: itemDate(record, category),
              id: participantId, // TODO: this should be called participantId, not id ("id" implies uuid?)
              data: record,
            });
          }
        }
      }
    }
  }
  // TODO: extract patient from raw response, 1st, then pass to this function:
  const patient = result.find(({ category }) => category === 'Patient');
  // 2nd pass -- TODO: consolidate into same loop, ^above?
  return result.map((record) => {
    const displayCoding = getCoding(record);
    // category === 'Patient' records will not have a patientAgeAtRecord:
    // TODO: perhaps patientAgeAtRecord should be a duration, that is converted to presentation format in components via date-fns/i18n:
    const patientAgeAtRecord = formatAge(patient.data.birthDate, record.itemDate, '') || '';
    record.displayCoding = displayCoding;
    record.patientAgeAtRecord = patientAgeAtRecord;
    return record;
  });
};

export const generateRecordsDictionary = (normalized) => normalized.reduce((acc, record) => {
  const { data: { id: uuid } } = record;
  // console.info('uuid: ', uuid);
  if (acc[uuid]) {
    console.info(`record ${uuid} already exists. (category = ${record.category})`); // eslint-disable-line no-console
  }
  return {
    ...acc,
    [uuid]: record,
  };
}, {});

export const generateLegacyResources = (rawResponseData, normalizedResources, participantId) => {
  const legacyResources = new FhirTransform(normalizedResources);
  // const resources = (response.data, this.participantId);
  checkResourceCoverage(rawResponseData, normalizedResources, participantId); // Check whether we "found" all resources
  return legacyResources;
};

export const computeFilterParams = (legacyResources) => {
  const itemDates = cleanDates(legacyResources.pathItem('itemDate'));

  if (itemDates.length === 0) {
    throw new Error('No matching resources returned');
  }

  const minDate = itemDates[0]; // Earliest date we have data for this participant
  const firstYear = parseInt(minDate.substring(0, 4)); // minDate's year
  const startDate = `${firstYear}-01-01`; // Jan 1 of minDate's year
  const maxDate = itemDates[itemDates.length - 1]; // The latest date we have data for this participant
  const lastYear = parseInt(maxDate.substring(0, 4)); // maxDate's year
  const incr = timelineIncrYears(minDate, maxDate, config.maxSinglePeriods); // Number of years between timeline ticks
  const endDate = `${lastYear + incr - (lastYear - firstYear) % incr - 1}-12-31`; // Dec 31 of last year of timeline tick periods
  const normDates = normalizeDates(itemDates, startDate, endDate);
  const allDates = itemDates.map((date, index) => ({ position: normDates[index], date }));
  const dates = {
    allDates, minDate, startDate, maxDate, endDate,
  };

  return {
    dates,
    dateRangeStart: minDate.substring(0, 10),
    dateRangeEnd: maxDate.substring(0, 10),
  };
};

// Return sorted array of all provider names for this participant
export const extractProviders = (records) => {
  const providersSet = new Set();
  if (records) {
    for (const key in records) {
      const record = records[key];
      // Add the found provider
      providersSet.add(record.provider);
    }
  }
  return [...providersSet].sort();
};

// Return sorted array of all populated category names for this participant
export const extractCategories = (records) => {
  // const { legacy: legacyResources } = this.props.resources;
  const categoriesSet = new Set();
  if (records) {
    for (const key in records) {
      const record = records[key];
      if (record.category === 'Patient') {
        // Ignore
      } else if (Unimplemented.unimplementedCats.includes(record.category)) {
        // Add the "Unimplemented" category
        categoriesSet.add(Unimplemented.catName);
      } else {
        // Add the found category
        categoriesSet.add(record.category);
      }
    }
  }
  return [...categoriesSet].sort();
};
