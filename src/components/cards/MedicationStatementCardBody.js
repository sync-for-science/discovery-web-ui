import React from 'react';

import { formatDate } from './GenericCardBody';
import CardBodyField from './CardBodyField';
import CARD_BODY_LABEL from './cardBodyLabel'

// no Meds Statement records found in patients so far, data use/shape not confirmed
const MedicationStatementCardBody = ({ fieldsData, patientAgeAtRecord }) => {
  const valueResult = `${fieldsData.valueQuantity.value.toFixed(1)} ${fieldsData.valueQuantity.unit}`;
  return (
    <>
      <CardBodyField
        dependency={patientAgeAtRecord}
        label={CARD_BODY_LABEL.age}
        value={patientAgeAtRecord}
      />
      <CardBodyField
        dependency={fieldsData.display}
        label={CARD_BODY_LABEL.medication}
        value={fieldsData.display}
        highlight
      />
      {/* consultText from fhirUtil.js not built due to lack of example data, use/shape not confirmed */}
      <CardBodyField
        dependency={fieldsData.valueQuantity}
        label={CARD_BODY_LABEL.result}
        value={valueResult}
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
        dependency={fieldsData.taken}
        label={CARD_BODY_LABEL.taken}
        value={fieldsData.taken}
      />
      <CardBodyField
        dependency={fieldsData.verificationStatus}
        label={CARD_BODY_LABEL.verification}
        value={fieldsData.verificationStatus}
      />
    </>
  );
};

export default MedicationStatementCardBody;
