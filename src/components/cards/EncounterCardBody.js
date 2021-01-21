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

const EncounterCardBody = ({fieldsData}) => {
  const classes = useStyles()

  const displayType = fieldsData.type[0].text
  const displayEnd = format(new Date(fieldsData.period.end), 'MMM d, y h:mm:ssaaa')
  return (
    <>
      <Grid item xs={4}><Typography variant="body2">TYPE</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2" className={classes.highlight}>{displayType}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">ENDING</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{displayEnd}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">CLASS</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{fieldsData.class}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">STATUS</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{fieldsData.status}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">PROVIDER</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{fieldsData.provider}</Typography></Grid>
    </>
  )
}

export default EncounterCardBody