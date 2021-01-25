import React from 'react';

import CardBodyField from './CardBodyField';

const ImmunizationCardBody = ({ fieldsData }) => {
  const givenDisplay = fieldsData.notGiven ? 'no' : 'yes';
  const primarySourceDisplay = fieldsData.primarySource ? 'yes' : 'no';
  const reportedDisplay = fieldsData.reported ? 'yes' : 'no';
  return (
    <>
      <CardBodyField
        dependency={fieldsData.vaccineDisplay}
        label="VACCINE"
        value={fieldsData.vaccineDisplay}
        highlight
      />
      <CardBodyField
        dependency={fieldsData.notGiven !== undefined}
        label="GIVEN"
        value={givenDisplay}
      />
      <CardBodyField
        dependency={fieldsData.reported}
        label="REPORTED"
        value={reportedDisplay}
      />
      <CardBodyField
        dependency={fieldsData.primarySource}
        label="PRIMARY SOURCE"
        value={primarySourceDisplay}
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
    </>
  );
};

export default ImmunizationCardBody;
