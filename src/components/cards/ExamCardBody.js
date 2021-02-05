import React from 'react';

import CardBodyField from './CardBodyField';
import CARD_BODY_LABEL from './cardBodyLabel';

// no exam records found in patients so far, data use/shape not confirmed
const ExamCardBody = ({ fieldsData }) => {
  const valueDisplay = `${fieldsData.valueQuantity.value.toFixed(1)} ${fieldsData.valueQuantity.unit}`;
  return (
    <>
      <CardBodyField
        dependency={fieldsData.patientAgeAtRecord}
        label={CARD_BODY_LABEL.age}
        value={fieldsData.patientAgeAtRecord}
      />
      <CardBodyField
        dependency={fieldsData.display}
        label={CARD_BODY_LABEL.type}
        value={fieldsData.display}
        highlight
      />
      <CardBodyField
        dependency={fieldsData.valueQuantity}
        label={CARD_BODY_LABEL.value}
        value={valueDisplay}
      />
      <CardBodyField
        dependency={fieldsData.valueConcept}
        label={CARD_BODY_LABEL.concept}
        value={fieldsData.valueConcept}
      />
      <CardBodyField
        dependency={fieldsData.provider}
        label={CARD_BODY_LABEL.provider}
        value={fieldsData.provider}
      />
      <CardBodyField
        dependency={fieldsData.status}
        label={CARD_BODY_LABEL.status}
        value={fieldsData.status}
      />
    </>
  );
};

export default ExamCardBody;
