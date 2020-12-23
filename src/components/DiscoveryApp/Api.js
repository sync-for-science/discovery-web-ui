import { get } from 'axios';
import FhirTransform from '../../FhirTransform';
import {
  cleanDates, normalizeDates, timelineIncrYears, tryWithDefault,
} from '../../util';
import config from '../../config';
import { log } from '../../utils/logger';

export default class API {
  constructor(participantId, setState) {
    this.participantId = participantId;
    this.mySetState = setState;
  }

  setState(obj) {
    console.error('setState: ', obj);
    this.mySetState(obj);
  }

  fetch(dataUrl) {
    return get(dataUrl)
      .then((response) => {
        // Non-empty response?
        if (Object.getOwnPropertyNames(response.data).length !== 0) {
          const resources = new FhirTransform(response.data, this.topTemplate);

          this.checkResourceCoverage(resources); // Check whether we "found" all resources

          const itemDates = cleanDates(resources.pathItem('itemDate'));

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

          this.setState({
            resources,
            dates,
            thumbLeftDate: minDate,
            thumbRightDate: maxDate,
            isLoading: false,
          },
          () => this.setState({
            providers: this.providers,
            // totalResCount: this.state.resources.transformed.filter((elt) => elt.category !== 'Patient').length,
          }));
        } else {
          this.setState({
            fetchError: { message: 'Invalid Participant ID' },
            isLoading: false,
          });
        }
      })
      .catch((fetchError) => this.setState({ fetchError, isLoading: false }));
  }

  checkResourceCoverage(resources) {
    for (const providerName in resources.initial) {
      if (resources.initial[providerName].error) {
        alert(`Could not read resources from provider ${providerName}`);
      } else {
        const initialResourceIDs = resources.initial[providerName].entry.map((elt) => elt.resource.id);
        const finalResourceIDs = resources.transformed.filter((elt) => elt.provider === providerName).map((elt) => elt.data.id);
        if (finalResourceIDs.length !== initialResourceIDs.length) {
          // eslint-disable-next-line max-len
          const missingResources = initialResourceIDs.filter((id) => !finalResourceIDs.includes(id)).map((id) => resources.initial[providerName].entry.find((elt) => elt.resource.id === id));
          const { match: { params: { participantId } } } = this.props;
          alert(`Participant ${participantId} (${providerName}) has ${
            finalResourceIDs.length} resources but should have ${initialResourceIDs.length}`);
          log(JSON.stringify(missingResources, null, 3));
        }
      }
    }
  }

  // See queryOptions()
  isCategory(input, value) {
    //      console.log('input.category: ' + JSON.stringify(input.category,null,3));
    if (input && input.category) {
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
  }

  // Options for jsonQuery -- see https://www.npmjs.com/package/json-query
  get queryOptions() {
    return {
      locals: {
        isCategory: (input, value) => this.isCategory(input, value),
        isNotCategory: (input, value) => !this.isCategory(input, value),
      },
    };
  }

  // Collect resources by category from a provider section of the merged data set
  // (functions in the template will be replaced with their return values)
  get categoriesForProviderTemplate() {
    return {
      Patient: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Patient]'),
      Conditions: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Condition]'),
      'Lab Results': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation]'
        + '[*:isCategory(Laboratory)|:isCategory(laboratory)]', this.queryOptions),
      'Vital Signs': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation]'
        + '[*:isCategory(Vital Signs)|:isCategory(vital-signs)]', this.queryOptions),
      'Social History': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation]'
        + '[*:isCategory(Social History)]', this.queryOptions),
      'Meds Statement': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationStatement]'),

      'Meds Requested': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationOrder|resourceType=MedicationRequest]'),
      //   'Meds Requested':        e => e.entry.reduce((res, elt) => {
      //                 (elt.resource.resourceType === 'MedicationOrder' ||
      //            elt.resource.resourceType === 'MedicationRequest') && res.push(elt.resource);
      //                 return res }, []),

      'Meds Dispensed': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationDispense]'),
      'Meds Administration': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=MedicationAdministration]'),
      Immunizations: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Immunization]'),
      Procedures: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Procedure]').concat(
        FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation][*:isCategory(procedure)]', this.queryOptions),
      ),
      'Procedure Requests': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=ProcedureRequest]'),
      'Document References': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=DocumentReference]'),
      Allergies: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=AllergyIntolerance]'),
      Benefits: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=ExplanationOfBenefit]'),
      Claims: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Claim]'),
      Encounters: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Encounter]'),
      Exams: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation]'
        + '[*:isCategory(Exam)|:isCategory(exam)]', this.queryOptions),

      // Currently unsupported
      Practitioner: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Practitioner]'),
      List: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=List]'),
      Questionnaire: (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Questionnaire]'),
      'Questionnaire Response': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=QuestionnaireResponse]'),
      'Observation-Other': (e) => FhirTransform.getPathItem(e, 'entry.resource[*resourceType=Observation]'
        + '[*:isNotCategory(Laboratory)&:isNotCategory(laboratory)'
        + '&:isNotCategory(Vital Signs)&:isNotCategory(vital-signs)'
        + '&:isNotCategory(Social History)&:isNotCategory(procedure)'
        + '&:isNotCategory(Exam)&:isNotCategory(exam)]', this.queryOptions),
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
  }

  itemDate(item, category) {
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
  }

  // Template/function for the full merged data set
  get topTemplate() {
    return (data) => {
      const result = [];
      for (const providerName in data) {
        if (data[providerName].error) {
          // Error response
          if (!result.Error) {
            // Init container
            result.Error = {};
          }
          result.Error[providerName] = data[providerName].error;
        } else {
          // Valid data for this provider
          const obj = FhirTransform.transform(data[providerName], this.categoriesForProviderTemplate);
          for (const propName in obj) {
            if (obj[propName] === null || obj[propName] === undefined || (obj[propName] instanceof Array && obj[propName].length === 0)) {
              // Ignore empty top-level item
            } else {
              // Flatten data
              for (const elt of obj[propName]) {
                result.push({
                  provider: providerName,
                  category: propName,
                  itemDate: this.itemDate(elt, propName),
                  id: this.participantId,
                  data: elt,
                });
              }
            }
          }
        }
      }
      return result;
    };
  }
}
