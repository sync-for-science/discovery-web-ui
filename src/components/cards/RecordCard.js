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

const selectCardBody = (fieldsData) => {
  switch (fieldsData.category) {
    case 'Conditions':
    case 'Document References':
    case 'Meds Administration':
    case 'Procedures':
    case 'Procedure Requests':
      return <GenericCardBody fieldsData={fieldsData} />;
    case 'Meds Dispensed':
    case 'Meds Requested':
      return <MedicationCardBody fieldsData={fieldsData} />;
    case 'Benefits':
      return <BenefitCardBody fieldsData={fieldsData} />;
    case 'Claims':
      return <ClaimCardBody fieldsData={fieldsData} />;
    case 'Encounters':
      return <EncounterCardBody fieldsData={fieldsData} />;
    case 'Immunizations':
      return <ImmunizationCardBody fieldsData={fieldsData} />;
    case 'Lab Results':
      return <LabResultCardBody fieldsData={fieldsData} />;
    case 'Exams':
      return <ExamCardBody fieldsData={fieldsData} />;
    case 'Meds Statement':
      return <MedicationStatementCardBody fieldsData={fieldsData} />;
    case 'Social History':
      return <SocialHistoryCardBody fieldsData={fieldsData} />;
    case 'Other':
      return <UnimplementedCardBody fieldsData={fieldsData} />;
    case 'Vital Signs':
      return <VitalSignCardBody fieldsData={fieldsData} />;
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
    justifyContent: 'space-between',
  },
}));

const RecordCard = ({
  recordId, records,
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
    careTeam: data.careTeam,
    category: record.category,
    class: data.class?.code,
    clinicalStatus: data.clinicalStatus,
    component: data.component,
    contained: data.contained,
    criticality: data.criticality,
    date: record.itemDate,
    daysSupply: data.daysSupply,
    diagnosis: data.diagnosis?.[0]?.type?.[0]?.coding?.[0]?.code,
    dispenseRequest: data.dispenseRequest,
    display: data.code?.text,
    dosageInstruction: data.dosageInstruction?.[0],
    medicationDisplay: data.medicationCodeableConcept?.text,
    notGiven: data.notGiven,
    onset: data.onsetDateTime,
    orderedBy: data.orderer?.display,
    participantId: record.id,
    patientAgeAtRecord: record.patientAgeAtRecord,
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

  return (
    <Card
      className={classes.root}
      variant="outlined"
      id={`${format(new Date(fieldsData.date), 'y-MM-dd')}-${fieldsData.display}`}
    >
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
          {selectCardBody(fieldsData)}
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
