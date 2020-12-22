import React from 'react';

import './components/ContentPanel/ContentPanel.css';
import './components/ContentPanel/ContentPanelCategories.css';
import { log } from './utils/logger';

import FhirTransform from './FhirTransform.js';
import {
  Const, stringCompare, formatDisplayDate, formatKeyDate, formatDPs, isValid, tryWithDefault, titleCase, classFromCat,
} from './util.js';
import TimeSeries from './components/TimeSeries';

import CondDiv from './components/CondDiv';
import HighlightDiv from './components/HighlightDiv';

import Annotation from './components/Annotation';

function dropFinalDigits(str) {
  const firstDigitIndex = str.search(/[0-9]/);
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

  const nameElt = Array.isArray(name) ? name[0] : name;
  if (!nameElt) {
    return '';
  }

  //   let prefix = Array.isArray(nameElt.prefix) ? nameElt.prefix : [ nameElt.prefix ];
  const given = Array.isArray(nameElt.given) ? nameElt.given : [nameElt.given];
  const family = Array.isArray(nameElt.family) ? nameElt.family : [nameElt.family];
  const suffix = Array.isArray(nameElt.suffix) ? nameElt.suffix : [nameElt.suffix];

  return [
    //      prefix.map(elt => String(elt || '').trim()).join(' '),
    dropFinalDigits(given.map((elt) => String(elt || '').trim()).join(' ')),
    dropFinalDigits(family.map((elt) => String(elt || '').trim()).join(' ')),
    suffix.map((elt) => String(elt || '').trim()).join(' '),
  ].filter(Boolean).join(' ').replace(/\s\s+/g, ' ');
}

export function formatPatientAddress(address) {
  if (!address) {
    return '';
  }

  const addr = Array.isArray(address) ? address[0] : address;
  if (!addr) {
    return '';
  }

  const line = Array.isArray(addr.line) ? addr.line : [addr.line];

  return `${line.map((elt) => String(elt || '').trim()).join('\n')}\n${
    addr.city}, ${addr.state} ${addr.postalCode}\n${
    addr.country}`;
}

export function formatPatientMRN(identifier, maxLength) {
  const identElts = Array.isArray(identifier) ? identifier : [identifier];
  for (const elt of identElts) {
    try {
      if (elt.type.coding[0].code === 'MR') {
        return maxLength === 0 || elt.value.length <= maxLength ? elt.value : `...${elt.value.substring(elt.value.length - maxLength)}`;
      }
    } catch (e) {
      log(`formatPatientMRN(): ${e.message}`);
    }
  }

  return 'Unknown';
}

export function fhirKey(elt) {
  return `${elt.provider}/${elt.data.id}`;
}

export function resKey(elt) {
  const id = elt.resourceId || elt.data.id;
  return `${elt.provider}/${id}`;
}

export function renderAllergies(matchingData, appContext) {
  const found = [];
  for (const elt of matchingData) {
    try {
      found.push({
        provider: elt.provider,
        clinicalStatus: elt.data.clinicalStatus,
        resourceId: elt.data.id,
        display: classFromCat(elt.category).primaryText(elt),
        annotation: Annotation.info(elt),
        verificationStatus: elt.data.verificationStatus,
        type: elt.data.type,
        category: elt.data.category,
        criticality: elt.data.criticality,
        substance: elt.data.substance,
        reaction: elt.data.reaction,
      });
    } catch (e) {
      log(`renderAllergies(): ${e.message}`);
    }
  }

  if (found.length > 0) {
    const isMultipleProviders = appContext.providers.length > 1;
    return found.map((elt, index) => (
      <div className={index < found.length - 1 ? 'content-container' : 'content-container-last'} key={index} data-res={resKey(elt)}>
        <div className="content-data">
          { elt.display && <div className="col01 label">Allergy</div> }
          { elt.display && <HighlightDiv className="col02 value-text primary" matchingResources={matchingData}>{elt.display}</HighlightDiv> }

          { isMultipleProviders && <div className="col01 label">Provider</div> }
          { isMultipleProviders && <div className="col02 value-text">{titleCase(elt.provider)}</div> }

          { elt.clinicalStatus && <div className="col01 label">Clinical status</div> }
          { elt.clinicalStatus && <div className="col02 value-text">{elt.clinicalStatus}</div> }

          <CondDiv check={elt.verificationStatus} expected="confirmed">
            <div className="col01 label">Verification</div>
            <div className="col02 value-text">{elt.verificationStatus}</div>
          </CondDiv>

          { elt.type && <div className="col01 label">Type</div> }
          { elt.type && <div className="col02 value-text">{elt.type}</div> }

          { elt.category && <div className="col01 label">Category</div> }
          { elt.category && <div className="col02 value-text">{elt.category}</div> }

          { elt.criticality && <div className="col01 label">Criticality</div> }
          { elt.criticality && <div className="col02 value-text">{elt.criticality}</div> }

          { elt.substance && <div className="col01 label">Substance</div> }
          { elt.substance && <div className="col02 value-text">{elt.substance.coding[0].display}</div> }

          { elt.reaction && <div className="col01 label">Reaction</div> }
          { elt.reaction && (
          <div className="col02 value-text">
            { tryWithDefault(elt, (elt) => elt.reaction[0].manifestation[0].coding[0].display,
              tryWithDefault(elt, (elt) => elt.reaction[0].manifestation[0].text, Const.unknownValue)) }
          </div>
          ) }
        </div>
        <div className="content-graph" />
        <div className="content-extras">
          <Annotation annotation={elt.annotation} />
        </div>
      </div>
    ));
  }
  return null;
}

const highlightDivisions = [1, 0.80, 0.50, 0.20, 0];
// var highlightDivisionNames = [ 'CONFIRMED', 'LIKELY', 'UNLIKELY', 'DISCONFIRMED' ];
const highlightDivisionClasses = ['consult-highlight-confirmed', 'consult-highlight-likely', 'consult-highlight-unlikely', 'consult-highlight-disconfirmed'];

function probToDivision(prob) {
  const cats = highlightDivisions.length - 1;
  for (let i = 0; i < cats; i++) {
    if (prob <= highlightDivisions[i] && prob > highlightDivisions[i + 1]) {
      return i;
    }
  }
  return 3; // prob == 0 ends up here
}

const consultCases = {
  3001: {
    Conditions: {
      418: [
        {
          prob: 0.90,
          source: 'NLP AI, Inc',
        },
      ],
      438: [
        {
          prob: 0.32,
          source: 'Benefits AI, Inc',
        },
        {
          prob: 0.52,
          source: 'NLP AI, Inc',
        },
      ],
      457: [
        {
          prob: 0.15,
          source: 'NLP AI, Inc',
        },
      ],
    },
    Allergies: {
    },
  },
  3017: {
    Conditions: {
      6459: [
        {
          prob: 1.00,
          source: 'Benefits AI, Inc',
        },
      ],
      6488: [
        {
          prob: 0.80,
          source: 'Labs  AI, Inc',
        },
      ],
    },
  },
};

function consultText(appContext, elt) {
  if (appContext.viewName === 'Consult' && isValid(consultCases, (cC) => cC[elt.participantId][elt.category][elt.resourceId])) {
    const defList = consultCases[elt.participantId][elt.category][elt.resourceId];
    const divs = [];
    for (const def of defList) {
      const division = probToDivision(def.prob);
      //   let text = def.source + ':\u2002' + Math.trunc(def.prob * 100) + '% (' + highlightDivisionNames[division] + ')';
      const text = `${def.source}:\u2002${Math.trunc(def.prob * 100)}%`;
      divs.push(<div className={highlightDivisionClasses[division]} key={divs.length}>{text}</div>);
    }
    return divs;
  }
  return '';
}

//
// renderDisplay()
//
// Used by Conditions, DocumentReferences, MedsAdministration, Procedures, ProcedureRequests
//
export function renderDisplay(matchingData, typeLabel, appContext) {
  const found = [];
  for (const elt of matchingData) {
    try {
      found.push({
        provider: elt.provider,
        category: elt.category,
        participantId: elt.id,
        resourceId: elt.data.id,
        display: classFromCat(elt.category).primaryText(elt),
        annotation: Annotation.info(elt),
        status: elt.data.status,
        clinicalStatus: elt.data.clinicalStatus,
        abatement: elt.data.abatementDateTime,
        orderedBy: tryWithDefault(elt, (elt) => elt.data.orderer.display, undefined),
        verificationStatus: elt.data.verificationStatus,
        reason: elt.data.reasonReference,
        valueQuantity: elt.data.valueQuantity,
      });
    } catch (e) {
      log(`renderDisplay(): ${e.message}`);
    }
  }

  if (found.length > 0) {
    const isMultipleProviders = appContext.providers.length > 1;
    return found.map((elt, index) => (
      <div className={index < found.length - 1 ? 'content-container' : 'content-container-last'} key={index} data-res={resKey(elt)}>
        <div className="content-data">
          { elt.display && <div className="col01 label">{typeLabel}</div> }
          {/* elt.display && <div className='col02 value-text primary'>{elt.display}{consultText(appContext, elt)}</div> */}
          { elt.display && (
          <HighlightDiv className="col02 value-text primary" matchingResources={matchingData}>
            {elt.display}
            {consultText(appContext, elt)}
          </HighlightDiv>
          ) }

          { elt.valueQuantity && <div className="col01 label">Result</div> }
          { elt.valueQuantity && <div className="col02 value-number">{`${elt.valueQuantity.value} ${elt.valueQuantity.unit}`}</div> }

          { isValid(elt, (e) => e.reason[0].code) && <div className="col01 label">Reason</div> }
          { isValid(elt, (e) => e.reason[0].code) && <div className="col02 value-text">{elt.reason[0].code.coding[0].display}</div> }

          { isValid(elt, (e) => e.reason[0].onsetDateTime) && <div className="col01 label">Onset</div> }
          { isValid(elt, (e) => e.reason[0].onsetDateTime)
          && <div className="col02 value-text">{formatDisplayDate(elt.reason[0].onsetDateTime, false, false)}</div> }

          { isValid(elt, (e) => e.reason[0].abatementDateTime) && <div className="col01 label">Abatement</div> }
          { isValid(elt, (e) => e.reason[0].abatementDateTime)
          && <div className="col02 value-text">{formatDisplayDate(elt.reason[0].abatementDateTime, false, false)}</div> }

          { elt.abatement && <div className="col01 label">Abatement</div> }
          { elt.abatement && <div className="col02 value-text">{formatDisplayDate(elt.abatement, false, false)}</div> }

          { elt.orderedBy && <div className="col01 label">Ordered By</div> }
          { elt.orderedBy && <div className="col02 value-text">{elt.orderedBy}</div> }

          { isValid(elt, (e) => e.reason[0].assertedDate) && <div className="col01 label">Asserted</div> }
          { isValid(elt, (e) => e.reason[0].assertedDate)
          && <div className="col02 value-text">{formatDisplayDate(elt.reason[0].assertedDate, false, false)}</div> }

          { isMultipleProviders && <div className="col01 label">Provider</div> }
          { isMultipleProviders && <div className="col02 value-text">{titleCase(elt.provider)}</div> }

          <CondDiv check={elt.status} expected={['final', 'completed']}>
            <div className="col01 label">Status</div>
            <div className="col02 value-text">{elt.status}</div>
          </CondDiv>

          { elt.clinicalStatus && <div className="col01 label">Clinical status</div> }
          { elt.clinicalStatus && <div className="col02 value-text">{elt.clinicalStatus}</div> }

          <CondDiv check={elt.verificationStatus} expected="confirmed">
            <div className="col01 label">Verification</div>
            <div className="col02 value-text">{elt.verificationStatus}</div>
          </CondDiv>
        </div>

        <div className="content-graph" />
        <div className="content-extras">
          <Annotation annotation={elt.annotation} />
        </div>
      </div>
    ));
  }
  return null;
}

export function renderMedsStatement(matchingData, typeLabel, appContext) {
  const found = [];
  for (const elt of matchingData) {
    try {
      found.push({
        provider: elt.provider,
        category: elt.category,
        participantId: elt.id,
        resourceId: elt.data.id,
        display: classFromCat(elt.category).primaryText(elt),
        annotation: Annotation.info(elt),
        taken: elt.data.taken,
        status: elt.data.status,
        clinicalStatus: elt.data.clinicalStatus,
        verificationStatus: elt.data.verificationStatus,
        reason: elt.data.reasonReference,
        valueQuantity: elt.data.valueQuantity,
      });
    } catch (e) {
      log(`renderMedsStatement(): ${e.message}`);
    }
  }

  if (found.length > 0) {
    const isMultipleProviders = appContext.providers.length > 1;
    return found.map((elt, index) => (
      <div className={index < found.length - 1 ? 'content-container' : 'content-container-last'} key={index} data-res={resKey(elt)}>
        <div className="content-data">
          { elt.display && <div className="col01 label">{typeLabel}</div> }
          {/* elt.display && <div className='col02 value-text primary'>{elt.display}{consultText(appContext, elt)}</div> */}
          { elt.display && (
          <HighlightDiv className="col02 value-text primary" matchingResources={matchingData}>
            {elt.display}
            {consultText(appContext, elt)}
          </HighlightDiv>
          ) }

          { elt.valueQuantity && <div className="col01 label">Result</div> }
          { elt.valueQuantity && <div className="col02 value-number">{`${elt.valueQuantity.value} ${elt.valueQuantity.unit}`}</div> }

          { isValid(elt, (e) => e.reason[0].code) && <div className="col01 label">Reason</div> }
          { isValid(elt, (e) => e.reason[0].code) && <div className="col02 value-text">{elt.reason[0].code.coding[0].display}</div> }

          { isValid(elt, (e) => e.reason[0].onsetDateTime) && <div className="col01 label">Onset</div> }
          { isValid(elt, (e) => e.reason[0].onsetDateTime)
          && <div className="col02 value-text">{formatDisplayDate(elt.reason[0].onsetDateTime, false, false)}</div> }

          { isValid(elt, (e) => e.reason[0].abatementDateTime) && <div className="col01 label">Abatement</div> }
          { isValid(elt, (e) => e.reason[0].abatementDateTime)
          && <div className="col02 value-text">{formatDisplayDate(elt.reason[0].abatementDateTime, false, false)}</div> }

          { isValid(elt, (e) => e.reason[0].assertedDate) && <div className="col01 label">Asserted</div> }
          { isValid(elt, (e) => e.reason[0].assertedDate)
          && <div className="col02 value-text">{formatDisplayDate(elt.reason[0].assertedDate, false, false)}</div> }

          { isMultipleProviders && <div className="col01 label">Provider</div> }
          { isMultipleProviders && <div className="col02 value-text">{titleCase(elt.provider)}</div> }

          <CondDiv check={elt.status} expected={['final', 'completed', 'active']}>
            <div className="col01 label">Status</div>
            <div className="col02 value-text">{elt.status}</div>
          </CondDiv>

          { elt.clinicalStatus && <div className="col01 label">Clinical status</div> }
          { elt.clinicalStatus && <div className="col02 value-text">{elt.clinicalStatus}</div> }

          <CondDiv check={elt.taken} expected="y">
            <div className="col01 label">Taken</div>
            <div className="col02 value-text">{elt.taken}</div>
          </CondDiv>

          <CondDiv check={elt.verificationStatus} expected="confirmed">
            <div className="col01 label">Verification</div>
            <div className="col02 value-text">{elt.verificationStatus}</div>
          </CondDiv>
        </div>

        <div className="content-graph" />
        <div className="content-extras">
          <Annotation annotation={elt.annotation} />
        </div>
      </div>
    ));
  }
  return null;
}

export function renderImmunizations(matchingData, appContext) {
  const found = [];
  for (const elt of matchingData) {
    try {
      found.push({
        provider: elt.provider,
        id: elt.data.id,
        resourceId: elt.data.id,
        display: classFromCat(elt.category).primaryText(elt),
        status: elt.data.status,
        annotation: Annotation.info(elt),
        notGiven: elt.data.notGiven,
        wasNotGiven: elt.data.wasNotGiven,
        reported: elt.data.reported,
        primarySource: elt.data.primarySource,
      });
    } catch (e) {
      log(`renderImmunizations(): ${e.message}`);
    }
  }

  if (found.length > 0) {
    const isMultipleProviders = appContext.providers.length > 1;
    return found.map((elt, index) => (
      <div className={index < found.length - 1 ? 'content-container' : 'content-container-last'} key={index} data-res={resKey(elt)}>
        <div className="content-data">
          { elt.display && <div className="col01 label">Vaccine</div> }
          { elt.display && <HighlightDiv className="col02 value-text primary" matchingResources={matchingData}>{elt.display}</HighlightDiv> }

          <CondDiv check={[elt.notGiven, elt.wasNotGiven]} expected={false}>
            <div className="col01 label">Given</div>
            { elt.notGiven !== undefined && <div className="col02 value-text">{elt.notGiven ? 'no' : 'yes'}</div> }
            { elt.wasNotGiven !== undefined && <div className="col02 value-text">{elt.wasNotGiven ? 'no' : 'yes'}</div> }
          </CondDiv>

          <CondDiv check={elt.reported} expected={false}>
            <div className="col01 label">Reported</div>
            <div className="col02 value-text">{elt.reported ? 'yes' : 'no'}</div>
          </CondDiv>

          <CondDiv check={elt.primarySource} expected>
            <div className="col01 label">Primary Source</div>
            <div className="col02 value-text">{elt.primarySource ? 'yes' : 'no'}</div>
          </CondDiv>

          { isMultipleProviders && <div className="col01 label">Provider</div> }
          { isMultipleProviders && <div className="col02 value-text">{titleCase(elt.provider)}</div> }

          <CondDiv check={elt.status} expected={['final', 'completed']}>
            <div className="col01 label">Status</div>
            <div className="col02 value-text">{elt.status}</div>
          </CondDiv>
        </div>

        <div className="content-graph" />
        <div className="content-extras">
          <Annotation annotation={elt.annotation} />
        </div>
      </div>
    ));
  }
  return null;
}

export function renderLabs(matchingData, resources, dotClickFn, appContext) {
  // Collect info to display from matchingData
  const found = [];
  for (const elt of matchingData) {
    try {
      found.push({
        provider: elt.provider,
        date: elt.itemDate instanceof Date ? elt.itemDate : new Date(elt.itemDate),
        resourceId: elt.data.id,
        display: classFromCat(elt.category).primaryText(elt),
        valueRatio: elt.data.valueRatio,
        valueQuantity: elt.data.valueQuantity,
        valueString: elt.data.valueString,
        referenceRange: elt.data.referenceRange,
        status: elt.data.status,
        annotation: Annotation.info(elt),
      });
    } catch (e) {
      log(`renderLabs(): ${e.message}`);
    }
  }

  // Collect full set of series (by display string) to graph from resources
  const series = {};
  const match = FhirTransform.getPathItem(resources.transformed, '[*category=Lab Results]');
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
    } catch (e) {
      log(`renderLabs() 2: ${e.message}`);
    }
  }

  if (found.length > 0) {
    const isMultipleProviders = appContext.providers.length > 1;
    return found.map((elt, index) => {
      let highlightValue = false;
      const value = tryWithDefault(elt, (elt) => elt.valueQuantity.value, null);
      const valueUnits = tryWithDefault(elt, (elt) => elt.valueQuantity.unit, null);
      const valueRatioDisplay = elt.valueRatio ? `${elt.valueRatio.numerator.value} / ${elt.valueRatio.denominator.value}` : null;

      let refRangeLabel;
      let refRange;

      if (elt.referenceRange) {
        try {
          refRangeLabel = elt.referenceRange[0].meaning.coding[0].display;
        } catch (e) {
          refRangeLabel = 'Reference Range';
        }

        try {
          const lowValue = elt.referenceRange[0].low.value;
          const lowUnits = elt.referenceRange[0].low.unit;

          const highValue = elt.referenceRange[0].high.value;
          const highUnits = elt.referenceRange[0].high.unit;

          // Construct reference range
          refRange = `${lowValue + (lowUnits && lowUnits !== highUnits ? ` ${lowUnits}` : '')} - ${highValue}${highUnits ? ` ${highUnits}` : ''}`;

          // Highlight the measured value if outside of the reference range
          highlightValue = valueUnits === lowUnits && valueUnits === highUnits && (value < lowValue || value > highValue);
        } catch (e) {
          refRange = elt.referenceRange.text;
        }
      }

      // Select only values with matching provider and then sort
      const sortedSeries = series[elt.display] && series[elt.display].filter((e) => e.provider === elt.provider)
        .sort((a, b) => stringCompare(a.x.toISOString(), b.x.toISOString()));
      const thisValue = elt.valueQuantity ? elt.valueQuantity.value : null;

      return (
        <div
          className={index < found.length - 1 ? 'content-container' : 'content-container-last'}
          key={index}
          id={`${formatKeyDate(elt.date.toISOString())}-${elt.display}`}
          data-res={resKey(elt)}
        >
          <div className="content-data">
            { elt.display && <div className="col01 label">Measure</div> }
            { elt.display && <HighlightDiv className="col02 value-text primary" matchingResources={matchingData}>{elt.display}</HighlightDiv> }

            { elt.valueQuantity && <div className="col01 label">Value</div> }
            { elt.valueQuantity && (
            <div className={`col02 value-number${highlightValue ? ' highlight' : ''}`}>
              {formatDPs(elt.valueQuantity.value, 1) + (elt.valueQuantity.unit ? ` ${elt.valueQuantity.unit}` : '') }
            </div>
            ) }

            { valueRatioDisplay && <div className="col01 label">Value Ratio</div> }
            { valueRatioDisplay && <div className="col02 value-number">{valueRatioDisplay}</div> }

            { elt.valueString && <div className="col01 label">Value</div> }
            { elt.valueString && <div className="col02 value-text">{elt.valueString}</div> }

            { elt.referenceRange && <div className="col01 label">{refRangeLabel}</div> }
            { elt.referenceRange && <div className="col02 value-text">{refRange}</div> }

            { isMultipleProviders && <div className="col01 label">Provider</div> }
            { isMultipleProviders && <div className="col02 value-text">{titleCase(elt.provider)}</div> }

            <CondDiv check={elt.status} expected="final">
              <div className="col01 label">Status</div>
              <div className="col02 value-text">{elt.status}</div>
            </CondDiv>
          </div>
          <div className="content-graph">
            { sortedSeries && <TimeSeries measure={elt.display} data={sortedSeries} highlights={[{ x: elt.date, y: thisValue }]} dotClickFn={dotClickFn} /> }
          </div>
          <div className="content-extras">
            <Annotation annotation={elt.annotation} />
          </div>
        </div>
      );
    });
  }
  return null;
}

//
// renderMeds()
//
// Used by MedsDispensed, MedsRequested
//
export function renderMeds(matchingData, appContext) {
  const found = [];
  for (const elt of matchingData) {
    try {
      found.push({
        provider: elt.provider,
        resourceId: elt.data.id,
        display: classFromCat(elt.category).primaryText(elt),
        quantity: elt.data.quantity,
        daysSupply: elt.data.daysSupply,
        dosageInstruction: elt.data.dosageInstruction,
        dispenseRequest: elt.data.dispenseRequest,
        status: elt.data.status,
        reason: elt.data.reasonReference,
        annotation: Annotation.info(elt),
      });
    } catch (e) {
      log(`renderMeds(): ${e.message}`);
    }
  }

  if (found.length > 0) {
    const isMultipleProviders = appContext.providers.length > 1;
    return found.map((elt, index) => (
      <div className={index < found.length - 1 ? 'content-container' : 'content-container-last'} key={index} data-res={resKey(elt)}>
        <div className="content-data">
          { elt.display && <div className="col01 label">Medication</div> }
          { elt.display && <HighlightDiv className="col02 value-text primary" matchingResources={matchingData}>{elt.display}</HighlightDiv> }

          { isValid(elt, (e) => e.reason[0].code) && <div className="col01 label">Reason</div> }
          { isValid(elt, (e) => e.reason[0].code) && <div className="col02 value-text">{elt.reason[0].code.coding[0].display}</div> }

          { isValid(elt, (e) => e.reason[0].onsetDateTime) && <div className="col01 label">Onset</div> }
          { isValid(elt, (e) => e.reason[0].onsetDateTime)
          && <div className="col02 value-text">{formatDisplayDate(elt.reason[0].onsetDateTime, false, false)}</div> }

          { isValid(elt, (e) => e.reason[0].abatementDateTime) && <div className="col01 label">Abatement</div> }
          { isValid(elt, (e) => e.reason[0].abatementDateTime)
          && <div className="col02 value-text">{formatDisplayDate(elt.reason[0].abatementDateTime, false, false)}</div> }

          { isValid(elt, (e) => e.reason[0].assertedDate) && <div className="col01 label">Asserted</div> }
          { isValid(elt, (e) => e.reason[0].assertedDate)
          && <div className="col02 value-text">{formatDisplayDate(elt.reason[0].assertedDate, false, false)}</div> }

          { isMultipleProviders && <div className="col01 label">Provider</div> }
          { isMultipleProviders && <div className="col02 value-text">{titleCase(elt.provider)}</div> }

          <CondDiv check={elt.status} expected={['active', 'completed']}>
            <div className="col01 label">Status</div>
            <div className="col02 value-text">{elt.status}</div>
          </CondDiv>

          { elt.quantity && <div className="col01 label">Quantity</div> }
          { elt.quantity && <div className="col02 value-text">{`${elt.quantity.value} ${elt.quantity.unit}`}</div> }

          { elt.daysSupply && <div className="col01 label">Supply</div> }
          { elt.daysSupply && <div className="col02 value-text">{`${elt.daysSupply.value} ${elt.daysSupply.unit}`}</div> }

          { isValid(elt, (e) => e.dosageInstruction[0].text) && <div className="col01 label">Dosage</div> }
          { isValid(elt, (e) => e.dosageInstruction[0].text) && <div className="col02 value-text">{elt.dosageInstruction[0].text}</div> }

          { isValid(elt, (e) => e.dosageInstruction[0].timing.repeat.boundsPeriod.start) && <div className="col01 label">Starting on</div> }
          { isValid(elt, (e) => e.dosageInstruction[0].timing.repeat.boundsPeriod.start)
          && <div className="col02 value-text">{formatDisplayDate(elt.dosageInstruction[0].timing.repeat.boundsPeriod.start, true, true)}</div> }

          { isValid(elt, (e) => e.dispenseRequest.numberOfRepeatsAllowed) && <div className="col01 label">Refills</div> }
          { isValid(elt, (e) => e.dispenseRequest.numberOfRepeatsAllowed)
          && <div className="col02 value-text">{elt.dispenseRequest.numberOfRepeatsAllowed}</div> }
        </div>
        <div className="content-graph" />
        <div className="content-extras">
          <Annotation annotation={elt.annotation} />
        </div>
      </div>
    ));
  }
  return null;
}

export function renderSocialHistory(matchingData, appContext) {
  const found = [];
  for (const elt of matchingData) {
    try {
      found.push({
        provider: elt.provider,
        resourceId: elt.data.id,
        display: classFromCat(elt.category).primaryText(elt),
        status: elt.data.status,
        annotation: Annotation.info(elt),
        value: elt.data.valueCodeableConcept.coding[0].display,
      });
    } catch (e) {
      log(`renderSocialHistory(): ${e.message}`);
    }
  }

  if (found.length > 0) {
    const isMultipleProviders = appContext.providers.length > 1;
    return found.map((elt, index) => (
      <div className={index < found.length - 1 ? 'content-container' : 'content-container-last'} key={index} data-res={resKey(elt)}>
        <div className="content-data">
          { elt.display && <div className="col01 label">Type</div> }
          { elt.display && <HighlightDiv className="col02 value-text primary" matchingResources={matchingData}>{elt.display}</HighlightDiv> }

          <div className="col01 label">Value</div>
          <div className="col02 value-text">{elt.value}</div>

          { isMultipleProviders && <div className="col01 label">Provider</div> }
          { isMultipleProviders && <div className="col02 value-text">{titleCase(elt.provider)}</div> }

          <CondDiv check={elt.status} expected="final">
            <div className="col01 label">Status</div>
            <div className="col02 value-text">{elt.status}</div>
          </CondDiv>
        </div>

        <div className="content-graph" />
        <div className="content-extras">
          <Annotation annotation={elt.annotation} />
        </div>
      </div>
    ));
  }
  return null;
}

export function renderEncounters(matchingData, appContext) {
  const found = [];
  for (const elt of matchingData) {
    try {
      found.push({
        provider: elt.provider,
        status: elt.data.status,
        resourceId: elt.data.id,
        display: classFromCat(elt.category).primaryText(elt),
        annotation: Annotation.info(elt),
        date: elt.itemDate,
        class: elt.data.class.code ? elt.data.class.code : elt.data.class,
        period: elt.data.period,
      });
    } catch (e) {
      log(`renderEncounters(): ${e.message}`);
    }
  }

  if (found.length > 0) {
    const isMultipleProviders = appContext.providers.length > 1;
    return found.map((elt, index) => (
      <div className={index < found.length - 1 ? 'content-container' : 'content-container-last'} key={index} data-res={resKey(elt)}>
        <div className="content-data">
          { elt.display && <div className="col01 label">Type</div> }
          { elt.display && <HighlightDiv className="col02 value-text primary" matchingResources={matchingData}>{elt.display}</HighlightDiv> }

          { elt.period.start !== elt.period.end && <div className="col01 label">Ending</div> }
          { elt.period.start !== elt.period.end && <div className="col02 value-text">{formatDisplayDate(elt.period.end, true, false)}</div> }

          <div className="col01 label">Class</div>
          <div className="col02 value-text">{elt.class}</div>

          <CondDiv check={elt.status} expected="finished">
            <div className="col01 label">Status</div>
            <div className="col02 value-text">{elt.status}</div>
          </CondDiv>

          { isMultipleProviders && <div className="col01 label">Provider</div> }
          { isMultipleProviders && <div className="col02 value-text">{titleCase(elt.provider)}</div> }
        </div>

        <div className="content-graph" />
        <div className="content-extras">
          <Annotation annotation={elt.annotation} />
        </div>
      </div>
    ));
  }
  return null;
}

export function renderUnimplemented(matchingData, appContext) {
  const found = [];
  for (const elt of matchingData) {
    try {
      found.push({ provider: elt.provider, category: elt.category, resourceId: elt.data.id });
    } catch (e) {
      log(`renderUnimplemented(): ${e.message}`);
    }
  }

  if (found.length > 0) {
    const isMultipleProviders = appContext.providers.length > 1;
    return found.map((elt, index) => (
      <div className={index < found.length - 1 ? 'content-container' : 'content-container-last'} key={index} data-res={resKey(elt)}>
        <div className="content-data">
          <div className="col01 label">{elt.category}</div>
          <HighlightDiv className="col02 value-text primary" matchingResources={matchingData}>Pending</HighlightDiv>

          { isMultipleProviders && <div className="col01 label">Provider</div> }
          { isMultipleProviders && <div className="col02 value-text">{titleCase(elt.provider)}</div> }
        </div>

        <div className="content-graph" />
        <div className="content-extras" />
      </div>
    ));
  }
  return null;
}

// Remove extraneous words from vital signs labels
function trimVitalsLabels(label) {
  return label.replace(/blood/gi, '').replace(/pressure/gi, '');
}

// Canonicalize vital signs display names
export function canonVitals(display) {
  return titleCase(display.replace(/_/g, ' '));
}

export function renderVitals(matchingData, resources, dotClickFn, appContext) {
  // Collect info to display from matchingData
  const found = [];
  for (const elt of matchingData) {
    try {
      // Don't display Vital Signs "container" resources with related elements
      const displayStr = canonVitals(classFromCat(elt.category).primaryText(elt));

      if (displayStr !== 'Vital Signs') {
        found.push({
          provider: elt.provider,
          resourceId: elt.data.id,
          date: elt.itemDate instanceof Date ? elt.itemDate : new Date(elt.itemDate),
          display: displayStr,
          annotation: Annotation.info(elt),
          value: isValid(elt, (e) => e.data.valueQuantity) ? elt.data.valueQuantity.value : undefined,
          unit: isValid(elt, (e) => e.data.valueQuantity) ? elt.data.valueQuantity.unit : undefined,
          component: elt.data.component,
          status: elt.data.status,
        });
      }
    } catch (e) {
      log(`renderVitals(): ${e.message}`);
    }
  }

  // Collect full set of series (by display string) to graph from resources
  const series = {};
  const match = FhirTransform.getPathItem(resources.transformed, '[*category=Vital Signs]');
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
          const y1 = tryWithDefault(elt, (e) => e.data.component[0].valueQuantity.value, 0);
          const y2 = tryWithDefault(elt, (e) => e.data.component[1].valueQuantity.value, 0);
          const yVal = (y1 + y2) / 2;
          const yVar = Math.abs(y2 - y1);
          if (series.hasOwnProperty(displayStr)) {
            // Add to series
            series[displayStr].push({
              provider: elt.provider, x: xVal, y: yVal, yVariance: yVar, y1, y2,
            });
          } else {
            // New series
            series[displayStr] = [{
              provider: elt.provider, x: xVal, y: yVal, yVariance: yVar, y1, y2,
            }];
          }
        }
      }
    } catch (e) {
      log(`renderVitals() 2: ${e.message}`);
    }
  }

  if (found.length > 0) {
    const isMultipleProviders = appContext.providers.length > 1;
    return found.sort((a, b) => stringCompare(a.display, b.display)).map((elt, index) => {
      // Select only values with matching provider and then sort
      const sortedSeries = series[elt.display] && series[elt.display].filter((e) => e.provider === elt.provider)
        .sort((a, b) => stringCompare(a.x.toISOString(), b.x.toISOString()));
      const thisValue = elt.value ? elt.value
        : (tryWithDefault(elt, (e) => e.component[0].valueQuantity.value, 0)
        + tryWithDefault(elt, (e) => e.component[1].valueQuantity.value, 0)) / 2;

      return (
        <div
          className={index < found.length - 1 ? 'content-container' : 'content-container-last'}
          key={index}
          id={`${formatKeyDate(elt.date.toISOString())}-${elt.display}`}
          data-res={resKey(elt)}
        >
          <div className="content-data">
            { elt.display && <div className="col01 label">Measure</div> }
            { elt.display && <HighlightDiv className="col02 value-text primary" matchingResources={matchingData}>{elt.display}</HighlightDiv> }

            { elt.value && <div className="col01 label">Value</div> }
            { elt.value && <div className="col02 value-number">{`${formatDPs(elt.value, 1)} ${elt.unit}`}</div> }

            { elt.component && <div className="col01 label">{trimVitalsLabels(elt.component[0].code.coding[0].display)}</div> }
            { elt.component && (
            <div className="col02 value-number">
              { `${tryWithDefault(elt, (e) => formatDPs(e.component[0].valueQuantity.value, 1), Const.unknownValue)} ${
                tryWithDefault(elt, (e) => e.component[0].valueQuantity.unit, Const.unknownValue)}`}
            </div>
            ) }

            { elt.component && <div className="col01 label">{trimVitalsLabels(elt.component[1].code.coding[0].display)}</div> }
            { elt.component && (
            <div className="col02 value-number">
              { `${tryWithDefault(elt, (e) => formatDPs(e.component[1].valueQuantity.value, 1), Const.unknownValue)} ${
                tryWithDefault(elt, (e) => e.component[1].valueQuantity.unit, Const.unknownValue)}`}
            </div>
            ) }

            { isMultipleProviders && <div className="col01 label">Provider</div> }
            { isMultipleProviders && <div className="col02 span07 value-text">{titleCase(elt.provider)}</div> }

            <CondDiv check={elt.status} expected="final">
              <div className="col01 label">Status</div>
              <div className="col02 value-text">{elt.status}</div>
            </CondDiv>
          </div>
          <div className="content-graph">
            { sortedSeries && <TimeSeries measure={elt.display} data={sortedSeries} highlights={[{ x: elt.date, y: thisValue }]} dotClickFn={dotClickFn} /> }
          </div>
          <div className="content-extras">
            <Annotation annotation={elt.annotation} />
          </div>
        </div>
      );
    });
  }
  return null;
}

function renderContainedResource(res, index, appContext) {
  const payload = [];
  switch (res.resourceType) {
    case 'Coverage':
      payload.push(<div className="col01 label" key={`${index}-1`}>Coverage</div>);
      payload.push(<div className="col02 value-text" key={`${index}-2`}>{res.type.text}</div>);
      break;
    case 'ReferralRequest':
      payload.push(<div className="col01 label" key={`${index}-1`}>Referral</div>);
      payload.push(<div className="col02 value-text" key={`${index}-2`}>{res.status}</div>);
      break;
    default:
      payload.push(<div className="col01 label" key={`${index}-1`}>{res.resourceType}</div>);
      payload.push(<div className="col02 value-text" key={`${index}-2`}>{Const.unknownValue}</div>);
      break;
  }
  return payload;
}

function renderContained(contained, appContext) {
  return contained.map((elt, index) => renderContainedResource(elt, index, appContext));
}

export function renderEOB(matchingData, appContext) {
  const found = [];
  for (const elt of matchingData) {
    try {
      found.push({
        provider: elt.provider,
        totalCost: elt.data.totalCost,
        totalBenefit: elt.data.totalBenefit,
        resourceId: elt.data.id,
        claimType: elt.data.type,
        billablePeriod: elt.data.billablePeriod,
        status: elt.data.status,
        contained: elt.data.contained,
        careTeam: elt.data.careTeam,
        diagnosis: elt.data.diagnosis,
        annotation: Annotation.info(elt),
      });
    } catch (e) {
      log(`renderEOB(): ${e.message}`);
    }
  }

  if (found.length > 0) {
    const isMultipleProviders = appContext.providers.length > 1;
    return found.map((elt, index) => (
      <div className={index < found.length - 1 ? 'content-container' : 'content-container-last'} key={index} data-res={resKey(elt)}>
        <div className="content-data">
          <div className="col01 label">Claim type</div>
          <HighlightDiv className="col02 value-text primary" matchingResources={matchingData}>{elt.claimType.coding[0].display}</HighlightDiv>

          <div className="col01 label">Period</div>
          <div className="col02 value-text">
            { formatDisplayDate(elt.billablePeriod.start, true, true) }
            &nbsp;&nbsp;&mdash;&nbsp;
            { formatDisplayDate(elt.billablePeriod.end, true, true) }
          </div>

          <div className="col01 label">Total cost</div>
          <div className="col02 value-number">{`${elt.totalCost.value.toFixed(2)} ${elt.totalCost.code}`}</div>

          <div className="col01 label">Total benefit</div>
          { elt.totalBenefit ? <div className="col02 value-number">{`${elt.totalBenefit.value.toFixed(2)} ${elt.totalBenefit.code}`}</div>
            : <div className="col02 value-text">unknown</div> }

          { isMultipleProviders && <div className="col01 label">Provider</div> }
          { isMultipleProviders && <div className="col02 value-text">{titleCase(elt.provider)}</div> }

          { isValid(elt, (e) => e.diagnosis[0].diagnosisReference.code) && <div className="col01 label">Diagnosis</div> }
          { isValid(elt, (e) => e.diagnosis[0].diagnosisReference.code)
          && <div className="col02 value-text">{elt.diagnosis[0].diagnosisReference.code.coding[0].display}</div> }

          <CondDiv check={elt.status} expected="active">
            <div className="col01 label">Status</div>
            <div className="col02 value-text">{elt.status}</div>
          </CondDiv>

          { isValid(elt, (e) => e.careTeam[0].role.coding[0].display) && <div className="col01 label">Role</div> }
          { isValid(elt, (e) => e.careTeam[0].role.coding[0].display) && <div className="col02 value-text">{elt.careTeam[0].role.coding[0].display}</div> }

          { elt.contained && renderContained(elt.contained, appContext) }
        </div>

        <div className="content-graph" />
        <div className="content-extras">
          <Annotation annotation={elt.annotation} />
        </div>
      </div>
    ));
  }
  return null;
}

export function renderClaims(matchingData, appContext) {
  const found = [];
  for (const elt of matchingData) {
    try {
      found.push({
        provider: elt.provider,
        total: elt.data.total,
        billablePeriod: elt.data.billablePeriod,
        resourceId: elt.data.id,
        status: elt.data.status,
        use: elt.data.use,
        diagnosis: elt.data.diagnosis,
        annotation: Annotation.info(elt),
      });
    } catch (e) {
      log(`renderClaims(): ${e.message}`);
    }
  }

  if (found.length > 0) {
    const isMultipleProviders = appContext.providers.length > 1;
    return found.map((elt, index) => (
      <div className={index < found.length - 1 ? 'content-container' : 'content-container-last'} key={index} data-res={resKey(elt)}>
        <div className="content-data">
          <div className="col01 label">Period</div>
          <HighlightDiv className="col02 value-text primary" matchingResources={matchingData}>
            { formatDisplayDate(elt.billablePeriod.start, true, true) }
            &nbsp;&nbsp;&mdash;&nbsp;
            { formatDisplayDate(elt.billablePeriod.end, true, true) }
          </HighlightDiv>

          <div className="col01 label">Total</div>
          <div className="col02 value-number">{`${elt.total.value.toFixed(2)} ${elt.total.code}`}</div>

          { isMultipleProviders && <div className="col01 label">Provider</div> }
          { isMultipleProviders && <div className="col02 value-text">{titleCase(elt.provider)}</div> }

          { isValid(elt, (e) => e.diagnosis[0].diagnosisReference.code) && <div className="col01 label">Diagnosis</div> }
          { isValid(elt, (e) => e.diagnosis[0].diagnosisReference.code)
          && <div className="col02 value-text">{elt.diagnosis[0].diagnosisReference.code.coding[0].display}</div> }

          <CondDiv check={elt.status} expected="active">
            <div className="col01 label">Status</div>
            <div className="col02 value-text">{elt.status}</div>
          </CondDiv>

          <CondDiv check={elt.use} expected="complete">
            <div className="col01 label">Use</div>
            <div className="col02 value-text">{elt.use}</div>
          </CondDiv>
        </div>

        <div className="content-graph" />
        <div className="content-extras">
          <Annotation annotation={elt.annotation} />
        </div>
      </div>
    ));
  }
  return null;
}

export function renderExams(matchingData, appContext) {
  const found = [];
  for (const elt of matchingData) {
    try {
      found.push({
        provider: elt.provider,
        resourceId: elt.data.id,
        display: classFromCat(elt.category).primaryText(elt),
        status: elt.data.status,
        annotation: Annotation.info(elt),
        valueQuantity: elt.data.valueQuantity,
        valueConcept: elt.data.valueCodeableConcept,
      });
    } catch (e) {
      log(`renderExams(): ${e.message}`);
    }
  }

  if (found.length > 0) {
    const isMultipleProviders = appContext.providers.length > 1;
    return found.map((elt, index) => (
      <div className={index < found.length - 1 ? 'content-container' : 'content-container-last'} key={index} data-res={resKey(elt)}>
        <div className="content-data">
          { elt.display && <div className="col01 label">Type</div> }
          { elt.display && <HighlightDiv className="col02 value-text primary" matchingResources={matchingData}>{elt.display}</HighlightDiv> }

          { (elt.valueQuantity || elt.valueConcept) && <div className="col01 label">Value</div> }
          { elt.valueQuantity && <div className="col02 value-text">{`${elt.valueQuantity.value} ${elt.valueQuantity.unit}`}</div> }
          { elt.valueConcept && <div className="col02 value-text">{elt.valueConcept.coding[0].display}</div> }

          { isMultipleProviders && <div className="col01 label">Provider</div> }
          { isMultipleProviders && <div className="col02 value-text">{titleCase(elt.provider)}</div> }

          <CondDiv check={elt.status} expected="final">
            <div className="col01 label">Status</div>
            <div className="col02 value-text">{elt.status}</div>
          </CondDiv>
        </div>

        <div className="content-graph" />
        <div className="content-extras">
          <Annotation annotation={elt.annotation} />
        </div>
      </div>
    ));
  }
  return null;
}

// Fix inconsistencies between our category names and FHIR names
function patchCatName(catName) {
  switch (catName) {
    case 'Condition':
      return 'Conditions';
    default:
      return catName;
  }
}

export function resolveDiagnosisReference(elt, appContext) {
  if (isValid(elt, (elt) => elt.data.diagnosis[0].diagnosisReference.reference) && !elt.data.diagnosis[0].diagnosisReference.code) {
    const [refCatOrig, refId] = elt.data.diagnosis[0].diagnosisReference.reference.split('/');
    const refCat = patchCatName(refCatOrig);
    const res = appContext.resources.transformed.find((res) => res.provider === elt.provider && res.category === refCat && res.data.id === refId);

    // Add the de-referenced data to the reasonReference element
    if (res) {
      elt.data.diagnosis[0].diagnosisReference = Object.assign(elt.data.diagnosis[0].diagnosisReference, res.data);
    } else {
      log(`**** resolveDiagnosisReference(): Cannot find ${elt.data.diagnosis[0].diagnosisReference.reference}`);
    }
  }
}

export function resolveReasonReference(elt, appContext) {
  if (isValid(elt, (elt) => elt.data.reasonReference[0].reference) && !elt.data.reasonReference[0].code) {
    const [refCatOrig, refId] = elt.data.reasonReference[0].reference.split('/');
    const refCat = patchCatName(refCatOrig);
    const res = appContext.resources.transformed.find((res) => res.provider === elt.provider && res.category === refCat && res.data.id === refId);

    // Add the de-referenced data to the reasonReference element
    if (res) {
      elt.data.reasonReference[0] = Object.assign(elt.data.reasonReference[0], res.data);
    } else {
      log(`**** resolveReasonReference(): Cannot find ${elt.data.reasonReference[0].reference}`);
    }
  }
}

export function resolveMedicationReference(elt, appContext) {
  if (isValid(elt, (elt) => elt.data.medicationReference.reference) && !elt.data.medicationReference.code) {
    const [refCat, refId] = elt.data.medicationReference.reference.split('/');
    const res = appContext.resources.transformed.find((res) => res.provider === elt.provider && res.category === refCat && res.data.id === refId);

    // Add the de-referenced data to the medicationReference element and create the medicationCodeableConcept element
    if (res) {
      elt.data.medicationReference = Object.assign(elt.data.medicationReference, res.data);
    } else {
      log(`**** resolveMedicationReference(): Cannot find ${elt.data.medicationReference.reference}`);
    }
    elt.data.medicationCodeableConcept = res ? res.data.code : { coding: [{ code: Const.unknownValue, display: Const.unknownValue }] };

    // elt should be added to matchingData
    return true;
  }
  return false;
}

//
// Default primary text value from a category's code object
//
export function primaryTextValue(code) {
  return tryWithDefault(code, (code) => code.coding[0].display,
    tryWithDefault(code, (code) => code.text, Const.unknownValue));
}
