import React from 'react'

import CardBodyField from './CardBodyField'

const VitalSignCardBody = ({fieldsData}) => {
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
    </>
  )
}

export default VitalSignCardBody