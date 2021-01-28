import React from 'react';

import { formatDate } from './GenericCardBody';
import CardBodyField from './CardBodyField';

const EncounterCardBody = ({ fieldsData }) => {
  const displayType = fieldsData.type[0].text;
  const displayEnd = formatDate(fieldsData.period.end);
  return (
    <>
      <CardBodyField
        dependency={fieldsData.type[0].text}
        label="TYPE"
        value={displayType}
        highlight
      />
      <CardBodyField
        dependency={fieldsData.period.start !== fieldsData.period.end}
        label="ENDING"
        value={displayEnd}
      />
      <CardBodyField
        dependency={fieldsData.class}
        label="CLASS"
        value={fieldsData.class}
      />
      <CardBodyField
        dependency={fieldsData.status}
        label="STATUS"
        value={fieldsData.status}
      />
      <CardBodyField
        dependency={fieldsData.provider}
        label="PROVIDER"
        value={fieldsData.provider}
      />
    </>
  );
};

export default EncounterCardBody;
