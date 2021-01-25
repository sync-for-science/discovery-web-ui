import React from 'react';

import CardBodyField from './CardBodyField';

// no Social History records found in patients so far, data use/shape not confirmed
const SocialHistoryCardBody = ({ fieldsData }) => (
  <>
    <CardBodyField
      dependency={fieldsData.display}
      label="TYPE"
      value={fieldsData.display}
      highlight
    />
    <CardBodyField
      dependency={fieldsData.value}
      label="VALUE"
      value={fieldsData.value}
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

export default SocialHistoryCardBody;
