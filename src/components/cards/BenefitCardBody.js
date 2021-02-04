import React from 'react';
import { formatDate } from './GenericCardBody';

import CardBodyField from './CardBodyField';
import CARD_BODY_LABEL from './cardBodyLabel';

const BenefitCardBody = ({ fieldsData }) => {
  const claimDisplay = fieldsData.type.coding[0].display;
  const periodDisplay = `${formatDate(fieldsData.billablePeriod.start, false)} - ${formatDate(fieldsData.billablePeriod.end, false)}`;
  const totalCostDisplay = `${fieldsData.totalCost.value.toFixed(2)} ${fieldsData.totalCost.code}`;
  const totalBenefitDisplay = fieldsData.totalBenefit || 'unknown';
  const roleDisplay = fieldsData.careTeam[0].role.coding[0].display;

  const renderContainedResource = (containedResource) => {
    switch (containedResource.resourceType) {
      case 'Coverage':
        return (
          <CardBodyField
            key={`${containedResource.resourceType}`}
            dependency={containedResource.type.text}
            label={CARD_BODY_LABEL.coverage}
            value={containedResource.type.text}
          />
        );
      case 'ReferralRequest':
        return (
          <CardBodyField
            key={`${containedResource.resourceType}`}
            dependency={containedResource.status}
            label={CARD_BODY_LABEL.referral}
            value={containedResource.status}
          />
        );
      default:
        // ???? is a reference to Const.unknownValue which lives in utils.js. We'll want a way to handle unknown values
        return (
          <CardBodyField
            key={`${containedResource.resourceType}`}
            dependency={containedResource.resourceType}
            label={containedResource.resourceType}
            value="????"
          />
        );
    }
  };

  const renderContained = () => fieldsData.contained.map((containedResource, i) => renderContainedResource(containedResource, i));

  return (
    <>
      <CardBodyField
        dependency={fieldsData.patientAgeAtRecord}
        label={CARD_BODY_LABEL.age}
        value={fieldsData.patientAgeAtRecord}
      />
      <CardBodyField
        dependency={fieldsData.type.coding[0].display}
        label={CARD_BODY_LABEL.claimType}
        value={claimDisplay}
        highlight
      />
      <CardBodyField
        dependency={fieldsData.billablePeriod}
        label={CARD_BODY_LABEL.period}
        value={periodDisplay}
      />
      <CardBodyField
        dependency={fieldsData.totalCost}
        label={CARD_BODY_LABEL.totalCost}
        value={totalCostDisplay}
      />
      <CardBodyField
        dependency={fieldsData.totalBenefit}
        label={CARD_BODY_LABEL.totalBenefit}
        value={totalBenefitDisplay}
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
        dependency={fieldsData.careTeam[0].role.coding[0].display}
        label={CARD_BODY_LABEL.role}
        value={roleDisplay}
      />
      {renderContained()}
    </>
  );
};

export default BenefitCardBody;
