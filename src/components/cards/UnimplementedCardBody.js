import React from 'react';

import CardBodyField from './CardBodyField';
import CARD_BODY_LABEL from './cardBodyLabel';

const UnimplementedCardBody = ({ fieldsData }) => (
  <>
    <CardBodyField
      dependency={fieldsData.patientAgeAtRecord}
      label={CARD_BODY_LABEL.age}
      value={fieldsData.patientAgeAtRecord}
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
