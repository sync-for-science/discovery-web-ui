import React from 'react';

import CardBodyField from './CardBodyField';
import { formatDate } from './GenericCardBody';

const MedicationCardBody = ({ fieldsData }) => {
  function formatDosageInstruction() {
    if (fieldsData.dosageInstruction?.timing?.repeat) {
      const asNeededText = fieldsData.dosageInstruction.asNeededBoolean
        ? 'as needed'
        : 'as instructed'; // what the opposite of As Needed?
      const { frequency } = fieldsData.dosageInstruction.timing.repeat;
      const { period } = fieldsData.dosageInstruction.timing.repeat;
      // DSTU2 / STU3 compatibility
      const { periodUnit, periodUnits } = fieldsData.dosageInstruction.timing.repeat;
      return `${frequency} every ${period} ${periodUnit ?? periodUnits} ${asNeededText}`; // need dynamic translation for
    }
    return null;
  }

  function formatDosageStart() {
    if (fieldsData.dosageInstruction?.timing?.repeat?.boundsPeriod) {
      return formatDate(fieldsData.dosageInstruction.timing.repeat.boundsPeriod);
    }

    return null;
  }

  return (
    <>
      <CardBodyField
        dependency={fieldsData.medicationDisplay}
        label="MEDICATIONS"
        value={fieldsData.medicationDisplay}
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
      {/* note sure where to find quantity, patient 3001 doesnt have med req supply */}
      <CardBodyField
        dependency={fieldsData.quantity}
        label="QUANTITY"
        value="TBD"
      />
      {/* note sure where to find supply, patient 3001 doesnt have med req supply */}
      <CardBodyField
        dependency={fieldsData.supply}
        label="SUPPLY"
        value="TBD"
      />
      <CardBodyField
        dependency={fieldsData.dosageInstruction?.timing}
        label="DOSAGE"
        value={formatDosageInstruction()}
      />
      <CardBodyField
        dependency={fieldsData.dosageInstruction?.timing?.repeat?.boundsPeriod}
        label="STARTING ON"
        value={formatDosageStart()}
      />
      <CardBodyField
        dependency={fieldsData.dispenseRequest}
        label="REFILLS"
        value={fieldsData.dispenseRequest?.numberOfRepeatsAllowed}
      />
    </>
  );
};

export default MedicationCardBody;
