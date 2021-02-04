import React from 'react';

import { formatDate } from './GenericCardBody';
import CardBodyField from './CardBodyField';
import CARD_BODY_LABEL from './cardBodyLabel';

const EncounterCardBody = ({ fieldsData }) => {
  const displayType = fieldsData.type[0].text;
  const displayEnd = formatDate(fieldsData.period.end);
  return (
    <>
      <CardBodyField
        dependency={fieldsData.patientAgeAtRecord}
        label={CARD_BODY_LABEL.age}
        value={fieldsData.patientAgeAtRecord}
      />
      <CardBodyField
        dependency={fieldsData.type[0].text}
        label={CARD_BODY_LABEL.type}
        value={displayType}
        highlight
      />
      <CardBodyField
        dependency={fieldsData.period.start !== fieldsData.period.end}
        label={CARD_BODY_LABEL.ending}
        value={displayEnd}
      />
      <CardBodyField
        dependency={fieldsData.class}
        label={CARD_BODY_LABEL.class}
        value={fieldsData.class}
      />
      <CardBodyField
        dependency={fieldsData.status}
        label={CARD_BODY_LABEL.status}
        value={fieldsData.status}
      />
      <CardBodyField
        dependency={fieldsData.provider}
        label={CARD_BODY_LABEL.provider}
        value={fieldsData.provider}
      />
    </>
  );
};

export default EncounterCardBody;
