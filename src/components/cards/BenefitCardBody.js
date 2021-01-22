import React from 'react'
import { formatDate } from './GenericCardBody'

import CardBodyField from './CardBodyField'

const BenefitCardBody = ({fieldsData}) => {
  const claimDisplay = fieldsData.type.coding[0].display
  const periodDisplay = `${formatDate(fieldsData.billablePeriod.start, false)} - ${formatDate(fieldsData.billablePeriod.end, false)}`
  const totalCostDisplay = `${fieldsData.totalCost.value.toFixed(2)} ${fieldsData.totalCost.code}`
  const totalBenefitDisplay = fieldsData.totalBenefit || 'unknown'
  const roleDisplay = fieldsData.careTeam[0].role.coding[0].display

  const renderContainedResource = (containedResource, i) => {
    switch(containedResource.resourceType) {
      case 'Coverage':
        return (
            <CardBodyField 
              key={i}
              dependency={containedResource.type.text} 
              label="COVERAGE" 
              value={containedResource.type.text} 
            />
          )
      case 'ReferralRequest':
        return (
            <CardBodyField 
              key={i}
              dependency={containedResource.status} 
              label="REFERRAL" 
              value={containedResource.status} 
            />
          )
      default:
        // ???? is a reference to Const.unknownValue which lives in utils.js. We'll want a way to handle unknown values
        return (
            <CardBodyField 
              key={i}
              dependency={containedResource.resourceType} 
              label={containedResource.resourceType}
              value="????" 
            />
          )
    }
  }

  const renderContained = () => {
    return fieldsData.contained.map((containedResource, i) => renderContainedResource(containedResource, i))
  }

  return (
    <>
      <CardBodyField 
        dependency={fieldsData.type.coding[0].display} 
        label="CLAIM TYPE" 
        value={claimDisplay} 
        highlight
      />
      <CardBodyField 
        dependency={fieldsData.billablePeriod} 
        label="PERIOD" 
        value={periodDisplay} 
      />
      <CardBodyField 
        dependency={fieldsData.totalCost} 
        label="TOTAL COST" 
        value={totalCostDisplay} 
      />
      <CardBodyField 
        dependency={fieldsData.totalBenefit} 
        label="TOTAL BENEFIT" 
        value={totalBenefitDisplay} 
      />
      <CardBodyField 
        dependency={fieldsData.provider} 
        label="PROVIDER" 
        value={fieldsData.provider} 
      />
      <CardBodyField 
        dependency={fieldsData.diagnosis} 
        label="DIAGNOSIS" 
        value={fieldsData.diagnosis} 
      />
      <CardBodyField 
        dependency={fieldsData.status} 
        label="STATUS" 
        value={fieldsData.status} 
      />
      <CardBodyField 
        dependency={fieldsData.careTeam[0].role.coding[0].display} 
        label="ROLE" 
        value={roleDisplay} 
      />
      {renderContained()}
    </>
  )
}

export default BenefitCardBody