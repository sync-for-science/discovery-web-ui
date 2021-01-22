import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {shape} from 'prop-types';
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

import GenericCardBody from './GenericCardBody'
import MedicationCardBody from './MedicationCardBody'
import BenefitCardBody from './BenefitCardBody'
import ClaimCardBody from './ClaimCardBody'
import EncounterCardBody from './EncounterCardBody'
import ImmunizationCardBody from './ImmunizationCardBody'
import LabResultCardBody from './LabResultCardBody';

const selectCardBody = (fieldsData) => {
  switch (fieldsData.category) {
    case "Conditions":
    case "Document References":
    case "Meds Administration":
    case "Procedures":
    case "Procedure Requests":
      return <GenericCardBody fieldsData={fieldsData} />
    case "Meds Dispensed":
    case "Meds Requested":
      return <MedicationCardBody fieldsData={fieldsData} />
    case "Benefits":
      return <BenefitCardBody fieldsData={fieldsData} />
    case "Claims":
      return <ClaimCardBody fieldsData={fieldsData} />
    case "Encounters":
      return <EncounterCardBody fieldsData={fieldsData} />
    case "Immunizations":
      return <ImmunizationCardBody fieldsData={fieldsData} />
    case "Lab Results":
      return <LabResultCardBody fieldsData={fieldsData} />
    default:
      break;
  }
}

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: 10,
    backgroundColor: "#e9edf4" // TODO add colors to theme
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
    marginBottom: 10
  }
}));


const RecordCard = ({ resource }) => {
  // console.log('resource: ', resource);
  const [expanded, setExpanded] = React.useState(false);
  const classes = useStyles();
  // const bull = <span className={classes.bullet}>•</span>;
  const {
    provider, data, itemDate, category, data: {
      resourceType,
      effectiveDateTime,
    },
  } = resource;

  const displayDate = format(new Date(itemDate), 'MMM d, y h:mm:ssaaa')

  // const fields = Object.entries(data).map(([k, v]) => {
  //   // console.error(' k , v: ', k , v);
  //   return (
  //     <>
  //       <Grid item xs={5}>
  //         <Typography variant="body2">
  //           {k}
  //         </Typography>
  //       </Grid>
  //       <Grid item xs={7}>
  //         <Typography variant="body2">
  //           {JSON.stringify(v)}
  //         </Typography>
  //       </Grid>
  //     </>
  //   );
  // });

  const fieldsData = {
    abatement: data.abatementDateTime,
    asserted: data.assertedDate,
    billablePeriod: data.billablePeriod,
    category: resource.category,
    careTeam: data.careTeam,
    class: data.class && data.class.code,
    clinicalStatus: data.clinicalStatus,
    criticality: data.criticality,
    component: data.component,
    contained: data.contained,
    date: resource.itemDate,
    daysSupply: data.daysSupply,
    diagnosis: 
      data.diagnosis 
      && data.diagnosis[0] 
      && data.diagnosis[0].type 
      && data.diagnosis[0].type[0]
      && data.diagnosis[0].type[0].coding
      && data.diagnosis[0].type[0].coding[0]
      && data.diagnosis[0].type[0].coding[0].code,
    display: data.code && data.code.text,
    dispenseRequest: data.dispenseRequest,
    dosageInstruction: data.dosageInstruction && data.dosageInstruction[0],
    medicationDisplay: data.medicationCodeableConcept && data.medicationCodeableConcept.text,
    notGiven: data.notGiven,
    onsetDateTime: data.onsetDateTime,
    orderedBy: data.orderer && data.orderer.display,
    participantId: resource.id,
    period: data.period,
    primarySource: data.primarySource,
    provider: resource.provider,
    reaction: data.reaction,
    reason: data.reason && data.reason[0] && data.reason[0].coding && data.reason[0].coding[0] && data.reason[0].coding && data.reason[0].coding[0].display,
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
    vaccineDisplay: data.vaccineCode && data.vaccineCode.coding && data.vaccineCode.coding[0] && data.vaccineCode.coding[0].display,
    valueCodeableConcept: data.valueCodeableConcept && data.valueCodeableConcept.coding,
    valueQuantity: data.valueQuantity,
    verificationStatus: data.verificationStatus,
    wasNotGiven: data.wasNotGiven
  }

  console.log('fieldsData', fieldsData)


  return (
    <Card className={classes.root} variant="outlined">
      <CardHeader
        // action={(
        //   <IconButton aria-label="remove">
        //     <CloseIcon />
        //   </IconButton>
        // )}
        title={category}
        subheader={`${displayDate} | (Todo: Age of Patient at Event)`}
        titleTypographyProps={{ variant: 'button' }}
        subheaderTypographyProps={{ variant: 'body2' }}
      />
      <CardContent>
        <Grid container spacing={0}>
          {selectCardBody(fieldsData)}
        </Grid>
      </CardContent>
      <CardActions disableSpacing className={classes.cardActions}>
        <Button variant="outlined" disableElevation size="small" onClick={() => setExpanded(!expanded)}>
          Notes <ExpandMoreIcon />
        </Button>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <TextField
            className={classes.noteField}
            id="note"
            placeholder="New Note"
            variant="outlined"
            size="small"
            fullWidth
          />
          <Button variant="contained" disableElevation size="small">Add Note</Button>
        </CardContent>
      </Collapse>
    </Card>
  );
};

RecordCard.prototype = {
  resource: shape({})
}

export default RecordCard