import React from 'react';

import CardBodyField from './CardBodyField';

const UnimplementedCardBody = ({ fieldsData }) => (
  <>
    <CardBodyField
      dependency={fieldsData.category}
      label={fieldsData.category}
      value="Pending"
      highlight
    />
    <CardBodyField
      dependency={fieldsData.provider}
      label="PROVIDER"
      value={fieldsData.provider}
    />
    <CardBodyField
      dependency
      label="GRAPH"
      value="(Placeholder Graph)"
    />
  </>
);

export default UnimplementedCardBody;
