import React from 'react';
import { format } from 'date-fns';

import CardBodyField from './CardBodyField';
import CARD_BODY_LABEL from './cardBodyLabel'

export function formatDate(date, displayMinutes = true) {
  const dateDisplay = displayMinutes ? 'MMM d, y h:mm:ssaaa' : 'MMM d, y';
  return date ? format(new Date(date), dateDisplay) : null;
}

const GenericCardBody = ({ fieldsData, patientAgeAtRecord }) => (
  <>
    <CardBodyField
      dependency={patientAgeAtRecord}
      label={CARD_BODY_LABEL.age}
      value={patientAgeAtRecord}
    />
    <CardBodyField
      dependency={fieldsData.display}
      label={CARD_BODY_LABEL.conditions}
      value={fieldsData.display}
      bold
    />
    <CardBodyField
      dependency={fieldsData.reason}
      label={CARD_BODY_LABEL.reason}
      value={fieldsData.reason}
    />
    <CardBodyField
      dependency={fieldsData.onset}
      label={CARD_BODY_LABEL.onset}
      value={formatDate(fieldsData.onset)}
    />
    <CardBodyField
      dependency={fieldsData.abatement}
      label={CARD_BODY_LABEL.abatement}
      value={formatDate(fieldsData.abatement)}
    />
    <CardBodyField
      dependency={fieldsData.orderedBy}
      label={CARD_BODY_LABEL.orderedBy}
      value={fieldsData.orderedBy}
    />
    <CardBodyField
      dependency={fieldsData.asserted}
      label={CARD_BODY_LABEL.asserted}
      value={formatDate(fieldsData.asserted)}
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
    <CardBodyField
      dependency={fieldsData.clinicalStatus}
      label={CARD_BODY_LABEL.clinicalStatus}
      value={fieldsData.clinicalStatus}
    />
    <CardBodyField
      dependency={fieldsData.verificationStatus}
      label={CARD_BODY_LABEL.verification}
      value={fieldsData.verificationStatus}
    />
  </>
);

export default GenericCardBody;
