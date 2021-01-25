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

  const { data, highlights } = computeTimeSeriesData(fieldsData, vitalSigns)

  console.log('data', data)
  console.log('highlights', highlights)
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
      {data && <TimeSeries
        measure={fieldsData.display}
        data={data}
        highlights={highlights}
        dotClickFn={() => {}}
      />}
    </>
  )
}

export default VitalSignCardBody