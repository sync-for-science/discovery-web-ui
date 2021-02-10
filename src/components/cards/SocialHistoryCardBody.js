import React from 'react';

import CardBodyField from './CardBodyField';
import CARD_BODY_LABEL from './cardBodyLabel';

// no Social History records found in patients so far, data use/shape not confirmed
const SocialHistoryCardBody = ({ fieldsData }) => (
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
      bold
    />
    <CardBodyField
      dependency={fieldsData.value}
      label={CARD_BODY_LABEL.value}
      value={fieldsData.value}
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

export default SocialHistoryCardBody;
