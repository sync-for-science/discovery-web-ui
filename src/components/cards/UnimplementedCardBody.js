import React from 'react';

import { formatDate } from './GenericCardBody';
import CardBodyField from './CardBodyField';

const UnimplementedCardBody = ({ fieldsData }) => {
  const displayType = fieldsData.type[0].text;
  const displayEnd = formatDate(fieldsData.period.end);
  return (
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
};

export default UnimplementedCardBody;
