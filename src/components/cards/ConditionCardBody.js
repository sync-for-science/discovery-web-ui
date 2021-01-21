import React from 'react'
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { format } from 'date-fns';

const useStyles = makeStyles((theme) => ({
  highlight: {
    backgroundColor: '#d78c14', // add this color to theme
  }
}));

const ConditionCardBody = ({fieldsData}) => {
  const classes = useStyles()

  return (
    <>
      <Grid item xs={4}><Typography variant="body2">CONDITIONS</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2" className={classes.highlight}>{fieldsData.display}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">ABATEMENT</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{format( new Date(fieldsData.abatement), 'MMM d, y h:mm:ssaaa')}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">PROVIDER</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{fieldsData.provider}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">CLINICAL STATUS</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{fieldsData.clinicalStatus}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">VERIFICATION</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{fieldsData.verificationStatus}</Typography></Grid>
    </>
  )
}

export default ConditionCardBody