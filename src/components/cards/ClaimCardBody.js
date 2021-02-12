import React from 'react';
import { formatDate } from './GenericCardBody';

import CardBodyField from './CardBodyField';
import CARD_BODY_LABEL from './cardBodyLabel';

const ClaimCardBody = ({ fieldsData }) => {
  const periodDisplay = `${formatDate(fieldsData.billablePeriod.start, false)} - ${formatDate(fieldsData.billablePeriod.end, false)}`;
  const displayTotal = `${fieldsData.total.value.toFixed(2)} ${fieldsData.total.code}`;
  return (
    <>
      <CardBodyField
        dependency={fieldsData.patientAgeAtRecord}
        label={CARD_BODY_LABEL.age}
        value={fieldsData.patientAgeAtRecord}
      />
      <CardBodyField
        dependency={fieldsData.billablePeriod.start}
        label={CARD_BODY_LABEL.period}
        value={periodDisplay}
        bold
      />
      <CardBodyField
        dependency={fieldsData.total.value}
        label={CARD_BODY_LABEL.total}
        value={displayTotal}
      />
      <CardBodyField
        dependency={fieldsData.provider}
        label={CARD_BODY_LABEL.provider}
        value={fieldsData.provider}
      />
      <CardBodyField
        dependency={fieldsData.diagnosis}
        label={CARD_BODY_LABEL.diagnosis}
        value={fieldsData.diagnosis}
      />
      <CardBodyField
        dependency={fieldsData.status}
        label={CARD_BODY_LABEL.status}
        value={fieldsData.status}
      />
      <CardBodyField
        dependency={fieldsData.use}
        label={CARD_BODY_LABEL.use}
        value={fieldsData.use}
      />
    </>
  );
};

export default ClaimCardBody;
