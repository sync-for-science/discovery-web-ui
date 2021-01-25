import React from 'react';

import CardBodyField from './CardBodyField';

// no exam records found in patients so far, data use/shape not confirmed
const ExamCardBody = ({ fieldsData }) => {
  const valueDisplay = `${fieldsData.valueQuantity.value.toFixed(1)} ${fieldsData.valueQuantity.unit}`;
  return (
    <>
      <CardBodyField
        dependency={fieldsData.display}
        label="TYPE"
        value={fieldsData.display}
        highlight
      />
      <CardBodyField
        dependency={fieldsData.valueQuantity}
        label="VALUE"
        value={valueDisplay}
      />
      <CardBodyField
        dependency={fieldsData.valueConcept}
        label="CONCEPT"
        value={fieldsData.valueConcept}
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
    </>
  );
};

export default ExamCardBody;
