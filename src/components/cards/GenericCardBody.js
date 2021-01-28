import React from 'react';
import { format } from 'date-fns';

import CardBodyField from './CardBodyField';

export function formatDate(date, displayMinutes = true) {
  const dateDisplay = displayMinutes ? 'MMM d, y h:mm:ssaaa' : 'MMM d, y';
  return date ? format(new Date(date), dateDisplay) : null;
}

const GenericCardBody = ({ fieldsData }) => (
  <>
    <CardBodyField
      dependency={fieldsData.display}
      label="CONDITIONS"
      value={fieldsData.display}
      highlight
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
      dependency={fieldsData.orderedBy}
      label="ORDERED BY"
      value={fieldsData.orderedBy}
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
      dependency={fieldsData.verificationStatus}
      label="VERIFICATION"
      value={fieldsData.verificationStatus}
    />
  </>
);

export default GenericCardBody;
