import React, {useState, useRef, useEffect} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { string, shape } from 'prop-types';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import CardHeader from '@material-ui/core/CardHeader';
import Grid from '@material-ui/core/Grid';
import Collapse from '@material-ui/core/Collapse';
import TextField from '@material-ui/core/TextField';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { format } from 'date-fns';
import { useRecoilState } from 'recoil';

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
import { formatAge } from '../../util';
import { notesState } from '../../recoil';

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

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: 10,
  },
  media: {
    height: 0,
    paddingTop: '56.25%', // 16:9
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
  cardActions: {
    padding: 16,
  },
  noteField: {
    marginBottom: 10,
  },
}));

const RecordCard = ({
  recordId, records, patient,
}) => {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(false);

  const noteInput = useRef(null);

  const onSaveNote = () => {
    const newRecordNotes = {...recordNotes}

    if (!newRecordNotes[data.id]) {
      newRecordNotes[data.id] = {}
    } 
    const newDate = (new Date()).toISOString()
    let newNote = {}
    newNote[newDate] = { noteText: noteInput.current.value, editedTimeStamp: newDate, isEditing: false}
    newRecordNotes[data.id] = {...newRecordNotes[data.id], ...newNote}

    setRecordNotes(
      newRecordNotes
    )
    noteInput.current.value = ""
  }


  let displayNotes
  useEffect(() => {
    const renderNotes = () => {
      console.log('renderNotes()')
      const recordSpecificNotes = recordNotes?.[data.id]
      if (recordSpecificNotes) {
        return Object.keys(recordSpecificNotes)?.sort().map((noteId) => (
          <div key={noteId}>{recordSpecificNotes[noteId].noteText}</div>
        ))
      }
      return null
    }
    displayNotes = renderNotes()
  }, [recordNotes])

  console.log('displayNotes', displayNotes)
  
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

  const patientAgeAtRecord = formatAge(patient.data.birthDate, record.itemDate, 'age ') || '';

  return (
    <Card
      className={classes.root}
      variant="outlined"
      id={`${format(new Date(fieldsData.date), 'y-MM-dd')}-${fieldsData.display}`}
    >
      <CardHeader
        // action={(
        //   <IconButton aria-label="remove">
        //     <CloseIcon />
        //   </IconButton>
        // )}
        title={category}
        subheader={`${displayDate} | ${patientAgeAtRecord}`}
        titleTypographyProps={{ variant: 's4sHeader' }}
        subheaderTypographyProps={{ variant: 's4sSubheader' }}
      />
      <CardContent>
        <Grid container spacing={0}>
          {selectCardBody(fieldsData, records)}
        </Grid>
      </CardContent>
      <CardActions disableSpacing className={classes.cardActions}>
        <Button variant="outlined" disableElevation size="small" onClick={() => setExpanded(!expanded)}>
          Notes
          {' '}
          <ExpandMoreIcon />
        </Button>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          {displayNotes}
          <TextField
            className={classes.noteField}
            id={`note-entry-${data.id}`}
            placeholder="New Note"
            variant="outlined"
            size="small"
            fullWidth
            inputRef={noteInput}
          />
          <Button variant="contained" disableElevation size="small" onClick={onSaveNote}>Add Note</Button>
        </CardContent>
      </Collapse>
    </Card>
  );
};

RecordCard.prototype = {
  recordId: string.isRequired,
  records: shape({}).isRequired,
  patient: shape({}).isRequired,
};

export default React.memo(RecordCard);
