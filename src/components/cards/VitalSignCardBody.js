import React from 'react';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { useRecoilValue } from 'recoil';
import CardBodyField from './CardBodyField';
import TimeSeries from '../TimeSeries/index';
import { computeTimeSeriesVitalSignsData } from '../../fhirUtil';
import { vitalSignsRecords } from '../../recoil';

const useStyles = makeStyles(() => ({
  timeSeries: {
    marginTop: '20px',
  },
}));

const VitalSignCardBody = ({ fieldsData }) => {
  const vitalSigns = useRecoilValue(vitalSignsRecords);
  const classes = useStyles();
  const valueDisplay = fieldsData.valueQuantity && `${fieldsData.valueQuantity.value.toFixed(1)} ${fieldsData.valueQuantity.unit}`;

  // breakout embedded fields in component, typically for Blood Pressure
  let displayComponents;
  if (fieldsData.component) {
    displayComponents = fieldsData.component.map((resource) => {
      let label;
      if (resource.code.text === 'Diastolic Blood Pressure') {
        label = 'DIASTOLIC';
      } else if (resource.code.text === 'Systolic Blood Pressure') {
        label = 'SYSTOLIC';
      } else {
        label = resource.code.text;
      }

      const resourceValueDisplay = resource.valueQuantity && `${resource.valueQuantity.value.toFixed(1)} ${resource.valueQuantity.unit}`;

      return (
        <CardBodyField
          key={`${resource.code.text}`}
          dependency={resource.valueQuantity.value}
          label={label}
          value={resourceValueDisplay}
        />
      );
    });
  }

  const { data, highlights } = computeTimeSeriesVitalSignsData(fieldsData, vitalSigns);

  return (
    <>
      <CardBodyField
        dependency={fieldsData.display}
        label="MEASURE"
        value={fieldsData.display}
        highlight
      />
      <CardBodyField
        dependency={fieldsData.valueQuantity}
        label="VALUE"
        value={valueDisplay}
      />
      {displayComponents}
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
      <Typography variant="timeSeries" className={classes.timeSeries}>
        {data && (
        <TimeSeries
          measure={fieldsData.display}
          data={data}
          highlights={highlights}
        />
        )}
      </Typography>
    </>
  );
};

export default VitalSignCardBody;
