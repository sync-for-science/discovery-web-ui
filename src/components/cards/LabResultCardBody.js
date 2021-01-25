import React from 'react'

import CardBodyField from './CardBodyField'

const LabResultCardBody = ({fieldsData}) => {

  const valueRatioDisplay = `${fieldsData.valueRatio && fieldsData.valueRatio.numerator.value} / ${fieldsData.valueRatio && fieldsData.valueRatio.denominator.value}`

  let valueField
  if( fieldsData.valueQuantity ) {
    const valueDisplay = `${fieldsData.valueQuantity.value.toFixed(1)} ${fieldsData.valueQuantity.unit}`
    valueField = (
      <CardBodyField 
        dependency={valueDisplay} 
        label="VALUE" 
        value={valueDisplay} 
      />
    )
  } else if ( fieldsData.component ) {
    valueField = fieldsData.component.map((resource, i) => {
      const valueDisplay = `${resource.valueQuantity.value.toFixed(1)} ${resource.valueQuantity.code}`
      let label
      if (resource.code.text === "Diastolic Blood Pressure") {
        label = "DIASTOLIC"
      } else if (resource.code.text === "Systolic Blood Pressure") {
        label = "SYSTOLIC"
      } else {
        label = resource.code.text
      }
      return (
        <CardBodyField 
          key={i}
          dependency={resource.valueQuantity.value} 
          label={label}
          value={valueDisplay} 
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
      {valueField}
      <CardBodyField 
        dependency={fieldsData.valueRatio} 
        label="VALUE RATIO" 
        value={valueRatioDisplay} 
      />
      {/* Need to parse Reference Range per fhirUtil, but can't find example */}
      <CardBodyField 
        dependency={fieldsData.referenceRange} 
        label="REFERENCE RANGE" 
        value='TBD' 
      />
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
      {/* need data from other lab results to build graph */}
      <CardBodyField 
        dependency={true} 
        label="GRAPH" 
        value="(Placeholder Graph)" 
      />
    </>
  )
}

export default LabResultCardBody