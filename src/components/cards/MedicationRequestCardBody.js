import React from 'react'
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

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
      <Grid item xs={8}><Typography variant="body2" className={classes.highlight}>{fieldsData.medicationDisplay}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">PROVIDER</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{fieldsData.provider}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">STATUS</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{fieldsData.status}</Typography></Grid>
    </>
  )
}

export default ConditionCardBody