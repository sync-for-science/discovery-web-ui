import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { string, shape } from 'prop-types';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { format } from 'date-fns';

import GenericCardBody from './GenericCardBody';
import MedicationCardBody from './MedicationCardBody';
import BenefitCardBody from './BenefitCardBody';
import ClaimCardBody from './ClaimCardBody';
import EncounterCardBody from './EncounterCardBody';
import ImmunizationCardBody from './ImmunizationCardBody';
import LabResultCardBody from './LabResultCardBody';
import ExamCardBody from './ExamCardBody';
import MedicationStatementCardBody from './MedicationStatementCardBody';
import SocialHistoryCardBody from './SocialHistoryCardBody';
import UnimplementedCardBody from './UnimplementedCardBody';
import VitalSignCardBody from './VitalSignCardBody';
import NotesEditor from '../notes/NotesEditor';
import { formatAge } from '../../util';

const selectCardBody = (fieldsData, patientAgeAtRecord) => {
  switch (fieldsData.category) {
    case 'Conditions':
    case 'Document References':
    case 'Meds Administration':
    case 'Procedures':
    case 'Procedure Requests':
      return <GenericCardBody fieldsData={fieldsData} patientAgeAtRecord={patientAgeAtRecord}/>;
    case 'Meds Dispensed':
    case 'Meds Requested':
      return <MedicationCardBody fieldsData={fieldsData} patientAgeAtRecord={patientAgeAtRecord}/>;
    case 'Benefits':
      return <BenefitCardBody fieldsData={fieldsData} patientAgeAtRecord={patientAgeAtRecord}/>;
    case 'Claims':
      return <ClaimCardBody fieldsData={fieldsData} patientAgeAtRecord={patientAgeAtRecord}/>;
    case 'Encounters':
      return <EncounterCardBody fieldsData={fieldsData} patientAgeAtRecord={patientAgeAtRecord}/>;
    case 'Immunizations':
      return <ImmunizationCardBody fieldsData={fieldsData} patientAgeAtRecord={patientAgeAtRecord}/>;
    case 'Lab Results':
      return <LabResultCardBody fieldsData={fieldsData} patientAgeAtRecord={patientAgeAtRecord}/>;
    case 'Exams':
      return <ExamCardBody fieldsData={fieldsData} patientAgeAtRecord={patientAgeAtRecord}/>;
    case 'Meds Statement':
      return <MedicationStatementCardBody fieldsData={fieldsData} patientAgeAtRecord={patientAgeAtRecord}/>;
    case 'Social History':
      return <SocialHistoryCardBody fieldsData={fieldsData} patientAgeAtRecord={patientAgeAtRecord}/>;
    case 'Other':
      return <UnimplementedCardBody fieldsData={fieldsData} patientAgeAtRecord={patientAgeAtRecord}/>;
    case 'Vital Signs':
      return <VitalSignCardBody fieldsData={fieldsData} patientAgeAtRecord={patientAgeAtRecord}/>;
    default:
      break;
  }
};

const useStyles = makeStyles(() => ({
  root: {
    marginTop: 10,
  },
  title: {
    padding: '16px 16px 0 16px',
    display: 'flex',
    justifyContent: 'space-between'
  }
}));

const RecordCard = ({
  recordId, records, patient,
}) => {
  const classes = useStyles();

  // console.info('recordId, records, patient:', recordId, records, patient);
  const record = records[recordId];

  const {
    provider, data, itemDate, category,
  } = record;

  const displayDate = format(new Date(itemDate), 'MMM d, y h:mm:ssaaa');

  const fieldsData = {
    abatement: data.abatementDateTime,
    asserted: data.assertedDate,
    billablePeriod: data.billablePeriod,
    category: record.category,
    careTeam: data.careTeam,
    class: data.class?.code,
    clinicalStatus: data.clinicalStatus,
    criticality: data.criticality,
    component: data.component,
    contained: data.contained,
    date: record.itemDate,
    daysSupply: data.daysSupply,
    diagnosis: data.diagnosis?.[0]?.type?.[0]?.coding?.[0]?.code,
    display: data.code?.text,
    dispenseRequest: data.dispenseRequest,
    dosageInstruction: data.dosageInstruction?.[0],
    medicationDisplay: data.medicationCodeableConcept?.text,
    notGiven: data.notGiven,
    onset: data.onsetDateTime,
    orderedBy: data.orderer?.display,
    participantId: record.id,
    period: data.period,
    primarySource: data.primarySource,
    provider,
    reaction: data.reaction,
    reason: data.reason?.[0]?.coding?.[0]?.display,
    referenceRange: data.referenceRange,
    reported: data.reported,
    resourceId: data.id,
    resourceType: data.resourceType,
    status: data.status,
    substance: data.substance,
    taken: data.taken,
    total: data.total,
    totalBenefit: data.totalBenefit,
    totalCost: data.totalCost,
    type: data.type,
    use: data.use,
    vaccineDisplay: data.vaccineCode?.coding?.[0]?.display,
    valueCodeableConcept: data.valueCodeableConcept?.coding,
    valueConcept: data.valueConcept,
    valueQuantity: data.valueQuantity,
    valueRatio: data.valueRatio,
    verificationStatus: data.verificationStatus,
    wasNotGiven: data.wasNotGiven,
  };

  // console.log('fieldsData', fieldsData)

  const patientAgeAtRecord = formatAge(patient.data.birthDate, record.itemDate, '') || '';

  return (
    <Card
      className={classes.root}
      variant="outlined"
      id={`${format(new Date(fieldsData.date), 'y-MM-dd')}-${fieldsData.display}`}
    >
      {/* <CardHeader
        // action={(
        //   <IconButton aria-label="remove">
        //     <CloseIcon />
        //   </IconButton>
        // )}
        title={category}
        subheader={`${displayDate} | ${patientAgeAtRecord}`}
        titleTypographyProps={{ variant: 's4sHeader' }}
        subheaderTypographyProps={{ variant: 's4sSubheader' }}
      /> */}
      <div className={classes.title}>
        <Typography variant="s4sHeader">
          {category}
        </Typography>
        <Typography variant="s4sSubheader">
          {displayDate}
        </Typography>
      </div>
      <CardContent>
        <Grid container>
          {selectCardBody(fieldsData, patientAgeAtRecord)}
        </Grid>
      </CardContent>
      <NotesEditor
        recordId={recordId}
      />
    </Card>
  );
};

RecordCard.prototype = {
  recordId: string.isRequired,
  records: shape({}).isRequired,
  patient: shape({}).isRequired,
};

export default React.memo(RecordCard);
