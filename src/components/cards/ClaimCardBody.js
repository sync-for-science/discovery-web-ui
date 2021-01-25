import React from 'react';
import { formatDate } from './GenericCardBody';

import CardBodyField from './CardBodyField';

const ClaimCardBody = ({ fieldsData }) => {
  const periodDisplay = `${formatDate(fieldsData.billablePeriod.start, false)} - ${formatDate(fieldsData.billablePeriod.end, false)}`;
  const displayTotal = `${fieldsData.total.value.toFixed(2)} ${fieldsData.total.code}`;
  return (
    <>
      <CardBodyField
        dependency={fieldsData.billablePeriod.start}
        label="PERIOD"
        value={periodDisplay}
        highlight
      />
      <CardBodyField
        dependency={fieldsData.total.value}
        label="TOTAL"
        value={displayTotal}
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
        dependency={fieldsData.use}
        label="USE"
        value={fieldsData.use}
      />
    </>
  );
};

export default ClaimCardBody;
