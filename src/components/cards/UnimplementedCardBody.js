import React from 'react';

import CardBodyField from './CardBodyField';
import CARD_BODY_LABEL from './cardBodyLabel'

const UnimplementedCardBody = ({ fieldsData, patientAgeAtRecord }) => (
  <>
    <CardBodyField
      dependency={patientAgeAtRecord}
      label={CARD_BODY_LABEL.age}
      value={patientAgeAtRecord}
    />
    <CardBodyField
      dependency={fieldsData.category}
      label={fieldsData.category}
      value="Pending"
      highlight
    />
    <CardBodyField
      dependency={fieldsData.provider}
      label={CARD_BODY_LABEL.provider}
      value={fieldsData.provider}
    />
  </>
);

export default UnimplementedCardBody;
