import React from 'react';
import { useTranslation } from 'react-i18next';

import CARD_BODY_LABEL from './cardBodyLabel';
import CardBodyField from './CardBodyField';
import { formatDate } from './GenericCardBody';

const MedicationCardBody = ({ fieldsData }) => {
  const { t } = useTranslation();

  function formatDosageInstruction() {
    if (fieldsData.dosageInstruction?.timing?.repeat) {
      const o = fieldsData.dosageInstruction;
      return t('fhir:dosageInstruction', { o });

    //   const asNeededText = fieldsData.dosageInstruction.asNeededBoolean
    //     ? 'as needed'
    //     : 'as instructed'; // what the opposite of As Needed?
    //   const { frequency } = fieldsData.dosageInstruction.timing.repeat;
    //   const { period } = fieldsData.dosageInstruction.timing.repeat;
    //   // DSTU2 / STU3 compatibility
    //   const { periodUnit, periodUnits } = fieldsData.dosageInstruction.timing.repeat;
    //   return `${frequency} every ${period} ${periodUnit || periodUnits} ${asNeededText}`; // need dynamic translation for
    // }
    }
    return null;
  }

  function formatDosageStart() {
    if (fieldsData.dosageInstruction?.timing?.repeat?.boundsPeriod?.start) {
      return formatDate(fieldsData.dosageInstruction.timing.repeat.boundsPeriod.start);
    }

    return null;
  }

  return (
    <>
      <CardBodyField
        dependency={fieldsData.patientAgeAtRecord}
        label={CARD_BODY_LABEL.age}
        value={fieldsData.patientAgeAtRecord}
      />
      <CardBodyField
        dependency={fieldsData.medicationDisplay}
        label={CARD_BODY_LABEL.medications}
        value={fieldsData.medicationDisplay}
        highlight
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
      {/* note sure where to find quantity, patient 3001 doesnt have med req supply */}
      <CardBodyField
        dependency={fieldsData.quantity}
        label={CARD_BODY_LABEL.quantity}
        value="TBD"
      />
      {/* note sure where to find supply, patient 3001 doesnt have med req supply */}
      <CardBodyField
        dependency={fieldsData.supply}
        label={CARD_BODY_LABEL.supply}
        value="TBD"
      />
      <CardBodyField
        dependency={fieldsData.dosageInstruction?.timing}
        label={CARD_BODY_LABEL.dosage}
        value={formatDosageInstruction()}
      />
      <CardBodyField
        dependency={fieldsData.dosageInstruction?.timing?.repeat?.boundsPeriod?.start}
        label={CARD_BODY_LABEL.startingOn}
        value={formatDosageStart()}
      />
      <CardBodyField
        dependency={fieldsData.dispenseRequest}
        label={CARD_BODY_LABEL.refills}
        value={fieldsData.dispenseRequest?.numberOfRepeatsAllowed}
      />
    </>
  );
};

export default MedicationCardBody;
