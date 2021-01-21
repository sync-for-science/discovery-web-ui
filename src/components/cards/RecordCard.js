import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {shape} from 'prop-types';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import CardHeader from '@material-ui/core/CardHeader';
import Grid from '@material-ui/core/Grid';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import CloseIcon from '@material-ui/icons/Close';
import { format } from 'date-fns';

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
  console.log('resource: ', resource);
  const [expanded, setExpanded] = React.useState(false);
  const classes = useStyles();
  // const bull = <span className={classes.bullet}>•</span>;
  const {
    provider, data, itemDate, data: {
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
    provider: resource.provider,
    category: resource.category,
    participantId: resource.id,
    resourceId: data.id,
    display: resource.category,
    status: 'data.status',
    clinicalStatus: resource.clinicalStatus,
    abatement: resource.abatementDateTime,
    orderedBy: 'data.orderer.display',
    verificationStatus: data.verificationStatus,
    reason: 'data.reasonReference',
    valueQuantity: 'data.valueQuantity'
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
        title={resourceType}
        subheader={`${displayDate} | (Todo: Age of Patient at Event)`}
        titleTypographyProps={{ variant: 'button' }}
        subheaderTypographyProps={{ variant: 'body2' }}
      />
      <CardContent>
        <Grid container spacing={1}>
          {'fields'}
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