import React from 'react';

import { fhirKey } from './fhirUtil.js';

import Allergies from './components/Allergies';
import Benefits from './components/Benefits';
import Claims from './components/Claims';
import Conditions from './components/Conditions';
import DocumentReferences from './components/DocumentReferences';
import Encounters from './components/Encounters';
import Exams from './components/Exams';
import Immunizations from './components/Immunizations';
import LabResults from './components/LabResults';
import MedsAdministration from './components/MedsAdministration';
import MedsDispensed from './components/MedsDispensed';
import MedsRequested from './components/MedsRequested';
import MedsStatement from './components/MedsStatement';
import Procedures from './components/Procedures';
import ProcedureRequests from './components/ProcedureRequests';
import SocialHistory from './components/SocialHistory';
import VitalSigns from './components/VitalSigns';
import Unimplemented from './components/Unimplemented';

import './components/ContentPanel/ContentPanel.css';
import { log } from './utils/logger';

export const Const = {
  unknownValue: '????',
  trimNone: 'none',
  trimExpected: 'expected',
  trimMax: 'max',
};

const noDate = '<no date>';

export function getStyle(oElm, css3Prop) {
  try {
    if (window.getComputedStyle) {
      return getComputedStyle(oElm).getPropertyValue(css3Prop);
    } if (oElm.currentStyle) {
      return oElm.currentStyle[css3Prop];
    }
  } catch (e) {
    return '';
  }
}

export function stringCompare(a, b) {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  if (aLower === bLower) {
    return 0;
  } if (aLower < bLower) {
    return -1;
  } // aLower > bLower
  return 1;
}

// Do arrays have the same contents, checking for element-by-element strict equality
export function shallowEqArray(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}

// Do arrays have the same contents, checking for element-by-element stringify equality
export function stringifyEqArray(arr1, arr2) {
  try {
    if (arr1.length !== arr2.length) {
      return false;
    }
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i] && JSON.stringify(arr1[i]) !== JSON.stringify(arr2[i])) {
        return false;
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function formatDisplayDate(date, fillShortDates, surpressTime) {
  let strDate = `${date}`;
  const locale = 'en-US';

  if (fillShortDates) {
    strDate = strDate.length === 4 ? strDate += '-01' : strDate;
    strDate = strDate.length === 7 ? strDate += '-01' : strDate;
    //      let options = surpressTime ? { year: 'numeric', month: 'short', day: '2-digit' }
    //         : { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true };
    const options = surpressTime ? { year: 'numeric', month: 'short', day: 'numeric' }
      : {
        year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
      };
    return new Date(strDate).toLocaleDateString(locale, options).replace(' PM', 'pm').replace(' AM', 'am');
  }
  const options = surpressTime ? (strDate.length === 4 ? { year: 'numeric' }
    : (strDate.length === 7 ? { year: 'numeric', month: 'short' }
      : { year: 'numeric', month: 'short', day: '2-digit' }))
  //         : { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true };
    : {
      year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
    };
  return new Date(strDate).toLocaleDateString(locale, options).replace(' PM', 'pm').replace(' AM', 'am');
}

export function formatKeyDate(date) {
  let strDate = `${date}`;

  strDate = strDate.length === 4 ? strDate += '-01' : strDate;
  strDate = strDate.length === 7 ? strDate += '-01' : strDate;

  const tLoc = strDate.indexOf('T');
  if (tLoc === -1) {
    // No time present
    return strDate;
  }
  // Drop time
  return strDate.substring(0, tLoc);
}

// XXXX
// export function formatKey(date, category, provider) {
//   return `${formatKeyDate(date)}_${category}_${provider}`;
// }

// export function formatKey(res) {
//   return `${formatKeyDate(res.itemDate)}_${res.category}_${res.provider}_${res.data.id}`;
// }

export function formatKey(res) {
  return `${formatKeyDate(res.itemDate)}_${res.category}`;
}

export function formatAge(birthDate, ageDate, prefix) {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const MAX_ONLY_DAYS = 21; // Max age to show just as "days"
  const MAX_ONLY_WEEKS = 10; // Max age to show just as "weeks"
  const DAYS_PER_WEEK = 7;
  const AVG_DAYS_PER_MONTH = 30.4;

  const startDate = new Date(birthDate);
  const endDate = new Date(ageDate);

  if (!ageDate) {
    return null;
  } if (endDate < startDate) {
    return 'ALERT: Date is prior to birth';
  } if (endDate - startDate < DAY_MS) {
    return 'birth date';
  }
  const diffDate = new Date(endDate - startDate);
  const years = diffDate.toISOString().slice(0, 4) - 1970;
  const months = diffDate.getMonth();
  const days = diffDate.getDate();
  const weeks = Math.floor((months * AVG_DAYS_PER_MONTH + days) / DAYS_PER_WEEK);

  if (years === 0 && months === 0 && days <= MAX_ONLY_DAYS) {
    return prefix + days + (days === 1 ? ' day' : ' days');
  } if (years === 0 && weeks <= MAX_ONLY_WEEKS) {
    return `${prefix + weeks} weeks`;
  }
  return prefix + (years > 0 ? `${years}yr` : '') + (years > 0 && months > 0 ? ' ' : '') + (months > 0 ? `${months}mo` : '');
}

// TODO: cleanup when determine not to show disabled header, eliminate header highlight
export function formatContentHeader(isEnabled, category, res, appContext) {
//   let dateOnly = formatKeyDate(res.itemDate);
  const dateWithTime = res.itemDate ? formatDisplayDate(res.itemDate, true, false) : noDate;
  const dob = appContext.resources.pathItem('[category=Patient].data.birthDate');
  const age = formatAge(dob, res.itemDate, 'age ');
  //   let highlight = appContext.highlightedResources &&
  //       appContext.highlightedResources.some(elt => elt.category === category  && elt.itemDate === res.itemDate);
  const highlight = false;

  //      <div className={isEnabled ? 'content-header-container' : 'content-header-container-disabled'} id={dateOnly} data-fhir={fhirKey(res)}>

  return !isEnabled ? null : (
    <div className={isEnabled ? 'content-header-container' : 'content-header-container-disabled'} data-fhir={fhirKey(res)}>
      <div className={isEnabled ? (highlight ? 'content-header-highlight' : 'content-header') : 'content-header-disabled'}>{category}</div>
      <div className={isEnabled ? 'content-header-date' : 'content-header-date-disabled'}>{dateWithTime}</div>
      { appContext.trimLevel === Const.trimNone && age
      && (
      <div className={isEnabled ? 'content-header-age' : 'content-header-age-disabled'}>
        |&nbsp;
        {age}
      </div>
      ) }
      <div className="content-header-padding" />
    </div>
  );
}

export function formatDPs(number, places) {
  const mult = Math.pow(10, places);
  return parseFloat(Math.round(number * mult) / mult).toFixed(places);
}

// Is accessor(data) defined?
export function isValid(data, accessor) {
  try {
    return accessor(data) !== undefined;
  } catch (e) {
    return false;
  }
}

// If accessor(data) is defined return accessor(data) else return defaultVal
export function tryWithDefault(data, accessor, defaultVal) {
  try {
    const accessorVal = accessor(data);
    if (accessorVal === undefined) {
      return defaultVal;
    }
    return accessorVal;
  } catch (e) {
    return defaultVal;
  }
}

// Acronyms that should be displayed all uppercase
const acronyms = ['Bmi', 'Lac', 'Ucla'];

// Words that should be displayed all lowercase
const minorWords = ['A', 'An', 'And', 'As', 'At', 'But', 'By', 'For', 'From', 'In',
  'Into', 'Near', 'Nor', 'Of', 'On', 'Onto', 'Or', 'The', 'To', 'With'];

export function titleCase(str) {
  const finalWords = [];
  const words = str.toLowerCase().split(' ');

  for (let index = 0; index < words.length; index++) {
    const word = words[index];

    if (word.includes('/')) {
      finalWords.push(word.split('/').map((word) => titleCase(word)).join('/'));
    } else if (word.includes('-')) {
      finalWords.push(word.split('-').map((word) => titleCase(word)).join('-'));
    } else if (word !== '') {
      const tcWord = word.replace(word[0], word[0].toUpperCase());
      if (acronyms.indexOf(tcWord) >= 0) {
        // Uppercase acronyms
        finalWords.push(tcWord.toUpperCase());
      } else if (minorWords.indexOf(tcWord) >= 0 && index > 0) {
        // Lowercase minor words, unless first
        finalWords.push(tcWord.toLowerCase());
      } else {
        // Title case word
        finalWords.push(tcWord);
      }
    }
  }

  return finalWords.join(' ');
}

export function numericPart(val) {
  const index = val.toString().search(/[A-Za-z%]/);
  return parseFloat(val.toString().substring(0, index));
}

export function unitPart(val) {
  const index = val.toString().search(/[A-Za-z%]/);
  return val.toString().substring(index);
}

//
// Concatenate n arrays, skipping null elements
//
export function combine() {
  let res = [];
  for (let i = 0; i < arguments.length; i++) {
    if (arguments[i]) {
      res = res.concat(arguments[i]);
    }
  }
  return res;
}

// Remove nulls and duplicates from dateArray, then sort in ascending order
export function cleanDates(dateArray) {
  return dateArray.filter((value, index) => value !== null && dateArray.indexOf(value) === index)
    .sort((a, b) => new Date(b) - new Date(a)).reverse();
}

// Normalize an array of dates by comparing elements to 'min' (returning 0.0) and 'max' (returning 1.0)
//   (if min == max then return 0.5)
export function normalizeDates(elts, minDate, maxDate) {
  const min = (minDate instanceof Date) ? minDate : new Date(minDate);
  const max = (maxDate instanceof Date) ? maxDate : new Date(maxDate);
  const delta = max - min;
  return elts.map((elt) => ((delta === 0) ? 0.5 : (((elt instanceof Date) ? elt : new Date(elt)) - min) / delta));
}

// Determine the increment/skip factor (in years) for timeline tickmarks
//   (dates are in ISO format)
export function timelineIncrYears(minDate, maxDate, maxSinglePeriods) {
  const firstYear = new Date(formatKeyDate(minDate)).getUTCFullYear();
  const lastYear = new Date(formatKeyDate(maxDate)).getUTCFullYear();
  const incr = Math.max(1, Math.ceil((lastYear - firstYear + 1) / maxSinglePeriods));

  return incr;
}

// Check whether a date (string or Date object) is within a date range (strings or Date objects)
export function inDateRange(date, rangeLow, rangeHigh) {
  const dateStr = (date instanceof Date ? date : new Date(date)).toISOString().substring(0, 10);
  const rangeLowStr = (rangeLow instanceof Date ? rangeLow : new Date(rangeLow)).toISOString().substring(0, 10);
  const rangeHighStr = (rangeHigh instanceof Date ? rangeHigh : new Date(rangeHigh)).toISOString().substring(0, 10);

  return dateStr >= rangeLowStr && dateStr <= rangeHighStr;
}

// document.querySelector with check
export function checkQuerySelector(sel) {
  const elt = document.querySelector(sel);
  if (elt) {
    return elt;
  }
  log(`checkQuerySelector -- cannot find: ${sel}`);
  //      debugger;
}

//
// Return elements of 'arr' that are unique according to 'keyFn'
//
export function uniqueBy(arr, keyFn) {
  const seen = {};
  return arr.filter((elt, index) => {
    try {
      const key = keyFn(elt);
      return seen.hasOwnProperty(key) ? false : seen[key] = true;
    } catch (e) {
      return false;
    }
  });
}

//
// Check for "content equality"
// NOTE: returns true if either a or b is circular
//
export function notEqJSON(a, b) {
  let aJSON = null;
  let aCirc = false;
  try {
    aJSON = JSON.stringify(a);
  } catch (e) {
    aCirc = true;
  }

  let bJSON = null;
  let bCirc = false;
  try {
    bJSON = JSON.stringify(b);
  } catch (e) {
    bCirc = true;
  }

  return aCirc || bCirc || aJSON !== bJSON;
}

//
// Log differences between two data structures ('was', 'now') to the console
//
export function logDiffs(label, was, now) {
  switch (typeof was) {
    case 'object':
      if (was instanceof Array && !(now instanceof Array)) {
        log(`${label}: Array --> ${now}`);
      } else if (was instanceof Array) {
        // An array
        console.group(label);
        for (let i = 0; i < was.length; i++) {
          //      if (JSON.stringify(was[i]) !== JSON.stringify(now[i])) {
          if (notEqJSON(was[i], now[i])) {
            // Element changed
            logDiffs(`[${i}]`, was[i], now[i]);
          }
        }
        console.groupEnd();
      } else if (was === null) {
        // null
        //      if (JSON.stringify(was) !== JSON.stringify(now)) {
        if (notEqJSON(was, now)) {
          // Changed
          log(`${label}: ${was} --> ${now}`);
        }
      } else {
        // An object
        console.group(label);
        for (const attr in was) {
          if (now && now.hasOwnProperty(attr)) {
            // Property present in both objects
            if (notEqJSON(was[attr], now[attr])) {
              //
              //         let prior = '<circular>';
              //         try {
              //      prior = JSON.stringify(was[attr]);
              //         } catch (e) {}
              //         let current = '<circular>';
              //         try {
              //      current = JSON.stringify(now[attr]);
              //         } catch (e) {}
              /// /         if (JSON.stringify(was[attr]) !== JSON.stringify(now[attr])){
              //         if (prior !== current) {
              //
              // Property changed
              logDiffs(`.${attr}`, was[attr], now[attr]);
            }
          } else {
            // Only in 'was'
            log(`.${attr} --> <unset>`);
          }
        }
        console.groupEnd();
      }
      break;

    case 'function':
      if (was !== now) {
        // Function changed
        log(`Function ${label} changed.`);
      }
      break;

    case 'string':
    case 'number':
    case 'boolean':
    case 'undefined':
      if (was !== now) {
        log(`${label}: ${was} --> ${now}`);
      }
      break;

    default:
      break;
  }

  // Log object props only present in 'now'
  if (typeof now === 'object' && now !== null && !(now instanceof Array)) {
    console.group(label);
    for (const attr in now) {
      if (now.hasOwnProperty(attr)) {
        if (was && was.hasOwnProperty(attr)) {
          // Present in 'was' or both -- already reported
        } else {
          // Only in 'now'
          //      console.log(`.${attr} not previously set`);
          log(`.${attr}: <unset> --> ${now[attr]}`);
        }
      }
    }
    console.groupEnd();
  }
}

//
// Use category name to access static class members
//
export function classFromCat(cat) {
  switch (cat) {
    case Allergies.catName:
      return Allergies;
    case Benefits.catName:
      return Benefits;
    case Claims.catName:
      return Claims;
    case Conditions.catName:
      return Conditions;
    case DocumentReferences.catName:
      return DocumentReferences;
    case Encounters.catName:
      return Encounters;
    case Exams.catName:
      return Exams;
    case Immunizations.catName:
      return Immunizations;
    case LabResults.catName:
      return LabResults;
    case MedsAdministration.catName:
      return MedsAdministration;
    case MedsDispensed.catName:
      return MedsDispensed;
    case MedsRequested.catName:
      return MedsRequested;
    case MedsStatement.catName:
      return MedsStatement;
    case Procedures.catName:
      return Procedures;
    case ProcedureRequests.catName:
      return ProcedureRequests;
    case SocialHistory.catName:
      return SocialHistory;
    case VitalSigns.catName:
      return VitalSigns;
    case Unimplemented.catName:
    default:
      return Unimplemented;
  }
}

//
// Group elements of 'arr' according to 'keyFn'
//
export function groupBy(arr, keyFn) {
  const groups = {};
  for (const elt of arr) {
    const groupKey = keyFn(elt);
    if (groups[groupKey]) {
      groups[groupKey].push(elt);
    } else {
      groups[groupKey] = [elt];
    }
  }
  return groups;
}

//
// Return the date portion of an ISO date string
//
export function dateOnly(date) {
  return date ? date.split('T')[0] : noDate;
}

//
// Deebug console print control function
//
export function debPrint(tag) {
  return window.debPrint && window.debPrint[tag];
}
