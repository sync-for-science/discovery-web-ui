import React from 'react'

import CardBodyField from './CardBodyField'
// import FhirTransform from './FhirTransform';
import {canonVitals, computeTimeSeriesData} from '../../fhirUtil'
import {tryWithDefault} from '../../util'
import { log } from '../../utils/logger';
import TimeSeries from '../TimeSeries/index';

const VitalSignCardBody = ({fieldsData, vitalSigns}) => {
  console.log('vitalSigns', vitalSigns)
  const valueDisplay = fieldsData.valueQuantity && `${fieldsData.valueQuantity.value.toFixed(1)} ${fieldsData.valueQuantity.unit}`
  
  // breakout embedded fields in component, typically for Blood Pressure
  let displayComponents
  if (fieldsData.component) {
    displayComponents = fieldsData.component.map((resource, i) => {
      let label
      if (resource.code.text === "Diastolic Blood Pressure") {
        label = "DIASTOLIC"
      } else if (resource.code.text === "Systolic Blood Pressure") {
        label = "SYSTOLIC"
      } else {
        label = resource.code.text
      }

      const resourceValueDisplay = resource.valueQuantity && `${resource.valueQuantity.value.toFixed(1)} ${resource.valueQuantity.unit}`

      return (
        <CardBodyField 
          key={i}
          dependency={resource.valueQuantity.value} 
          label={label}
          value={resourceValueDisplay} 
        />
      )
    })
  }



  // const series = {};
  // // const vitalSigns = FhirTransform.getPathItem(resources.transformed, '[*category=Vital Signs]');
  // // console.log('match', match)
  // for (const elt of vitalSigns) {
  //   try {
  //     // Don't graph Vital Signs "container" resources
  //     const displayStr = canonVitals(elt.data.code.coding[0].display);
  //     if (displayStr !== 'Vital Signs') {
  //       const xVal = elt.itemDate instanceof Date ? elt.itemDate : new Date(elt.itemDate);
  //       if (elt.data.valueQuantity) {
  //         // Single data value
  //         const yVal = elt.data.valueQuantity.value;
  //         if (series.hasOwnProperty(displayStr)) {
  //           // Add to series
  //           series[displayStr].push({ provider: elt.provider, x: xVal, y: yVal });
  //         } else {
  //           // New series
  //           series[displayStr] = [{ provider: elt.provider, x: xVal, y: yVal }];
  //         }
  //       } else if (elt.data.component) {
  //         // Dual/pair data values
  //         const y1 = tryWithDefault(elt, (e) => e.data.component[0].valueQuantity.value, 0);
  //         const y2 = tryWithDefault(elt, (e) => e.data.component[1].valueQuantity.value, 0);
  //         const yVal = (y1 + y2) / 2;
  //         const yVar = Math.abs(y2 - y1);
  //         if (series.hasOwnProperty(displayStr)) {
  //           // Add to series
  //           series[displayStr].push({
  //             provider: elt.provider, x: xVal, y: yVal, yVariance: yVar, y1, y2,
  //           });
  //         } else {
  //           // New series
  //           series[displayStr] = [{
  //             provider: elt.provider, x: xVal, y: yVal, yVariance: yVar, y1, y2,
  //           }];
  //         }
  //       }
  //     }
  //   } catch (e) {
  //     log(`renderVitals() 2: ${e.message}`);
  //   }
  // }

  const { data, highlights } = computeTimeSeriesData()
  
  return (
    <>
      <CardBodyField 
        dependency={fieldsData.display} 
        label="MEASURE" 
        value={fieldsData.display} 
        highlight
      />
      <CardBodyField 
        dependency={fieldsData.valueQuantity} 
        label="VALUE" 
        value={valueDisplay}
      />
      {displayComponents}
      <CardBodyField 
        dependency={fieldsData.provider} 
        label="PROVIDER" 
        value={fieldsData.provider} 
      />
      <CardBodyField 
        dependency={fieldsData.status} 
        label="STATUS" 
        value={fieldsData.status} 
      />
      <CardBodyField 
        dependency={true} 
        label="TIMESERIES" 
        value='Placeholder Time Series'
      />
      <TimeSeries
        measure={fieldsData.display}
        data={data}
        highlights={highlights}
        dotClickFn={() => {}}
      />
    </>
  )
}

export default VitalSignCardBody