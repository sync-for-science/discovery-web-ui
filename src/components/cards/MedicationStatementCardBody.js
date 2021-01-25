import React from 'react'

import { formatDate } from './GenericCardBody'
import CardBodyField from './CardBodyField'

// no Meds Statement records found in patients so far, data use/shape not confirmed
const MedicationStatementCardBody = ({fieldsData}) => {
  const valueResult = `${fieldsData.valueQuantity.value.toFixed(1)} ${fieldsData.valueQuantity.unit}`
  return (
    <>
      <CardBodyField 
        dependency={fieldsData.display} 
        label="MEDICATION" 
        value={fieldsData.display} 
        highlight
      />
      {/* consultText from fhirUtil.js not built due to lack of example data, use/shape not confirmed */}
      <CardBodyField 
        dependency={fieldsData.valueQuantity} 
        label="RESULT" 
        value={valueResult} 
      />
      <CardBodyField 
        dependency={fieldsData.reason} 
        label="REASON" 
        value={fieldsData.reason} 
      />
      <CardBodyField 
        dependency={fieldsData.onset} 
        label="ONSET" 
        value={formatDate(fieldsData.onset)} 
      />
      <CardBodyField 
        dependency={fieldsData.abatement} 
        label="ABATEMENT" 
        value={formatDate(fieldsData.abatement)} 
      />
      <CardBodyField 
        dependency={fieldsData.asserted} 
        label="ASSERTED" 
        value={formatDate(fieldsData.asserted)} 
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
      <CardBodyField 
        dependency={fieldsData.clinicalStatus} 
        label="CLINICAL STATUS" 
        value={fieldsData.clinicalStatus} 
      />
      <CardBodyField 
        dependency={fieldsData.taken} 
        label="TAKEN" 
        value={fieldsData.taken} 
      />
      <CardBodyField 
        dependency={fieldsData.verificationStatus} 
        label="VERIFICATION" 
        value={fieldsData.verificationStatus} 
      />
      <CardBodyField 
        dependency={true} 
        label="Graph" 
        value='(Placeholder Graph' 
      />
    </>
  )
}

export default MedicationStatementCardBody